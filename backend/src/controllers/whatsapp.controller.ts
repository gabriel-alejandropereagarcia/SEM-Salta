import { Request, Response } from 'express';
import { WA_CONFIG } from '../config';
import { supabase } from '../config/supabase';
import { parseCommand } from '../utils/messageParser';
import {
  formatEstacionarSuccess,
  formatFinSuccess,
  formatSaldo,
  formatTarifas,
  formatAyuda,
  formatError,
  formatRecargarLink,
  formatWelcome,
  formatActiveSession,
} from '../utils/responseBuilder';
import { buscarOCrearUsuarioWa, iniciarSesion, finalizarSesion, obtenerSesionActiva } from '../services/parking.service';
import { consultarSaldo, crearCargaSaldo } from '../services/wallet.service';
import { crearPreferenciaMercadoPago } from './mp.controller';

export async function verifyWebhook(req: Request, res: Response): Promise<void> {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WA_CONFIG.verifyToken) {
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
}

export async function handleIncomingMessage(req: Request, res: Response): Promise<void> {
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const messages = change.value.messages;
        if (!messages) continue;

        for (const msg of messages) {
          const phoneNumber = msg.from;

          if (msg.type === 'text') {
            const text = msg.text.body;
            await processMessage(phoneNumber, text);
          } else {
            await sendWhatsAppMessage(phoneNumber, formatWelcome());
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing WA webhook:', error);
  }
}

async function processMessage(phoneNumber: string, text: string): Promise<void> {
  const parsed = parseCommand(text);

  try {
    const usuario = await buscarOCrearUsuarioWa(phoneNumber);
    const isNewUser = usuario.saldo_billetera === 0 && !usuario.nombre;

    if (isNewUser && parsed.cmd === 'AYUDA') {
      const welcomeMsg = formatWelcome();
      await sendWhatsAppMessage(phoneNumber, welcomeMsg);
      return;
    }

    switch (parsed.cmd) {
      case 'ESTACIONAR': {
        if (!parsed.cuc || !parsed.patente) {
          await sendWhatsAppMessage(phoneNumber,
            formatError('Formato incorrecto. Escribí:\n\n*ESTACIONAR <ZONA> <PATENTE>*\nEjemplo: ESTACIONAR A12 ABC123D\n\nSi es moto agregá MOTO al final.')
          );
          return;
        }
        const result = await iniciarSesion(usuario.id, parsed.cuc, parsed.patente, parsed.tipoVehiculo);
        if (!result.sesion) {
          if (result.costoMinimo && result.costoMinimo > 0) {
            // This means patente was invalid or other validation failure
            await sendWhatsAppMessage(phoneNumber,
              formatError('No se pudo iniciar la sesión. Verificá la zona y patente.')
            );
          }
          return;
        }

        const { data: zona } = await supabase.from('zonas').select('cuc').eq('id', result.sesion.id_zona).single();

        if (result.sinSaldo) {
          await sendWhatsAppMessage(phoneNumber, formatEstacionarSuccess(result.sesion, zona?.cuc || parsed.cuc, true));
        } else {
          await sendWhatsAppMessage(phoneNumber, formatEstacionarSuccess(result.sesion, zona?.cuc || parsed.cuc, false));
        }
        break;
      }

      case 'FIN': {
        const result = await finalizarSesion(usuario.id);
        if (result.error) {
          await sendWhatsAppMessage(phoneNumber, formatError(result.error));
          return;
        }
        await sendWhatsAppMessage(phoneNumber, formatFinSuccess(result.sesion, result.fareInfo, result.esEfectivo));
        break;
      }

      case 'SALDO': {
        const saldo = await consultarSaldo(usuario.id);
        const sesionActiva = await obtenerSesionActiva(usuario.id);
        let msg = formatSaldo(saldo);
        if (sesionActiva) {
          const { data: zona } = await supabase.from('zonas').select('cuc').eq('id', sesionActiva.id_zona).single();
          msg += '\n\n' + formatActiveSession(sesionActiva, zona?.cuc || '');
        }
        await sendWhatsAppMessage(phoneNumber, msg);
        break;
      }

      case 'RECARGAR': {
        if (!parsed.monto || parsed.monto <= 0) {
          await sendWhatsAppMessage(phoneNumber,
            formatError('Escribí *RECARGAR* seguido del monto.\n\nEjemplos:\n• RECARGAR 1000\n• RECARGAR 5000\n• RECARGAR 10000')
          );
          return;
        }
        if (parsed.monto < 500) {
          await sendWhatsAppMessage(phoneNumber, formatError('El monto mínimo de recarga es $500.'));
          return;
        }
        const preference = await crearPreferenciaMercadoPago(usuario.id, parsed.monto, phoneNumber);
        await crearCargaSaldo(usuario.id, parsed.monto, preference.id);
        await sendWhatsAppMessage(phoneNumber, formatRecargarLink(preference.init_point, parsed.monto));
        break;
      }

      case 'TARIFAS': {
        await sendWhatsAppMessage(phoneNumber, formatTarifas());
        break;
      }

      case 'AYUDA': {
        await sendWhatsAppMessage(phoneNumber, formatAyuda());
        break;
      }

      default: {
        const sesionActiva = await obtenerSesionActiva(usuario.id);
        let helpMsg = '';
        if (sesionActiva) {
          const { data: zona } = await supabase.from('zonas').select('cuc').eq('id', sesionActiva.id_zona).single();
          helpMsg = `⚠️ Tenés una sesión activa en zona *${zona?.cuc}*, patente *${sesionActiva.patente}*.\n\n`;
          helpMsg += `Para finalizarla escribí *FIN*.\n\n`;
        }
        helpMsg += formatAyuda();
        await sendWhatsAppMessage(phoneNumber, helpMsg);
        break;
      }
    }
  } catch (error) {
    console.error('Error in processMessage:', error);
    await sendWhatsAppMessage(phoneNumber, formatError('Ocurrió un error procesando tu mensaje. Intentá de nuevo en unos segundos.'));
  }
}

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  try {
    const response = await fetch(WA_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_CONFIG.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('WhatsApp API error:', response.status, errorBody);
    }
  } catch (error) {
    console.error('Error sending WA message:', error);
  }
}
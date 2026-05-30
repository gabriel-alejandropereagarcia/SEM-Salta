import { Request, Response } from 'express';
import { mpClient, Preference } from '../config/mercadopago';
import { APP_CONFIG } from '../config';
import { supabase } from '../config/supabase';
import { cargarSaldo } from '../services/wallet.service';
import { crearCargaSaldo } from '../services/wallet.service';
import { buscarOCrearUsuarioWa } from '../services/parking.service';
import { sendWhatsAppMessage } from './whatsapp.controller';
import crypto from 'crypto';

export async function crearPreferenciaMercadoPago(
  userId: string,
  monto: number,
  phoneNumber: string
): Promise<{ id: string; init_point: string }> {
  const externalReference = crypto.randomUUID();

  const preference = new Preference(mpClient);
  const result = await preference.create({
    body: {
      items: [
        {
          id: `saldo-${externalReference}`,
          title: `Recarga SEM Salta - $${monto}`,
          quantity: 1,
          unit_price: monto,
          currency_id: 'ARS',
        },
      ],
      payer: {
        phone: { number: phoneNumber },
      },
      external_reference: externalReference,
      notification_url: `${APP_CONFIG.frontendUrl}/api/mp/webhook`,
      back_urls: {
        success: `${APP_CONFIG.frontendUrl}/recarga/exito`,
        failure: `${APP_CONFIG.frontendUrl}/recarga/error`,
        pending: `${APP_CONFIG.frontendUrl}/recarga/pendiente`,
      },
      auto_return: 'approved',
      metadata: {
        user_id: userId,
        phone_number: phoneNumber,
      },
    },
  });

  return {
    id: result.id!,
    init_point: result.init_point!,
  };
}

export async function handleMercadoPagoWebhook(req: Request, res: Response): Promise<void> {
  res.status(200).send('OK');

  try {
    const { type, data } = req.body;

    if (type !== 'payment') return;

    const paymentId = data?.id;
    if (!paymentId) return;

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await response.json() as any;

    if (payment.status !== 'approved') return;

    const userId = payment.metadata?.user_id;
    const phoneNumber = payment.metadata?.phone_number;
    const monto = payment.transaction_amount;

    if (!userId || !monto) return;

    const { data: existingCarga } = await supabase
      .from('cargas_saldo')
      .select('id, estado')
      .eq('mp_payment_id', String(paymentId))
      .single();

    if (existingCarga?.estado === 'aprobado') return;

    await cargarSaldo(userId, monto, String(paymentId));

    if (phoneNumber) {
      await sendWhatsAppMessage(
        phoneNumber,
        `✅ *Recarga exitosa*\nSe cargaron $${monto} en tu billetera.\n\nEscribí SALDO para verificar.`
      );
    }
  } catch (error) {
    console.error('Error processing MP webhook:', error);
  }
}

export async function createPreferenceHandler(req: Request, res: Response): Promise<void> {
  try {
    const { phoneNumber, amount } = req.body;

    if (!phoneNumber || !amount || amount <= 0) {
      res.status(400).json({ error: 'phoneNumber y amount (positivo) son requeridos' });
      return;
    }

    const usuario = await buscarOCrearUsuarioWa(phoneNumber);
    const preference = await crearPreferenciaMercadoPago(usuario.id, amount, phoneNumber);

    await crearCargaSaldo(usuario.id, amount, preference.id);

    res.json({ preferenceId: preference.id, initPoint: preference.init_point });
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
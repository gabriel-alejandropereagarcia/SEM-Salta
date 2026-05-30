import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { APP_CONFIG } from '../config';
import { buscarOCrearUsuarioWa, iniciarSesion, finalizarSesion } from '../services/parking.service';
import { consultarSaldo, cargarSaldo } from '../services/wallet.service';

const router = Router();

router.post('/create-user', async (req: Request, res: Response) => {
  try {
    const { telefono, nombre } = req.body;
    if (!telefono) {
      res.status(400).json({ error: 'Telefono es requerido' });
      return;
    }

    const usuario = await buscarOCrearUsuarioWa(telefono);

    if (nombre && !usuario.nombre) {
      await supabase.from('usuarios_wa').update({ nombre }).eq('id', usuario.id);
      usuario.nombre = nombre;
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

router.post('/estacionar', async (req: Request, res: Response) => {
  try {
    const { telefono, cuc, patente, tipoVehiculo } = req.body;
    if (!telefono || !cuc || !patente) {
      res.status(400).json({ error: 'telefono, cuc y patente son requeridos' });
      return;
    }

    const usuario = await buscarOCrearUsuarioWa(telefono);
    const result = await iniciarSesion(usuario.id, cuc, patente, tipoVehiculo);

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.sesion);
  } catch (error) {
    res.status(500).json({ error: 'Error iniciando sesion' });
  }
});

router.post('/fin', async (req: Request, res: Response) => {
  try {
    const { telefono } = req.body;
    if (!telefono) {
      res.status(400).json({ error: 'telefono es requerido' });
      return;
    }

    const usuario = await buscarOCrearUsuarioWa(telefono);
    const result = await finalizarSesion(usuario.id);

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    const saldo = await consultarSaldo(usuario.id);
    res.json({
      sesion: result.sesion,
      costo: result.fareInfo.costoFinal,
      saldoRestante: saldo,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error finalizando sesion' });
  }
});

router.get('/saldo/:telefono', async (req: Request, res: Response) => {
  try {
    const { telefono } = req.params;
    const usuario = await buscarOCrearUsuarioWa(telefono);
    const saldo = await consultarSaldo(usuario.id);
    res.json({ telefono, saldo });
  } catch (error) {
    res.status(500).json({ error: 'Error consultando saldo' });
  }
});

router.post('/cargar-saldo', async (req: Request, res: Response) => {
  try {
    const { telefono, monto } = req.body;
    if (!telefono || !monto) {
      res.status(400).json({ error: 'telefono y monto son requeridos' });
      return;
    }

    const usuario = await buscarOCrearUsuarioWa(telefono);
    await cargarSaldo(usuario.id, monto, `test-${Date.now()}`);
    const saldoActual = await consultarSaldo(usuario.id);

    res.json({ telefono, saldoAnterior: usuario.saldo_billetera, montoCargado: monto, saldoActual });
  } catch (error) {
    res.status(500).json({ error: 'Error cargando saldo' });
  }
});

router.post('/seed', async (req: Request, res: Response) => {
  try {
    const { data: zonas } = await supabase.from('zonas').select('id, cuc').limit(1);
    if (!zonas || zonas.length === 0) {
      res.status(400).json({ error: 'No hay zonas. Ejecutar migracion SQL primero.' });
      return;
    }

    const zonaId = zonas[0].id;

    const { data: permisionario, error: permError } = await supabase
      .from('permisionarios')
      .insert({
        legajo: 'P001',
        nombre: 'Juan Garcia',
        id_zona_actual: zonaId,
      })
      .select()
      .single();

    if (permError) {
      if (permError.code === '23505') {
        const { data: existing } = await supabase
          .from('permisionarios')
          .select('*')
          .eq('legajo', 'P001')
          .single();
        res.json({ permisionario: existing, message: 'Permisionario ya existe' });
        return;
      }
      throw permError;
    }

    const { data: usuario, error: userError } = await supabase
      .from('usuarios_wa')
      .insert({
        numero_telefono: '5493875555123',
        nombre: 'Conductor Demo',
        saldo_billetera: 10000,
      })
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') {
        const { data: existing } = await supabase
          .from('usuarios_wa')
          .select('*')
          .eq('numero_telefono', '5493875555123')
          .single();
        res.json({
          permisionario,
          usuario: existing,
          message: 'Permisionario creado. Usuario ya existe con saldo actualizado.',
        });
        return;
      }
      throw userError;
    }

    res.json({
      permisionario,
      usuario,
      message: 'Datos de demo creados exitosamente. Usar legajo P001 para PWA y telefono 5493875555123 para testing.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error creando seed data' });
  }
});

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const { count: zonasCount } = await supabase.from('zonas').select('*', { count: 'exact', head: true });
    const { count: sesionesCount } = await supabase.from('sesiones_estacionamiento').select('*', { count: 'exact', head: true }).eq('estado', 'activo');
    const { count: permisionariosCount } = await supabase.from('permisionarios').select('*', { count: 'exact', head: true });
    const { count: usuariosCount } = await supabase.from('usuarios_wa').select('*', { count: 'exact', head: true });

    res.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      stats: {
        zonas: zonasCount || 0,
        sesionesActivas: sesionesCount || 0,
        permisionarios: permisionariosCount || 0,
        usuarios: usuariosCount || 0,
      },
      config: {
        tarifas: {
          auto: { base: APP_CONFIG.fare.auto.base, digital: APP_CONFIG.fare.auto.digital },
          moto: { base: APP_CONFIG.fare.moto.base, digital: APP_CONFIG.fare.moto.digital },
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

export default router;
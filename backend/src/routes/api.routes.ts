import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

router.get('/zonas', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('zonas')
      .select('*')
      .order('cuc');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/zonas/:cuc/sesiones-activas', async (req: Request, res: Response) => {
  try {
    const { cuc } = req.params;

    const { data: zona } = await supabase
      .from('zonas')
      .select('id')
      .eq('cuc', cuc)
      .single();

    if (!zona) {
      res.status(404).json({ error: 'Zona no encontrada' });
      return;
    }

    const { data, error } = await supabase
      .from('sesiones_estacionamiento')
      .select('id, patente, tipo_vehiculo, hora_inicio, hora_fin, metodo_pago')
      .eq('id_zona', zona.id)
      .eq('estado', 'activo')
      .order('hora_inicio', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/permisionarios/:id/saldo', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('permisionarios')
      .select('id, nombre, saldo_cuenta_corriente')
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ error: 'Permisionario no encontrado' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/permisionarios/:id/transacciones', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limite = parseInt(req.query.limite as string) || 50;

    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        id, tipo, monto, descripcion, created_at,
        sesiones_estacionamiento (patente, tipo_vehiculo)
      `)
      .eq('id_permisionario', id)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/permisionarios/:id/pago-efectivo', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { patente, tipoVehiculo } = req.body;

    if (!patente || !tipoVehiculo) {
      res.status(400).json({ error: 'patente y tipoVehiculo son requeridos' });
      return;
    }

    const { registrarPagoEfectivo } = await import('../services/parking.service');

    const { data: permisionario } = await supabase
      .from('permisionarios')
      .select('id, id_zona_actual')
      .eq('id', id)
      .single();

    if (!permisionario) {
      res.status(404).json({ error: 'Permisionario no encontrado' });
      return;
    }

    const result = await registrarPagoEfectivo(id, permisionario.id_zona_actual, patente, tipoVehiculo);

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.sesion);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
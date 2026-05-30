import { supabase } from '../config/supabase';
import { TipoVehiculo } from '../types';
import { APP_CONFIG } from '../config';

export async function registrarCreditoDigital(
  permisionarioId: string,
  sesionId: string,
  patente: string,
  zonaCuc: string,
  tipoVehiculo: TipoVehiculo,
  costoTotal: number
): Promise<void> {
  await supabase.from('transacciones').insert({
    id_permisionario: permisionarioId,
    id_sesion: sesionId,
    tipo: 'credito',
    monto: costoTotal,
    descripcion: `Pago digital - Patente ${patente} en zona ${zonaCuc} (${tipoVehiculo}) - Permisionario keep 100%`,
  });
}

export async function registrarDebitoEfectivo(
  permisionarioId: string,
  sesionId: string,
  patente: string,
  tipoVehiculo: TipoVehiculo,
  horas: number = 1
): Promise<void> {
  const config = APP_CONFIG.fare[tipoVehiculo];
  const comisionPorHora = config.comisionMunicipalEfectivo;
  const montoComision = comisionPorHora * horas;

  await supabase.from('transacciones').insert({
    id_permisionario: permisionarioId,
    id_sesion: sesionId,
    tipo: 'debito',
    monto: montoComision,
    descripcion: `Comisión municipal efectivo (20%) - Patente ${patente} (${tipoVehiculo}) - ${horas}h`,
  });
}

export async function obtenerSaldoCuentaCorriente(permisionarioId: string): Promise<number> {
  const { data } = await supabase
    .from('permisionarios')
    .select('saldo_cuenta_corriente')
    .eq('id', permisionarioId)
    .single();

  return data?.saldo_cuenta_corriente ?? 0;
}

export async function obtenerHistorialTransacciones(permisionarioId: string, limite: number = 50) {
  const { data, error } = await supabase
    .from('transacciones')
    .select(`
      *,
      sesiones_estacionamiento (
        patente,
        tipo_vehiculo,
        zona:zonas (cuc, nombre_calle)
      )
    `)
    .eq('id_permisionario', permisionarioId)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) throw new Error(`Error obteniendo historial: ${error.message}`);
  return data;
}
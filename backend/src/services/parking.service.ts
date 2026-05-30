import { supabase } from '../config/supabase';
import { APP_CONFIG } from '../config';
import { TipoVehiculo, SesionEstacionamiento, UsuarioWa } from '../types';
import { calcularCostoEstacionamiento, calcularCostoMinimo, inferirTipoVehiculo, validarPatente } from './fare.service';

export async function buscarOCrearUsuarioWa(phoneNumber: string): Promise<UsuarioWa> {
  const { data: existing } = await supabase
    .from('usuarios_wa')
    .select('*')
    .eq('numero_telefono', phoneNumber)
    .single();

  if (existing) return existing as UsuarioWa;

  const { data, error } = await supabase
    .from('usuarios_wa')
    .insert({ numero_telefono: phoneNumber })
    .select()
    .single();

  if (error) throw new Error(`Error creando usuario WA: ${error.message}`);
  return data as UsuarioWa;
}

export async function iniciarSesion(
  userId: string,
  cuc: string,
  patente: string,
  tipoVehiculo?: TipoVehiculo
): Promise<{ sesion: SesionEstacionamiento; sinSaldo?: boolean; saldoInsuficiente?: number; costoMinimo?: number }> {
  const patenteUpper = patente.toUpperCase();
  if (!validarPatente(patenteUpper)) {
    return { sesion: null!, sinSaldo: false, saldoInsuficiente: 0, costoMinimo: 0 };
  }

  const tipo = tipoVehiculo || inferirTipoVehiculo(patenteUpper);

  const { data: zona } = await supabase
    .from('zonas')
    .select('*')
    .eq('cuc', cuc)
    .single();

  if (!zona) {
    return { sesion: null!, sinSaldo: false, saldoInsuficiente: 0, costoMinimo: 0 };
  }

  const { data: sesionesActivas } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .eq('id_zona', zona.id)
    .in('estado', ['activo', 'pendiente_cobro']);

  if (sesionesActivas && sesionesActivas.length >= zona.capacidad) {
    return { sesion: null!, sinSaldo: false, saldoInsuficiente: 0, costoMinimo: 0 };
  }

  const { data: sesionActiva } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .eq('id_usuario_wa', userId)
    .in('estado', ['activo', 'pendiente_cobro'])
    .single();

  if (sesionActiva) {
    return { sesion: null!, sinSaldo: false, saldoInsuficiente: 0, costoMinimo: 0 };
  }

  const { data: usuario } = await supabase
    .from('usuarios_wa')
    .select('saldo_billetera')
    .eq('id', userId)
    .single();

  if (!usuario) {
    return { sesion: null!, sinSaldo: false, saldoInsuficiente: 0, costoMinimo: 0 };
  }

  const costoMinimo = calcularCostoMinimo(tipo);
  const saldoInsuficiente = usuario.saldo_billetera < costoMinimo;
  const metodoPago: 'digital' | 'efectivo' = saldoInsuficiente ? 'efectivo' : 'digital';
  const estado: 'activo' | 'pendiente_cobro' = saldoInsuficiente ? 'pendiente_cobro' : 'activo';

  const horaInicio = new Date();
  const horaFin = new Date(horaInicio.getTime() + 60 * 60 * 1000);

  const { data: permisionarios } = await supabase
    .from('permisionarios')
    .select('id')
    .eq('id_zona_actual', zona.id)
    .limit(1);

  const idPermisionario = permisionarios?.[0]?.id || null;

  const { data: sesion, error } = await supabase
    .from('sesiones_estacionamiento')
    .insert({
      patente: patenteUpper,
      id_zona: zona.id,
      id_usuario_wa: userId,
      id_permisionario: idPermisionario,
      tipo_vehiculo: tipo,
      hora_inicio: horaInicio.toISOString(),
      hora_fin: horaFin.toISOString(),
      estado,
      metodo_pago: metodoPago,
    })
    .select()
    .single();

  if (error) throw new Error(`Error creando sesión: ${error.message}`);

  return { sesion: sesion as SesionEstacionamiento, sinSaldo: saldoInsuficiente, saldoInsuficiente: usuario.saldo_billetera, costoMinimo };
}

export async function finalizarSesion(userId: string): Promise<{
  sesion: SesionEstacionamiento;
  fareInfo: ReturnType<typeof calcularCostoEstacionamiento>;
  esEfectivo?: boolean;
  error?: string;
}> {
  const { data: sesion } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .in('estado', ['activo', 'pendiente_cobro'])
    .eq('id_usuario_wa', userId)
    .single();

  if (!sesion) {
    return { sesion: null!, fareInfo: null!, error: '❌ No tenés una sesión activa.' };
  }

  const esEfectivo = sesion.metodo_pago === 'efectivo' || sesion.estado === 'pendiente_cobro';

  const horaFin = new Date();
  const horaInicio = new Date(sesion.hora_inicio);
  const fareInfo = calcularCostoEstacionamiento(
    sesion.tipo_vehiculo as TipoVehiculo,
    horaInicio,
    horaFin
  );

  const { data: sesionActualizada } = await supabase
    .from('sesiones_estacionamiento')
    .update({
      hora_fin: horaFin.toISOString(),
      costo_total: fareInfo.costoFinal,
      estado: 'finalizado',
    })
    .eq('id', sesion.id)
    .select()
    .single();

  if (esEfectivo) {
    if (sesion.id_permisionario) {
      const { data: zona } = await supabase
        .from('zonas')
        .select('cuc')
        .eq('id', sesion.id_zona)
        .single();

      await supabase.from('transacciones').insert({
        id_permisionario: sesion.id_permisionario,
        id_sesion: sesion.id,
        tipo: 'debito',
        monto: fareInfo.comisionMunicipalEfectivo,
        descripcion: `Pago efectivo - Comisión municipal 20% - Patente ${sesion.patente} en zona ${zona?.cuc || sesion.id_zona} (${sesion.tipo_vehiculo})`,
      });
    }
  } else {
    const { data: usuario } = await supabase
      .from('usuarios_wa')
      .select('saldo_billetera')
      .eq('id', userId)
      .single();

    if (!usuario) {
      return { sesion: null!, fareInfo: null!, error: '❌ Usuario no encontrado.' };
    }

    const nuevoSaldo = Number(usuario.saldo_billetera) - fareInfo.costoFinal;

    await supabase
      .from('usuarios_wa')
      .update({ saldo_billetera: Math.max(nuevoSaldo, 0) })
      .eq('id', userId);

    if (sesion.id_permisionario) {
      const { data: zona } = await supabase
        .from('zonas')
        .select('cuc')
        .eq('id', sesion.id_zona)
        .single();

      await supabase.from('transacciones').insert({
        id_permisionario: sesion.id_permisionario,
        id_sesion: sesion.id,
        tipo: 'credito',
        monto: fareInfo.gananciaPermisionarioDigital,
        descripcion: `Pago digital - Patente ${sesion.patente} en zona ${zona?.cuc || sesion.id_zona} (${sesion.tipo_vehiculo}) - Permisionario keep 100%`,
      });
    }
  }

  return { sesion: sesionActualizada as SesionEstacionamiento, fareInfo, esEfectivo };
}

export async function obtenerSesionActiva(userId: string): Promise<SesionEstacionamiento | null> {
  const { data } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .in('estado', ['activo', 'pendiente_cobro'])
    .eq('id_usuario_wa', userId)
    .single();

  return data as SesionEstacionamiento | null;
}

export async function confirmarCobroEfectivo(
  permisionarioId: string,
  sesionId: string
): Promise<{ sesion: SesionEstacionamiento; error?: string }> {
  const { data: sesion } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .eq('id', sesionId)
    .eq('estado', 'pendiente_cobro')
    .single();

  if (!sesion) {
    return { sesion: null!, error: '❌ No se encontró la sesión pendiente de cobro.' };
  }

  const { data: permisionario } = await supabase
    .from('permisionarios')
    .select('id_zona_actual')
    .eq('id', permisionarioId)
    .single();

  if (!permisionario || permisionario.id_zona_actual !== sesion.id_zona) {
    return { sesion: null!, error: '❌ La sesión no pertenece a tu zona.' };
  }

  const { data: sesionActualizada, error } = await supabase
    .from('sesiones_estacionamiento')
    .update({ estado: 'activo' })
    .eq('id', sesionId)
    .select()
    .single();

  if (error) {
    return { sesion: null!, error: `Error confirmando cobro: ${error.message}` };
  }

  const tarifas = APP_CONFIG.fare[sesion.tipo_vehiculo as TipoVehiculo];

  await supabase.from('transacciones').insert({
    id_permisionario: permisionarioId,
    id_sesion: sesion.id,
    tipo: 'debito',
    monto: tarifas.comisionMunicipalEfectivo,
    descripcion: `Comisión municipal 20% efectivo - Patente ${sesion.patente} (${sesion.tipo_vehiculo})`,
  });

  return { sesion: sesionActualizada as SesionEstacionamiento };
}

export async function registrarPagoEfectivo(
  permisionarioId: string,
  zonaId: string,
  patente: string,
  tipoVehiculo: TipoVehiculo
): Promise<{ sesion: SesionEstacionamiento; error?: string }> {
  const patenteUpper = patente.toUpperCase();
  if (!validarPatente(patenteUpper)) {
    return { sesion: null!, error: '❌ Patente inválida.' };
  }

  const { data: sesionActiva } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .eq('patente', patenteUpper)
    .eq('id_zona', zonaId)
    .in('estado', ['activo', 'pendiente_cobro'])
    .single();

  if (sesionActiva) {
    return { sesion: null!, error: `❌ Ya existe una sesión activa para ${patenteUpper} en esta zona.` };
  }

  const horaInicio = new Date();
  const horaFin = new Date(horaInicio.getTime() + 60 * 60 * 1000);
  const tarifas = APP_CONFIG.fare[tipoVehiculo];

  const { data: sesion, error } = await supabase
    .from('sesiones_estacionamiento')
    .insert({
      patente: patenteUpper,
      id_zona: zonaId,
      id_usuario_wa: null,
      id_permisionario: permisionarioId,
      tipo_vehiculo: tipoVehiculo,
      hora_inicio: horaInicio.toISOString(),
      hora_fin: horaFin.toISOString(),
      estado: 'activo',
      metodo_pago: 'efectivo',
    })
    .select()
    .single();

  if (error) throw new Error(`Error registrando pago efectivo: ${error.message}`);

  await supabase.from('transacciones').insert({
    id_permisionario: permisionarioId,
    id_sesion: sesion.id,
    tipo: 'debito',
    monto: tarifas.comisionMunicipalEfectivo,
    descripcion: `Comisión municipal 20% efectivo - Patente ${patenteUpper} (${tipoVehiculo})`,
  });

  return { sesion: sesion as SesionEstacionamiento };
}
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
): Promise<{ sesion: SesionEstacionamiento; error?: string }> {
  const patenteUpper = patente.toUpperCase();
  if (!validarPatente(patenteUpper)) {
    return { sesion: null!, error: '❌ Patente inválida. Formato: ABC123 o AB123CD' };
  }

  const tipo = tipoVehiculo || inferirTipoVehiculo(patenteUpper);

  const { data: zona } = await supabase
    .from('zonas')
    .select('*')
    .eq('cuc', cuc)
    .single();

  if (!zona) {
    return { sesion: null!, error: `❌ No se encontró la zona con CUC "${cuc}". Verificá el código.` };
  }

  const { data: sesionesActivas } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .eq('id_zona', zona.id)
    .eq('estado', 'activo');

  if (sesionesActivas && sesionesActivas.length >= zona.capacidad) {
    return { sesion: null!, error: `❌ La zona ${cuc} está llena (${zona.capacidad}/${zona.capacidad} lugares ocupados).` };
  }

  const { data: sesionActiva } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .eq('id_usuario_wa', userId)
    .eq('estado', 'activo')
    .single();

  if (sesionActiva) {
    return { sesion: null!, error: '❌ Ya tenés una sesión activa. Usá FIN para finalizarla primero.' };
  }

  const { data: usuario } = await supabase
    .from('usuarios_wa')
    .select('saldo_billetera')
    .eq('id', userId)
    .single();

  if (!usuario) {
    return { sesion: null!, error: '❌ Usuario no encontrado.' };
  }

  const costoMinimo = calcularCostoMinimo(tipo);
  if (usuario.saldo_billetera < costoMinimo) {
    return {
      sesion: null!,
      error: `❌ Saldo insuficiente. Necesitás $${costoMinimo} (1h ${tipo}) y tenés $${usuario.saldo_billetera}. Recargá con RECARGAR.`,
    };
  }

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
      estado: 'activo',
      metodo_pago: 'digital',
    })
    .select()
    .single();

  if (error) throw new Error(`Error creando sesión: ${error.message}`);

  return { sesion: sesion as SesionEstacionamiento };
}

export async function finalizarSesion(userId: string): Promise<{ sesion: SesionEstacionamiento; fareInfo: ReturnType<typeof calcularCostoEstacionamiento>; error?: string }> {
  const { data: sesion } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .eq('id_usuario_wa', userId)
    .eq('estado', 'activo')
    .single();

  if (!sesion) {
    return { sesion: null!, fareInfo: null!, error: '❌ No tenés una sesión activa.' };
  }

  const horaFin = new Date();
  const horaInicio = new Date(sesion.hora_inicio);
  const fareInfo = calcularCostoEstacionamiento(
    sesion.tipo_vehiculo as TipoVehiculo,
    horaInicio,
    horaFin
  );

  const { data: usuario } = await supabase
    .from('usuarios_wa')
    .select('saldo_billetera')
    .eq('id', userId)
    .single();

  if (!usuario) {
    return { sesion: null!, fareInfo: null!, error: '❌ Usuario no encontrado.' };
  }

  if (usuario.saldo_billetera < fareInfo.costoFinal) {
    return {
      sesion: sesion as SesionEstacionamiento,
      fareInfo,
      error: `❌ Saldo insuficiente para finalizar. Costo: $${fareInfo.costoFinal}, Saldo: $${usuario.saldo_billetera}`,
    };
  }

  const nuevoSaldo = Number(usuario.saldo_billetera) - fareInfo.costoFinal;

  await supabase
    .from('usuarios_wa')
    .update({ saldo_billetera: nuevoSaldo })
    .eq('id', userId);

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
      monto: fareInfo.gananciaPermisionario,
      descripcion: `Pago digital - Patente ${sesion.patente} en zona ${zona?.cuc || sesion.id_zona}`,
    });
  }

  return { sesion: sesionActualizada as SesionEstacionamiento, fareInfo };
}

export async function obtenerSesionActiva(userId: string): Promise<SesionEstacionamiento | null> {
  const { data } = await supabase
    .from('sesiones_estacionamiento')
    .select('*')
    .eq('id_usuario_wa', userId)
    .eq('estado', 'activo')
    .single();

  return data as SesionEstacionamiento | null;
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
    .eq('estado', 'activo')
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
    monto: tarifas.comisionMunicipal,
    descripcion: `Comisión municipal efectivo - Patente ${patenteUpper} (${tipoVehiculo})`,
  });

  return { sesion: sesion as SesionEstacionamiento };
}
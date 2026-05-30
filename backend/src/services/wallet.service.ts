import { supabase } from '../config/supabase';
import { UsuarioWa } from '../types';

export async function consultarSaldo(userId: string): Promise<number> {
  const { data } = await supabase
    .from('usuarios_wa')
    .select('saldo_billetera')
    .eq('id', userId)
    .single();

  return data?.saldo_billetera ?? 0;
}

export async function descontarSaldo(userId: string, monto: number): Promise<UsuarioWa> {
  const { data: usuario } = await supabase
    .from('usuarios_wa')
    .select('saldo_billetera')
    .eq('id', userId)
    .single();

  if (!usuario) throw new Error('Usuario no encontrado');
  if (usuario.saldo_billetera < monto) throw new Error('Saldo insuficiente');

  const nuevoSaldo = Number(usuario.saldo_billetera) - monto;

  const { data, error } = await supabase
    .from('usuarios_wa')
    .update({ saldo_billetera: nuevoSaldo })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(`Error descontando saldo: ${error.message}`);
  return data as UsuarioWa;
}

export async function cargarSaldo(userId: string, monto: number, mpPaymentId: string): Promise<void> {
  const { data: carga } = await supabase
    .from('cargas_saldo')
    .select('id, estado')
    .eq('mp_payment_id', mpPaymentId)
    .single();

  if (carga && carga.estado === 'aprobado') {
    return;
  }

  const { data: usuario } = await supabase
    .from('usuarios_wa')
    .select('saldo_billetera')
    .eq('id', userId)
    .single();

  if (!usuario) throw new Error('Usuario no encontrado');

  const nuevoSaldo = Number(usuario.saldo_billetera) + monto;

  const { error: error_update } = await supabase
    .from('usuarios_wa')
    .update({ saldo_billetera: nuevoSaldo })
    .eq('id', userId);

  if (error_update) throw new Error(`Error cargando saldo: ${error_update.message}`);

  if (carga) {
    await supabase
      .from('cargas_saldo')
      .update({ estado: 'aprobado' })
      .eq('id', carga.id);
  }
}

export async function crearCargaSaldo(userId: string, monto: number, mpPreferenceId: string): Promise<string> {
  const { data, error } = await supabase
    .from('cargas_saldo')
    .insert({
      id_usuario_wa: userId,
      monto,
      mp_preference_id: mpPreferenceId,
      estado: 'pendiente',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Error creando carga: ${error.message}`);
  return data.id;
}

export async function actualizarCargaConPaymentId(cargaId: string, mpPaymentId: string): Promise<void> {
  await supabase
    .from('cargas_saldo')
    .update({ mp_payment_id: mpPaymentId, estado: 'aprobado' })
    .eq('id', cargaId);
}
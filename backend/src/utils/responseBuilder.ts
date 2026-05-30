import { SesionEstacionamiento, FareResult } from '../types';
import { obtenerTarifas } from '../services/fare.service';

export function formatEstacionarSuccess(sesion: SesionEstacionamiento, cuc: string): string {
  const horaFin = new Date(sesion.hora_fin!);
  const horaInicio = new Date(sesion.hora_inicio);
  const horaFinStr = horaFin.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return [
    `✅ *Estacionamiento iniciado*`,
    `🚗 Patente: ${sesion.patente}`,
    `📍 Zona: ${cuc}`,
    `🕐 Hasta: ${horaFinStr}`,
    `📱 Pago digital - 20% descuento aplicado`,
    ``,
    `Escribí *FIN* cuando quieras terminar.`,
  ].join('\n');
}

export function formatFinSuccess(sesion: SesionEstacionamiento, fareInfo: FareResult, saldoRestante: number): string {
  const duracion = fareInfo.horas > 0
    ? `${fareInfo.horas}h ${fareInfo.minutosExcedentes}min`
    : `< 1h`;

  return [
    `🏁 *Estacionamiento finalizado*`,
    `🚗 Patente: ${sesion.patente}`,
    `⏱ Duración: ${duracion}`,
    `💰 Costo: $${fareInfo.costoFinal}`,
    `📄 Saldo restante: $${saldoRestante}`,
    ``,
    `¡Gracias por usar SEM Digital! 🙏`,
  ].join('\n');
}

export function formatSaldo(saldo: number): string {
  return [
    `💰 *Tu saldo*`,
    `Disponible: $${saldo.toFixed(2)}`,
    ``,
    `Para recargar escribí: *RECARGAR monto*`,
    `Ejemplo: RECARGAR 5000`,
  ].join('\n');
}

export function formatTarifas(): string {
  const tarifas = obtenerTarifas();
  return [
    `📋 *Tarifas SEM Salta*`,
    ``,
    `🚗 *Auto*`,
    `  Tarifa base: $${tarifas.auto.base}/h`,
    `  Tarifa digital: $${tarifas.auto.digital}/h (${tarifas.auto.descuento})`,
    ``,
    `🏍 *Moto*`,
    `  Tarifa base: $${tarifas.moto.base}/h`,
    `  Tarifa digital: $${tarifas.moto.digital}/h (${tarifas.moto.descuento})`,
    ``,
    `Fraccionamiento: cada 15 min (desde 2da hora)`,
    `Tolerancia: 5 min`,
  ].join('\n');
}

export function formatAyuda(): string {
  return [
    `🅿️ *SEM Salta - Comandos*`,
    ``,
    `1️⃣ *ESTACIONAR <ZONA> <PATENTE>*`,
    `   Ej: ESTACIONAR A12 ABC123D`,
    `   (Agregá AUTO o MOTO para tipo)`,
    ``,
    `2️⃣ *FIN* - Finalizar estacionamiento`,
    `3️⃣ *SALDO* - Consultar saldo`,
    `4️⃣ *RECARGAR <MONTO>* - Recargar billetera`,
    `   Ej: RECARGAR 5000`,
    `5️⃣ *TARIFAS* - Ver tarifas vigentes`,
  ].join('\n');
}

export function formatError(message: string): string {
  return `❌ ${message}`;
}

export function formatRecargarLink(preferenceUrl: string, monto: number): string {
  return [
    `💳 *Recarga de saldo*`,
    `Monto: $${monto}`,
    ``,
    `Pagá en el siguiente link:`,
    `${preferenceUrl}`,
    ``,
    `El saldo se acreditará automáticamente.`,
  ].join('\n');
}

export function formatWelcome(): string {
  return [
    `👋 *Bienvenido al SEM Salta Digital*`,
    ``,
    `Estacionamiento medido más fácil, rápido y con descuento.`,
    ``,
    `🚗 *¿Cómo funciona?*`,
    `1️⃣ Recargá saldo: *RECARGAR 5000*`,
    `2️⃣ Estacioná: *ESTACIONAR A12 ABC123D*`,
    `3️⃣ Cuando te vayas: *FIN*`,
    ``,
    `📱 *Pagando digitalmente tenés 20% de descuento*`,
    `🚗 Auto: $560/h en vez de $700/h`,
    `🏍 Moto: $240/h en vez de $300/h`,
    ``,
    `Escribí *AYUDA* para ver todos los comandos.`,
  ].join('\n');
}

export function formatActiveSession(sesion: SesionEstacionamiento, cuc: string): string {
  const horaInicio = new Date(sesion.hora_inicio).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const horaFin = new Date(sesion.hora_fin!).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const tipoEmoji = sesion.tipo_vehiculo === 'moto' ? '🏍' : '🚗';
  return [
    `📋 *Sesión activa*`,
    `${tipoEmoji} ${sesion.patente} en zona ${cuc}`,
    `🕐 ${horaInicio} → ${horaFin}`,
    `📱 ${sesion.metodo_pago === 'digital' ? 'Digital (con descuento)' : 'Efectivo'}`,
  ].join('\n');
}
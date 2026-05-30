import { ParsedCommand } from '../types';

export function parseCommand(text: string): ParsedCommand {
  const normalized = text.trim().toUpperCase();

  if (normalized === 'FIN' || normalized === 'FINALIZAR' || normalized === 'TERMINAR') {
    return { cmd: 'FIN' };
  }

  if (normalized === 'SALDO' || normalized === 'CUENTA' || normalized === 'BILLETERA') {
    return { cmd: 'SALDO' };
  }

  if (normalized === 'TARIFAS' || normalized === 'PRECIOS' || normalized === 'COSTO') {
    return { cmd: 'TARIFAS' };
  }

  if (normalized.startsWith('RECARGAR') || normalized.startsWith('CARGAR') || normalized.startsWith('RECARGA')) {
    const parts = normalized.split(/\s+/);
    const monto = parseInt(parts[1], 10);
    if (!isNaN(monto) && monto > 0) {
      return { cmd: 'RECARGAR', monto };
    }
    return { cmd: 'RECARGAR', monto: 0 };
  }

  if (normalized.startsWith('ESTACIONAR') || normalized.startsWith('ESTACIONAMIENTO') || normalized.startsWith('ESTACIONO') || normalized.startsWith('INICIAR') || normalized.startsWith('EMPEZAR')) {
    const parts = normalized.split(/\s+/);
    const keywordIdx = 0;
    if (parts.length >= 3) {
      const cuc = parts[keywordIdx + 1];
      const patente = parts[keywordIdx + 2];
      let tipoVehiculo: 'auto' | 'moto' | undefined;
      if (parts.length >= 4 && (parts[3] === 'AUTO' || parts[3] === 'MOTO')) {
        tipoVehiculo = parts[3].toLowerCase() as 'auto' | 'moto';
      }
      return { cmd: 'ESTACIONAR', cuc, patente, tipoVehiculo };
    }
    if (parts.length === 2) {
      return { cmd: 'ESTACIONAR', cuc: parts[1], patente: undefined, tipoVehiculo: undefined };
    }
    return { cmd: 'DESCONOCIDO' };
  }

  if (normalized === 'AYUDA' || normalized === 'HELP' || normalized === 'HOLA' || normalized === 'HI' || normalized === 'HOLA!' || normalized === 'BUENAS' || normalized === 'BUENOSDIAS' || normalized === 'BUENASTARDES') {
    return { cmd: 'AYUDA' };
  }

  if (normalized.startsWith('ESTADO') || normalized.startsWith('INFO') || normalized.startsWith('CONSULTA')) {
    return { cmd: 'SALDO' };
  }

  return { cmd: 'DESCONOCIDO' };
}
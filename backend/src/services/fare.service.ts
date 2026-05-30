import { TipoVehiculo, FareResult } from '../types';
import { APP_CONFIG } from '../config';

const { fare } = APP_CONFIG;

export function calcularCostoEstacionamiento(
  tipoVehiculo: TipoVehiculo,
  horaInicio: Date,
  horaFin: Date
): FareResult {
  const tarifas = fare[tipoVehiculo];
  const diffMs = horaFin.getTime() - horaInicio.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin <= 0) {
    return {
      tarifaBase: tarifas.base,
      costoFinal: tarifas.base,
      comisionMunicipalEfectivo: tarifas.comisionMunicipalEfectivo,
      gananciaPermisionarioDigital: tarifas.base,
      horas: 0,
      minutosExcedentes: 0,
    };
  }

  const horasCompletas = Math.floor(diffMin / 60);
  const minutosRestantes = diffMin % 60;

  let costoFinal: number;
  let minutosExcedentes: number;

  if (horasCompletas < 1) {
    costoFinal = tarifas.base;
    minutosExcedentes = 0;
  } else {
    costoFinal = horasCompletas * tarifas.base;

    if (minutosRestantes > fare.toleranciaMinutos) {
      const fracciones15min = Math.ceil(minutosRestantes / fare.fraccionamientoMinutos);
      minutosExcedentes = fracciones15min * fare.fraccionamientoMinutos;
      costoFinal += (minutosExcedentes / 60) * tarifas.base;
    } else {
      minutosExcedentes = 0;
    }
  }

  return {
    tarifaBase: tarifas.base,
    costoFinal: Math.round(costoFinal * 100) / 100,
    comisionMunicipalEfectivo: tarifas.comisionMunicipalEfectivo * Math.ceil(costoFinal / tarifas.base),
    gananciaPermisionarioDigital: Math.round(costoFinal * 100) / 100,
    horas: horasCompletas,
    minutosExcedentes,
  };
}

export function calcularCostoMinimo(tipoVehiculo: TipoVehiculo): number {
  return fare[tipoVehiculo].base;
}

export function obtenerTarifas(): Record<string, { base: number; comisionEfectivo: number; incentivoDigital: string }> {
  return {
    auto: {
      base: fare.auto.base,
      comisionEfectivo: fare.auto.comisionMunicipalEfectivo,
      incentivoDigital: 'Sin comisión municipal (permisionario keep 100%)',
    },
    moto: {
      base: fare.moto.base,
      comisionEfectivo: fare.moto.comisionMunicipalEfectivo,
      incentivoDigital: 'Sin comisión municipal (permisionario keep 100%)',
    },
  };
}

export function validarPatente(patente: string): boolean {
  const formatoNuevo = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
  const formatoViejo = /^[A-Z]{3}\d{3}$/;
  const formatoMoto = /^[A-Z]{1,2}\d{3}[A-Z]{1,3}$/;
  const upper = patente.toUpperCase();
  return formatoNuevo.test(upper) || formatoViejo.test(upper) || formatoMoto.test(upper);
}

export function inferirTipoVehiculo(patente: string): TipoVehiculo {
  const formatoMoto = /^[A-Z]{1,2}\d{3}[A-Z]{1,3}$/;
  return formatoMoto.test(patente.toUpperCase()) ? 'moto' : 'auto';
}
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
      tarifaDigital: tarifas.digital,
      comisionMunicipal: tarifas.comisionMunicipal,
      gananciaPermisionario: tarifas.permisionario,
      horas: 0,
      minutosExcedentes: 0,
      costoFinal: tarifas.digital,
    };
  }

  const horasCompletas = Math.floor(diffMin / 60);
  const minutosRestantes = diffMin % 60;

  let costoFinal: number;
  let horasFacturar: number;
  let minutosExcedentes: number;

  if (horasCompletas <= 1) {
    horasFacturar = 1;
    minutosExcedentes = 0;
    costoFinal = tarifas.digital;
  } else {
    horasFacturar = horasCompletas;

    if (minutosRestantes > fare.toleranciaMinutos) {
      const fracciones15min = Math.ceil(minutosRestantes / fare.fraccionamientoMinutos);
      minutosExcedentes = fracciones15min * fare.fraccionamientoMinutos;
    } else {
      minutosExcedentes = 0;
    }

    costoFinal = (horasFacturar * tarifas.digital) + (minutosExcedentes / 60) * tarifas.digital;
  }

  const gananciaPermisionario = costoFinal;

  return {
    tarifaBase: tarifas.base,
    tarifaDigital: tarifas.digital,
    comisionMunicipal: tarifas.comisionMunicipal,
    gananciaPermisionario: Math.round(gananciaPermisionario * 100) / 100,
    horas: horasCompletas,
    minutosExcedentes,
    costoFinal: Math.round(costoFinal * 100) / 100,
  };
}

export function calcularCostoMinimo(tipoVehiculo: TipoVehiculo): number {
  return fare[tipoVehiculo].digital;
}

export function obtenerTarifas(): Record<string, { base: number; digital: number; descuento: string }> {
  return {
    auto: {
      base: fare.auto.base,
      digital: fare.auto.digital,
      descuento: '20% de descuento digital',
    },
    moto: {
      base: fare.moto.base,
      digital: fare.moto.digital,
      descuento: '20% de descuento digital',
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
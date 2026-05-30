export type TipoVehiculo = 'auto' | 'moto';
export type EstadoSesion = 'activo' | 'pendiente_cobro' | 'finalizado' | 'anulado';
export type MetodoPago = 'digital' | 'efectivo';
export type TipoTransaccion = 'credito' | 'debito';
export type EstadoCarga = 'pendiente' | 'aprobado' | 'rechazado';

export interface Zona {
  id: string;
  cuc: string;
  nombre_calle: string;
  numero_desde: number | null;
  numero_hasta: number | null;
  capacidad: number;
  created_at: string;
}

export interface Permisionario {
  id: string;
  legajo: string;
  nombre: string;
  id_zona_actual: string;
  saldo_cuenta_corriente: number;
  created_at: string;
}

export interface UsuarioWa {
  id: string;
  numero_telefono: string;
  nombre: string | null;
  saldo_billetera: number;
  created_at: string;
}

export interface SesionEstacionamiento {
  id: string;
  patente: string;
  id_zona: string;
  id_usuario_wa: string | null;
  id_permisionario: string | null;
  tipo_vehiculo: TipoVehiculo;
  hora_inicio: string;
  hora_fin: string | null;
  custo_total: number | null;
  estado: EstadoSesion;
  metodo_pago: MetodoPago;
  created_at: string;
  updated_at: string;
}

export interface Transaccion {
  id: string;
  id_permisionario: string;
  id_sesion: string | null;
  tipo: TipoTransaccion;
  monto: number;
  descripcion: string;
  created_at: string;
}

export interface CargaSaldo {
  id: string;
  id_usuario_wa: string;
  monto: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  estado: EstadoCarga;
  created_at: string;
}

export interface ParsedCommand {
  cmd: 'ESTACIONAR' | 'FIN' | 'SALDO' | 'RECARGAR' | 'TARIFAS' | 'AYUDA' | 'DESCONOCIDO';
  cuc?: string;
  patente?: string;
  tipoVehiculo?: TipoVehiculo;
  monto?: number;
}

export interface FareResult {
  tarifaBase: number;
  costoFinal: number;
  comisionMunicipalEfectivo: number;
  gananciaPermisionarioDigital: number;
  horas: number;
  minutosExcedentes: number;
}
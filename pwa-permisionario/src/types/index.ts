export type TipoVehiculo = 'auto' | 'moto';
export type EstadoSesion = 'activo' | 'pendiente_cobro' | 'finalizado' | 'anulado';
export type MetodoPago = 'digital' | 'efectivo';

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

export interface SesionEstacionamiento {
  id: string;
  patente: string;
  id_zona: string;
  id_usuario_wa: string | null;
  id_permisionario: string | null;
  tipo_vehiculo: TipoVehiculo;
  hora_inicio: string;
  hora_fin: string | null;
  costo_total: number | null;
  estado: EstadoSesion;
  metodo_pago: MetodoPago;
  created_at: string;
  updated_at: string;
  zona?: Zona;
}

export interface Transaccion {
  id: string;
  id_permisionario: string;
  id_sesion: string | null;
  tipo: 'credito' | 'debito';
  monto: number;
  descripcion: string;
  created_at: string;
  sesiones_estacionamiento?: {
    patente: string;
    tipo_vehiculo: TipoVehiculo;
  };
}

export interface SesionConZona extends SesionEstacionamiento {
  zona?: Zona;
  tiempoRestante?: number;
}
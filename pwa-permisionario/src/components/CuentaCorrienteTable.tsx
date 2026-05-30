'use client';

import { SesionEstacionamiento, TipoVehiculo } from '@/types';

interface CuentaCorrienteTableProps {
  transacciones: Transaccion[];
  saldoActual: number;
  loading: boolean;
}

interface Transaccion {
  id: string;
  tipo: 'credito' | 'debito';
  monto: number;
  descripcion: string;
  created_at: string;
  sesiones_estacionamiento?: {
    patente: string;
    tipo_vehiculo: TipoVehiculo;
  };
}

export function CuentaCorrienteTable({ transacciones, saldoActual, loading }: CuentaCorrienteTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const totalCreditos = transacciones
    .filter((t) => t.tipo === 'credito')
    .reduce((sum, t) => sum + Number(t.monto), 0);
  const totalDebitos = transacciones
    .filter((t) => t.tipo === 'debito')
    .reduce((sum, t) => sum + Number(t.monto), 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Saldo</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">${saldoActual.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Creditos</p>
          <p className="text-xl font-extrabold text-blue-600 mt-1">${totalCreditos.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Debitos</p>
          <p className="text-xl font-extrabold text-red-500 mt-1">${totalDebitos.toFixed(2)}</p>
        </div>
      </div>

      {transacciones.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm text-slate-400">Sin movimientos aun</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transacciones.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border border-slate-200 p-4 flex justify-between items-center ${
                t.tipo === 'credito' ? '' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{t.descripcion}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(t.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ml-3 ${t.tipo === 'credito' ? 'text-emerald-600' : 'text-red-500'}`}>
                {t.tipo === 'credito' ? '+' : '-'}${Number(t.monto).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
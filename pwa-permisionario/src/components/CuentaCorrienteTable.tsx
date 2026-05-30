'use client';

import { Transaccion } from '@/types';

interface CuentaCorrienteTableProps {
  transacciones: Transaccion[];
  saldoActual: number;
  loading: boolean;
}

export function CuentaCorrienteTable({ transacciones, saldoActual, loading }: CuentaCorrienteTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600">Saldo</p>
          <p className="text-xl font-bold text-green-700">${saldoActual.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-600">Creditos</p>
          <p className="text-xl font-bold text-blue-700">${totalCreditos.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600">Debitos</p>
          <p className="text-xl font-bold text-red-700">${totalDebitos.toFixed(2)}</p>
        </div>
      </div>

      {transacciones.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Sin movimientos</p>
      ) : (
        <div className="space-y-2">
          {transacciones.map((t) => (
            <div
              key={t.id}
              className={`flex justify-between items-center p-3 rounded-lg border ${
                t.tipo === 'credito'
                  ? 'bg-green-50 border-green-100'
                  : 'bg-red-50 border-red-100'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{t.descripcion}</p>
                <p className="text-xs text-gray-500">
                  {new Date(t.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`font-bold ${
                  t.tipo === 'credito' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {t.tipo === 'credito' ? '+' : '-'}${Number(t.monto).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
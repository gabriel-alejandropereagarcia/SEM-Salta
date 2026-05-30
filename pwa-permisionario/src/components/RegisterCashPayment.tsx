'use client';

import { useState } from 'react';
import { TipoVehiculo } from '@/types';

interface RegisterCashPaymentProps {
  zonaCuc: string;
  permisionarioId: string;
  onSuccess: () => void;
}

export function RegisterCashPayment({ zonaCuc, permisionarioId, onSuccess }: RegisterCashPaymentProps) {
  const [patente, setPatente] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patente.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/permisionarios/${permisionarioId}/pago-efectivo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patente: patente.toUpperCase(),
          tipoVehiculo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al registrar pago');
        return;
      }

      setPatente('');
      onSuccess();
    } catch (err) {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-lg">
          💵
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Registrar pago en efectivo</h3>
          <p className="text-xs text-slate-400">Zona: {zonaCuc || '...'}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        El conductor paga <strong>$700 (auto)</strong> o <strong>$300 (moto)</strong> directamente. Se descuenta la comisión municipal del <strong>20%</strong> de tu cuenta corriente.
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Patente</label>
          <input
            type="text"
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            maxLength={7}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de vehiculo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipoVehiculo('auto')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition ${
                tipoVehiculo === 'auto'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🚗 Auto (-$140)
            </button>
            <button
              type="button"
              onClick={() => setTipoVehiculo('moto')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition ${
                tipoVehiculo === 'moto'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏍 Moto (-$60)
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? 'Registrando...' : 'Registrar Pago'}
        </button>
      </form>
    </div>
  );
}
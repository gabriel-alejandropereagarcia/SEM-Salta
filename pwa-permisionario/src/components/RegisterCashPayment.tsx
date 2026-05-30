'use client';

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
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        💵 Registrar Pago Efectivo
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        Zona: <span className="font-medium">{zonaCuc}</span>
      </p>
      <p className="text-xs text-gray-400 mb-3 bg-yellow-50 p-2 rounded">
        ⚠️ El conductor paga tarifa completa. Se descuenta comisión municipal (20%) de tu cuenta corriente.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Patente
          </label>
          <input
            type="text"
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            maxLength={7}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de vehiculo
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipoVehiculo('auto')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${
                tipoVehiculo === 'auto'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              🚗 Auto (-$140)
            </button>
            <button
              type="button"
              onClick={() => setTipoVehiculo('moto')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${
                tipoVehiculo === 'moto'
                  ? 'bg-orange-100 border-orange-500 text-orange-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              🏍 Moto (-$60)
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Comisión municipal: 20% de la tarifa base (solo efectivo)
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registrando...' : 'Registrar Pago'}
        </button>
      </form>
    </div>
  );
}

import { useState } from 'react';
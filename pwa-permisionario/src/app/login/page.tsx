'use client';

import { useState } from 'react';
import { usePermisionario } from '@/hooks/usePermisionario';

export default function LoginPage() {
  const { login } = usePermisionario();
  const [legajo, setLegajo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!legajo.trim()) return;

    setLoading(true);
    setError('');

    const success = await login(legajo.trim());

    if (!success) {
      setError('Legajo no encontrado. Verificá el numero.');
    } else {
      window.location.href = '/';
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🅿️</div>
          <h1 className="text-2xl font-bold text-primary-700">SEM Salta</h1>
          <p className="text-gray-500 text-sm">Panel de Permisionario</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numero de Legajo
            </label>
            <input
              type="text"
              value={legajo}
              onChange={(e) => setLegajo(e.target.value)}
              placeholder="Ej: P001"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
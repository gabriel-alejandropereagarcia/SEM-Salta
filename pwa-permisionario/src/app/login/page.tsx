'use client';

import { useState, useEffect } from 'react';
import { usePermisionario } from '@/hooks/usePermisionario';

export default function LoginPage() {
  const { login } = usePermisionario();
  const [legajo, setLegajo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seedStatus, setSeedStatus] = useState<'idle' | 'creating' | 'done'>('idle');
  const [seedExists, setSeedExists] = useState(false);

  useEffect(() => {
    checkSeed();
  }, []);

  async function checkSeed() {
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      setSeedExists(data.exists === true);
    } catch {
      setSeedExists(false);
    }
  }

  async function createSeed() {
    setSeedStatus('creating');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedStatus('done');
        setSeedExists(true);
        setLegajo('P001');
      } else {
        setError(data.error || 'Error creando datos de demo');
        setSeedStatus('idle');
      }
    } catch {
      setError('Error de conexion con el servidor');
      setSeedStatus('idle');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!legajo.trim()) return;

    setLoading(true);
    setError('');

    const success = await login(legajo.trim());

    if (!success) {
      setError('Legajo no encontrado. Crea los datos de prueba primero.');
    } else {
      window.location.href = '/dashboard';
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
            🅿️
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">SEM Salta</h1>
          <p className="text-blue-200 text-sm">Panel de Permisionario</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Numero de Legajo
              </label>
              <input
                type="text"
                value={legajo}
                onChange={(e) => setLegajo(e.target.value)}
                placeholder="Ej: P001"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-slate-300"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Seed / Demo Data Section */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">Datos de prueba</p>

            {seedStatus === 'done' || seedExists ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
                <p className="text-emerald-800 font-semibold mb-1">✅ Datos de prueba listos</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Legajo</span>
                    <span className="font-mono font-bold text-slate-700">P001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nombre</span>
                    <span className="text-slate-700">Juan Garcia</span>
                  </div>
                </div>
              </div>
            ) : seedStatus === 'creating' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 text-center">
                <svg className="animate-spin w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creando datos de prueba...
              </div>
            ) : (
              <button
                onClick={createSeed}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-medium transition border border-slate-200"
              >
                Crear datos de demo
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-4">
          PunaTech 2026 — SEM Salta Digital
        </p>
      </div>
    </div>
  );
}
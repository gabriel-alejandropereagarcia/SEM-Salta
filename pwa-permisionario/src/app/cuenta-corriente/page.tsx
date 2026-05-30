'use client';

import { usePermisionario } from '@/hooks/usePermisionario';
import { CuentaCorrienteTable } from '@/components/CuentaCorrienteTable';
import { useState, useEffect } from 'react';
import { Transaccion } from '@/types';
import { supabase } from '@/lib/supabase';

export default function CuentaCorrientePage() {
  const { permisionario, loading: authLoading, refreshSaldo } = usePermisionario();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);

  useEffect(() => {
    if (permisionario) {
      loadTransacciones();
      refreshSaldo();
    }
  }, [permisionario]);

  async function loadTransacciones() {
    if (!permisionario) return;

    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        id, tipo, monto, descripcion, created_at,
        sesiones_estacionamiento (patente, tipo_vehiculo)
      `)
      .eq('id_permisionario', permisionario.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setTransacciones(data as unknown as Transaccion[]);
    }
    setLoadingTransacciones(false);
  }

  if (authLoading || !permisionario) {
    if (typeof window !== 'undefined' && !permisionario) {
      window.location.href = '/login';
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-base font-bold text-slate-800">Cuenta Corriente</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <CuentaCorrienteTable
          transacciones={transacciones}
          saldoActual={permisionario.saldo_cuenta_corriente}
          loading={loadingTransacciones}
        />
      </main>
    </div>
  );
}
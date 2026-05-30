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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-primary-600 hover:text-primary-800">
            ← Volver
          </a>
          <h1 className="text-lg font-bold text-gray-800">Cuenta Corriente</h1>
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
'use client';

import { usePermisionario } from '@/hooks/usePermisionario';
import { useRealtimeSessions } from '@/hooks/useRealtimeSessions';
import { SessionList } from '@/components/SessionList';
import { BalanceCard } from '@/components/BalanceCard';
import { RegisterCashPayment } from '@/components/RegisterCashPayment';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Zona } from '@/types';

export default function DashboardPage() {
  const { permisionario, loading: authLoading, logout } = usePermisionario();
  const [zona, setZona] = useState<Zona | null>(null);

  const { sessions, loading: sessionsLoading, refresh } = useRealtimeSessions({
    zonaId: permisionario?.id_zona_actual ?? null,
  });

  useEffect(() => {
    if (permisionario?.id_zona_actual) {
      supabase
        .from('zonas')
        .select('*')
        .eq('id', permisionario.id_zona_actual)
        .single()
        .then(({ data }) => {
          if (data) setZona(data as Zona);
        });
    }
  }, [permisionario?.id_zona_actual]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!permisionario) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-primary-700">SEM Salta</h1>
            <p className="text-xs text-gray-500">{permisionario.nombre}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            Cerrar sesion
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <BalanceCard
          saldo={permisionario.saldo_cuenta_corriente}
          zonaCuc={zona?.cuc || '...'}
          sesionesActivas={sessions.length}
          capacidadMaxima={zona?.capacidad || 20}
        />

        <SessionList
          sessions={sessions}
          loading={sessionsLoading}
          capacidadMaxima={zona?.capacidad || 20}
        />

        <RegisterCashPayment
          zonaCuc={zona?.cuc || ''}
          permisionarioId={permisionario.id}
          onSuccess={refresh}
        />

        <nav className="flex justify-around bg-white rounded-xl shadow-md p-3">
          <a href="/dashboard" className="flex flex-col items-center text-primary-600">
            <span className="text-xl">🅿️</span>
            <span className="text-xs">Inicio</span>
          </a>
          <a href="/cuenta-corriente" className="flex flex-col items-center text-gray-400 hover:text-primary-600">
            <span className="text-xl">💰</span>
            <span className="text-xs">Cuenta</span>
          </a>
        </nav>
      </main>
    </div>
  );
}
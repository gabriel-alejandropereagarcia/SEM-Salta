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
  const [showCash, setShowCash] = useState(false);

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">SEM Salta</h1>
              <p className="text-[10px] text-slate-400 leading-tight">{permisionario.nombre}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-red-500 transition font-medium"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Balance Card */}
        <BalanceCard
          saldo={permisionario.saldo_cuenta_corriente}
          zonaCuc={zona?.cuc || '...'}
          sesionesActivas={sessions.length}
          capacidadMaxima={zona?.capacidad || 20}
        />

        {/* Sessions */}
        <SessionList
          sessions={sessions}
          loading={sessionsLoading}
          capacidadMaxima={zona?.capacidad || 20}
        />

        {/* Cash Payment Toggle */}
        <button
          onClick={() => setShowCash(!showCash)}
          className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-lg">
              💵
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-800">Registrar pago en efectivo</div>
              <div className="text-xs text-slate-400">Se descuenta 20% comisión municipal</div>
            </div>
          </div>
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${showCash ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showCash && (
          <RegisterCashPayment
            zonaCuc={zona?.cuc || ''}
            permisionarioId={permisionario.id}
            onSuccess={() => { refresh(); setShowCash(false); }}
          />
        )}

        {/* Nav Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50">
          <div className="max-w-lg mx-auto flex">
            <a href="/dashboard" className="flex-1 flex flex-col items-center py-2.5 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[10px] font-medium mt-0.5">Inicio</span>
            </a>
            <a href="/cuenta-corriente" className="flex-1 flex flex-col items-center py-2.5 text-slate-400 hover:text-blue-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.403 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.403-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] font-medium mt-0.5">Cuenta</span>
            </a>
          </div>
        </nav>
      </main>
    </div>
  );
}
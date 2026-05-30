'use client';

import { SesionEstacionamiento } from '@/types';
import { useEffect, useState } from 'react';

interface SessionCardProps {
  session: SesionEstacionamiento;
  onConfirmarCobro?: (sesionId: string) => void;
  confirmando?: string | null;
}

export function SessionCard({ session, onConfirmarCobro, confirmando }: SessionCardProps) {
  const [tiempoRestante, setTiempoRestante] = useState<string>('');

  useEffect(() => {
    function updateTimer() {
      if (!session.hora_fin) return;
      const now = new Date().getTime();
      const fin = new Date(session.hora_fin).getTime();
      const diff = fin - now;

      if (diff <= 0) {
        setTiempoRestante('Excedido');
        return;
      }

      const horas = Math.floor(diff / 3600000);
      const minutos = Math.floor((diff % 3600000) / 60000);
      setTiempoRestante(`${horas}h ${minutos}min`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [session.hora_fin]);

  const horaInicio = new Date(session.hora_inicio).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const horaFin = session.hora_fin
    ? new Date(session.hora_fin).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const isDigital = session.metodo_pago === 'digital';
  const isPendiente = session.estado === 'pendiente_cobro';
  const tarifa = session.tipo_vehiculo === 'moto' ? 300 : 700;

  if (isPendiente) {
    return (
      <div className="bg-amber-50 rounded-2xl border-2 border-amber-400 shadow-sm p-4 animate-pulse-subtle">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
              session.tipo_vehiculo === 'moto' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {session.tipo_vehiculo === 'moto' ? '🏍' : '🚗'}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">{session.patente}</div>
              <div className="text-xs text-slate-400">{horaInicio} → {horaFin}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              ⚠️ COBRAR
            </span>
            <span className="text-xs font-mono text-amber-700 font-bold">
              ${tarifa}/h
            </span>
          </div>
        </div>
        <div className="bg-amber-100 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-amber-800 font-semibold">
            El conductor no tiene saldo. Cobrá ${tarifa} en efectivo.
          </p>
        </div>
        {onConfirmarCobro && (
          <button
            onClick={() => onConfirmarCobro(session.id)}
            disabled={confirmando === session.id}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            {confirmando === session.id ? 'Confirmando...' : '✅ Confirmar cobro'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 transition hover:shadow-md ${isDigital ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-amber-500'}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
            session.tipo_vehiculo === 'moto' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {session.tipo_vehiculo === 'moto' ? '🏍' : '🚗'}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">{session.patente}</div>
            <div className="text-xs text-slate-400">{horaInicio} → {horaFin}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={isDigital ? 'badge-digital' : 'badge-efectivo'}>
            {isDigital ? '📱 Digital' : '💵 Efectivo'}
          </span>
          {session.estado === 'activo' && (
            <span className="text-xs font-mono text-slate-500">
              ⏱ {tiempoRestante}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
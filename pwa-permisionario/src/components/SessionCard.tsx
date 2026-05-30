'use client';

import { SesionEstacionamiento } from '@/types';
import { useEffect, useState } from 'react';

interface SessionCardProps {
  session: SesionEstacionamiento;
}

export function SessionCard({ session }: SessionCardProps) {
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
'use client';

import { SesionEstacionamiento } from '@/types';
import { useEffect, useState } from 'react';

interface SessionCardProps {
  session: SesionEstacionamiento;
  onEnd?: (id: string) => void;
}

export function SessionCard({ session, onEnd }: SessionCardProps) {
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
    ? new Date(session.hora_fin).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  const isDigital = session.metodo_pago === 'digital';

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${isDigital ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{session.patente}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${session.tipo_vehiculo === 'moto' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
              {session.tipo_vehiculo === 'moto' ? '🏍' : '🚗'} {session.tipo_vehiculo}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {horaInicio} → {horaFin}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-1 rounded-full ${isDigital ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {isDigital ? '📱 Digital' : '💵 Efectivo'}
          </span>
          {session.estado === 'activo' && (
            <span className="text-sm font-mono text-gray-600">
              ⏱ {tiempoRestante}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
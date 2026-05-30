'use client';

import { SesionEstacionamiento } from '@/types';
import { SessionCard } from './SessionCard';

interface SessionListProps {
  sessions: SesionEstacionamiento[];
  loading: boolean;
  capacidadMaxima: number;
}

export function SessionList({ sessions, loading, capacidadMaxima }: SessionListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Autos estacionados
        </h2>
        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
          {sessions.length} / {capacidadMaxima}
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
          <div className="text-4xl mb-2">🅿️</div>
          <p className="text-sm text-slate-400">No hay autos estacionados</p>
          <p className="text-xs text-slate-300 mt-1">Los nuevos aparecerán en tiempo real</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Autos Estacionados
        </h2>
        <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
          {sessions.length} / {capacidadMaxima}
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🅿️</div>
          <p>No hay autos estacionados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
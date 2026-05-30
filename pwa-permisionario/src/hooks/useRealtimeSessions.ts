'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SesionEstacionamiento } from '@/types';

interface UseRealtimeSessionsOptions {
  zonaId: string | null;
  onInsert?: (sesion: SesionEstacionamiento) => void;
  onUpdate?: (sesion: SesionEstacionamiento) => void;
}

export function useRealtimeSessions({ zonaId, onInsert, onUpdate }: UseRealtimeSessionsOptions) {
  const [sessions, setSessions] = useState<SesionEstacionamiento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!zonaId) return;

    const { data, error } = await supabase
      .from('sesiones_estacionamiento')
      .select('*')
      .eq('id_zona', zonaId)
      .in('estado', ['activo', 'pendiente_cobro'])
      .order('hora_inicio', { ascending: false });

    if (!error && data) {
      setSessions(data as SesionEstacionamiento[]);
    }
    setLoading(false);
  }, [zonaId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!zonaId) return;

    const channel = supabase
      .channel(`zona-${zonaId}-sessions`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sesiones_estacionamiento',
          filter: `id_zona=eq.${zonaId}`,
        },
        (payload) => {
          const newSession = payload.new as SesionEstacionamiento;
          if (newSession.estado === 'activo' || newSession.estado === 'pendiente_cobro') {
            setSessions((prev) => [newSession, ...prev]);
            onInsert?.(newSession);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sesiones_estacionamiento',
          filter: `id_zona=eq.${zonaId}`,
        },
        (payload) => {
          const updatedSession = payload.new as SesionEstacionamiento;
          if (updatedSession.estado === 'finalizado' || updatedSession.estado === 'anulado') {
            setSessions((prev) => prev.filter((s) => s.id !== updatedSession.id));
          } else {
            setSessions((prev) =>
              prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
            );
          }
          onUpdate?.(updatedSession);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sesiones_estacionamiento',
          filter: `id_zona=eq.${zonaId}`,
        },
        (payload) => {
          setSessions((prev) => prev.filter((s) => s.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [zonaId, onInsert, onUpdate]);

  const refresh = useCallback(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refresh };
}
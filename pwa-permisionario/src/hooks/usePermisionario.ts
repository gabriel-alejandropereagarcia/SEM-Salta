'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Permisionario } from '@/types';

const PERMISIONARIO_KEY = 'sem_permisionario_id';

export function usePermisionario() {
  const [permisionario, setPermisionario] = useState<Permisionario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem(PERMISIONARIO_KEY);
    if (storedId) {
      loadPermisionario(storedId);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadPermisionario(id: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('permisionarios')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setPermisionario(data as Permisionario);
      localStorage.setItem(PERMISIONARIO_KEY, id);
    }
    setLoading(false);
  }

  async function login(legajo: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('permisionarios')
      .select('*')
      .eq('legajo', legajo)
      .single();

    if (error || !data) return false;

    setPermisionario(data as Permisionario);
    localStorage.setItem(PERMISIONARIO_KEY, data.id);
    return true;
  }

  function logout() {
    setPermisionario(null);
    localStorage.removeItem(PERMISIONARIO_KEY);
  }

  async function refreshSaldo() {
    if (!permisionario) return;
    const { data } = await supabase
      .from('permisionarios')
      .select('saldo_cuenta_corriente')
      .eq('id', permisionario.id)
      .single();

    if (data) {
      setPermisionario((prev) =>
        prev ? { ...prev, saldo_cuenta_corriente: data.saldo_cuenta_corriente } : null
      );
    }
  }

  return {
    permisionario,
    loading,
    login,
    logout,
    refreshSaldo,
  };
}
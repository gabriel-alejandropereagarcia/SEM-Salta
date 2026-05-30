let supabaseInstance: ReturnType<typeof createClient> | null = null;

import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export const supabase = typeof window !== 'undefined'
  ? getSupabase()
  : getSupabase();
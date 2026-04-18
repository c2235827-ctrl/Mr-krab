import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

/**
 * Lazy-initialized Supabase client.
 * Using a Proxy allows us to keep the same 'supabase' export while deferring
 * initialization (and potential errors) until the first time it's actually used.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!_supabase) {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error(
          'Supabase configuration missing. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
          'in your environment variables to connect to your database.'
        );
      }
      _supabase = createClient(url, key);
    }
    return (_supabase as any)[prop];
  }
});

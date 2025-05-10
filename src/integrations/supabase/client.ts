
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mrccqqindgacgfreviwf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yY2NxcWluZGdhY2dmcmV2aXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDc1NzIsImV4cCI6MjA2MjQ4MzU3Mn0.0UshDKISFDYCQVVZ5tfSBaCMH2F6bF3SenjnD63bYw8";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage,
      detectSessionInUrl: true,
      flowType: 'implicit'
    }
  }
);

console.log("[supabase client] Cliente Supabase inicializado");

// Inicializar estado de autenticação
(async () => {
  try {
    const { error } = await supabase.auth.initialize();
    if (error) {
      console.error("[supabase client] Erro ao inicializar autenticação:", error);
    } else {
      console.log("[supabase client] Autenticação inicializada com sucesso");
    }
  } catch (err) {
    console.error("[supabase client] Exceção ao inicializar autenticação:", err);
  }
})();

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mrccqqindgacgfreviwf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yY2NxcWluZGdhY2dmcmV2aXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDc1NzIsImV4cCI6MjA2MjQ4MzU3Mn0.0UshDKISFDYCQVVZ5tfSBaCMH2F6bF3SenjnD63bYw8";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});


import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mrccqqindgacgfreviwf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yY2NxcWluZGdhY2dmcmV2aXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDc1NzIsImV4cCI6MjA2MjQ4MzU3Mn0.0UshDKISFDYCQVVZ5tfSBaCMH2F6bF3SenjnD63bYw8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

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

// Add debug logging for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log("[supabase client] Auth event:", event, "Session:", session?.user?.email || "No user");
});

// Initialize auth state from URL
(async () => {
  try {
    const { error } = await supabase.auth.initialize();
    if (error) {
      console.error("[supabase client] Error initializing auth:", error);
    } else {
      console.log("[supabase client] Auth initialized successfully");
    }
  } catch (err) {
    console.error("[supabase client] Exception initializing auth:", err);
  }
})();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single Supabase client instance
// This prevents the "Multiple GoTrueClient instances" warning
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 1
        }
    },
    global: {
        headers: {
            'x-my-custom-header': 'payslips-app'
        }
    },
    db: {
        schema: 'public'
    }
});

// For storage operations, use the same client
// RLS policies should be configured in Supabase to allow authenticated users
export const supabaseAdmin = supabase;

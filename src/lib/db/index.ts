import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

if (!hasSupabaseConfig) {
  console.warn('[Supabase] Missing Supabase environment variables. Database connections will fail.');
}

// Create a single supabase client for interacting with your database.
// In local/dev environments without Supabase config, expose null so routes can degrade gracefully.
export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseKey) : null;

export default supabase;

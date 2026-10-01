import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Privileged Supabase Client.
 *
 * SECURITY:
 * - This function must ONLY be imported and executed inside server-side environments
 *   (Next.js Route Handlers, Server Components, Server Actions).
 * - It accesses SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY to perform privileged operations
 *   (e.g., automated WhatsApp alert logs, verified institutional operations).
 * - Never import this file into Client Components ("use client").
 */
export function getServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

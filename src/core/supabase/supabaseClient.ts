// ==========================================================================
// BARBERIA_PRO - Supabase Cloud Client Configuration
// Multi-Tenant PostgreSQL Client with JWT Session Scoping
// ==========================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration from Vite Environment Variables (with demo mock fallback)
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://mock-supabase.barberiapro.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-barberiapro-saas';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof (import.meta as any).env?.VITE_SUPABASE_URL === 'string' &&
    (import.meta as any).env.VITE_SUPABASE_URL.startsWith('http') &&
    !(import.meta as any).env.VITE_SUPABASE_URL.includes('mock-supabase')
  );
};

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'barberia-pro-saas',
    },
  },
});

/**
 * AUTH BRIDGE: Set the Supabase session using the JWT signed by the server.
 * This token carries business_id and role claims that Supabase RLS reads via
 * request.jwt.claims. Call this after a successful staff/owner login.
 */
export async function setSupabaseSession(supabaseToken: string): Promise<void> {
  if (!supabaseToken || !isSupabaseConfigured()) return;
  try {
    await supabase.auth.setSession({
      access_token: supabaseToken,
      refresh_token: supabaseToken,
    });
  } catch (e) {
    console.warn('[Supabase Session] Failed to set session:', e);
  }
}

/**
 * Clear Supabase session on logout.
 */
export async function clearSupabaseSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Silently fail
  }
}


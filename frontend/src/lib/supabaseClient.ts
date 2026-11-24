/**
 * Supabase client configuration for hospital staff authentication.
 *
 * Defaults gracefully to null when Supabase credentials or packages are not configured,
 * allowing AuthContext to provide seamless offline / local demo staff authentication.
 */

export interface MinimalSupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface MinimalSupabaseClient {
  auth: {
    signInWithPassword: (credentials: { email: string; password?: string }) => Promise<{
      data: { user: MinimalSupabaseUser | null } | null;
      error: Error | null;
    }>;
    signOut: () => Promise<{ error: Error | null }>;
  };
}

export type SupabaseClient = MinimalSupabaseClient;

const supabaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined;
const supabaseAnonKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;

export const supabase: SupabaseClient | null = null;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabase);

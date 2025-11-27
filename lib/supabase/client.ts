import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton instance
let client: SupabaseClient | undefined;

export function createClient(forceNew: boolean = false) {
  // Return existing client if already created (unless forceNew is true)
  if (client && !forceNew) {
    return client;
  }

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please create a .env.local file.');
    
    // Use placeholder to prevent crash
    const newClient = createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
    
    if (!forceNew) {
      client = newClient;
    }
    
    return newClient;
  }

  // Create new client
  const newClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );

  if (!forceNew) {
    client = newClient;
  }

  return newClient;
}


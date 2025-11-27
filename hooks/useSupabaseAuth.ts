'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'developer' | 'accountant' | 'admin' | 'staff';
  role_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient(); // Get singleton instance

    // Fetch profile with retry logic
    const fetchProfile = async (userId: string, retryCount = 0): Promise<void> => {
      if (!isMounted) return;
      
      console.log(`[Profile Fetch] Starting fetch for user ID: ${userId} (attempt ${retryCount + 1})`);
      console.log(`[Profile Fetch] Using Supabase client:`, supabase);
      console.log(`[Profile Fetch] Supabase URL:`, process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      try {
        const queryStart = Date.now();
        console.log(`[Profile Fetch] Executing query: profiles.select('*').eq('id', '${userId}').single()`);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        const queryTime = Date.now() - queryStart;
        console.log(`[Profile Fetch] Query completed in ${queryTime}ms`);

        if (profileError) {
          console.error('[Profile Fetch] Error details:', {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
            fullError: profileError
          });
          
          // Retry up to 3 times with delay if RLS error or network issue
          if (retryCount < 3 && (profileError.code === 'PGRST116' || profileError.code === 'PGRST301' || profileError.code === '42501')) {
            console.log(`[Profile Fetch] Retrying in 500ms... (RLS/Network error: ${profileError.code})`);
            await new Promise(resolve => setTimeout(resolve, 500));
            return fetchProfile(userId, retryCount + 1);
          }
          
          // If no retry, set profile to null and continue
          if (!isMounted) return;
          console.warn('[Profile Fetch] Failed after retries, setting profile to null');
          setProfile(null);
          return;
        }
        
        if (!isMounted) return;
        console.log('[Profile Fetch] ✅ Success! Profile data:', profileData);
        setProfile(profileData || null);
      } catch (error) {
        console.error('[Profile Fetch] ❌ Unexpected error:', error);
        if (!isMounted) return;
        setProfile(null);
      }
    };

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        setUser(user);

        if (user) {
          await fetchProfile(user.id);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          // Small delay to ensure auth context is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - singleton client is stable

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) throw authError;

    if (authData.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          role: 'user',
        });

      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = profile?.role === 'admin';

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  };
}


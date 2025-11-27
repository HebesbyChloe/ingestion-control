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
    let isFetching = false; // Prevent duplicate fetches
    
    // Try to create Supabase client, handle errors gracefully
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient(); // Get singleton instance
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      if (isMounted) {
        setLoading(false);
      }
      return;
    }

    // Fetch profile with retry logic and timeout
    const fetchProfile = async (userId: string, retryCount = 0): Promise<void> => {
      if (!isMounted || isFetching) {
        console.log(`[Profile Fetch] Skipping - already fetching or unmounted`);
        return;
      }
      
      isFetching = true;
      
      try {
        const queryStart = Date.now();
        
        // Add timeout wrapper (5 seconds)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
        });
        
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // Use Promise.race with timeout
        let profileData: any = null;
        let profileError: any = null;
        
        try {
          const result = await Promise.race([queryPromise, timeoutPromise]);
          profileData = (result as any)?.data || null;
          profileError = (result as any)?.error || null;
        } catch (raceError: any) {
          if (raceError?.message?.includes('timeout')) {
            profileError = { 
              message: 'Profile query timeout',
              code: 'TIMEOUT'
            };
          } else {
            profileError = {
              message: raceError?.message || 'Unknown error',
              code: raceError?.code || 'UNKNOWN'
            };
          }
        }

        const queryTime = Date.now() - queryStart;
        
        // Check if there's an error
        if (profileError) {

          const errorCode = profileError?.code || profileError?.error_code;
          
          // Handle "not found" error
          if (errorCode === 'PGRST116' || errorCode === 'PGRST301') {
            if (!isMounted) return;
            setProfile(null);
            setLoading(false);
            isFetching = false;
            return;
          }
          
          // Retry once on timeout
          if (retryCount < 1 && errorCode === 'TIMEOUT') {
            isFetching = false;
            await new Promise(resolve => setTimeout(resolve, 500));
            return fetchProfile(userId, retryCount + 1);
          }
          
          // Failed after retries
          if (!isMounted) return;
          setProfile(null);
          setLoading(false);
          isFetching = false;
          return;
        }

        if (!isMounted) {
          isFetching = false;
          return;
        }
        
        // Success
        setProfile(profileData || null);
        setLoading(false);
        isFetching = false;
      } catch (error: any) {
        if (!isMounted) {
          isFetching = false;
          return;
        }
        setProfile(null);
        setLoading(false);
        isFetching = false;
      }
    };

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        setUser(user);

        if (user) {
          // Give session time to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchProfile(user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_OUT') {
          isFetching = false;
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // Only fetch profile on INITIAL_SESSION (when session is fully ready)
        // SIGNED_IN fires too early and causes timeouts
        if (event === 'INITIAL_SESSION' && session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Just set user, profile will be fetched on INITIAL_SESSION
          setUser(session.user);
        } else if (session?.user) {
          // For other events (TOKEN_REFRESHED, etc.), just update user
          setUser(session.user);
        } else {
          setUser(null);
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


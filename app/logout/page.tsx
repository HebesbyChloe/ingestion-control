'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const [status, setStatus] = useState('Signing out...');

  useEffect(() => {
    const logout = async () => {
      try {
        const supabase = createClient();
        
        console.log('Starting logout process...');
        setStatus('Clearing session...');
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Logout error:', error);
          setStatus('Error signing out. Redirecting...');
        } else {
          console.log('Logout successful');
          setStatus('Redirecting to login...');
        }
        
        // Wait a moment for cookies to clear
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use window.location for a hard redirect to clear all state
        window.location.href = '/login';
      } catch (err) {
        console.error('Unexpected logout error:', err);
        setStatus('Error occurred. Redirecting...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    };

    logout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{status}</h1>
        <p className="text-slate-600">Please wait while we log you out.</p>
      </div>
    </div>
  );
}


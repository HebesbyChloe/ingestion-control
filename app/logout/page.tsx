'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const [status, setStatus] = useState('Signing out...');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const logout = async () => {
      try {
        const supabase = createClient();
        
        console.log('Starting logout process...');
        setStatus('Clearing session...');
        
        // Set a timeout to force redirect if signOut takes too long
        timeoutId = setTimeout(() => {
          console.log('Logout timeout - forcing redirect');
          window.location.href = '/login';
        }, 3000); // 3 second timeout
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut({
          scope: 'local' // Only sign out from this device
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Logout error:', error);
          setStatus('Redirecting...');
        } else {
          console.log('Logout successful');
          setStatus('Redirecting to login...');
        }
        
        // Immediate redirect - don't wait
        window.location.href = '/login';
      } catch (err) {
        console.error('Unexpected logout error:', err);
        clearTimeout(timeoutId);
        // Force redirect even on error
        window.location.href = '/login';
      }
    };

    logout();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
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


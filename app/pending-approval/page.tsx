'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is approved (poll every 5 seconds)
    const checkApproval = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user.id)
        .single();

      if (profile?.is_active) {
        // User has been approved, redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      }
    };

    // Check immediately
    checkApproval();

    // Then check every 5 seconds
    const interval = setInterval(checkApproval, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Account Pending Approval</CardTitle>
          <CardDescription>
            Your registration was successful!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              Your account is currently pending admin approval. You will be able to access the dashboard once an administrator approves your account.
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600">
              This page will automatically refresh when your account is approved.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Checking for approval every 5 seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


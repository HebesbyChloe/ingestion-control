'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '@/lib/api/schedules';
import { feedsApi } from '@/lib/api/feeds';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';

export default function DashboardPage() {
  const { profile, loading: authLoading } = useSupabaseAuth();

  // Fetch real data from APIs
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
  });

  const { data: feeds = [], isLoading: feedsLoading } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => feedsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
  });

  const activeSchedules = schedules.filter((s) => s.enabled).length;
  const totalRuns = schedules.reduce((sum, s) => sum + s.run_count, 0);
  const totalErrors = schedules.reduce((sum, s) => sum + s.error_count, 0);
  
  const isLoading = schedulesLoading || feedsLoading;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'staff':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {authLoading ? 'Dashboard' : `${getGreeting()}, ${profile?.full_name || 'User'}!`}
              </h1>
              <p className="text-gray-600 mt-2">Overview of ingestion system</p>
            </div>
            {profile && !authLoading && (
              <Badge className={cn('text-sm px-3 py-1', getRoleBadgeColor(profile.role))}>
                {profile.role.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeSchedules}</div>
                  <p className="text-xs text-gray-500 mt-1">out of {schedules.length} total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRuns}</div>
                  <p className="text-xs text-gray-500 mt-1">successful executions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalErrors}</div>
                  <p className="text-xs text-gray-500 mt-1">failed executions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Feeds</CardTitle>
                  <Database className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{feeds.length}</div>
                  <p className="text-xs text-gray-500 mt-1">configured feeds</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Schedules</CardTitle>
                  <CardDescription>Latest schedule executions</CardDescription>
                </CardHeader>
                <CardContent>
                  {schedules.length === 0 ? (
                    <p className="text-gray-500 text-sm">No schedules configured</p>
                  ) : (
                    <div className="space-y-2">
                      {schedules.slice(0, 5).map((schedule) => (
                        <div key={schedule.id} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{schedule.name}</p>
                            <p className="text-sm text-gray-500">{schedule.cron_expression}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{schedule.run_count} runs</p>
                            {schedule.error_count > 0 && (
                              <p className="text-sm text-red-600">{schedule.error_count} errors</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feed Status</CardTitle>
                  <CardDescription>Current feed ingestion status</CardDescription>
                </CardHeader>
                <CardContent>
                  {feeds.length === 0 ? (
                    <p className="text-gray-500 text-sm">No feeds configured</p>
                  ) : (
                    <div className="space-y-2">
                      {feeds.map((feed) => (
                        <div key={feed.feed_key} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{feed.label}</p>
                            <p className="text-sm text-gray-500">{feed.typesense_collection}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${feed.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {feed.enabled ? 'Active' : 'Disabled'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {feed.request_method} • {feed.response_is_zip ? 'ZIP' : 'Direct'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


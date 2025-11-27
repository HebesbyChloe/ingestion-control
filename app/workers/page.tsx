'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Pause, 
  RefreshCw, 
  Loader2, 
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Zap,
  Calendar
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workersApi, Worker } from '@/lib/api/workers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { JobDetailsPanel } from '@/components/workers/JobDetailsPanel';

export default function WorkersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [selectedJob, setSelectedJob] = useState<Worker | null>(null);
  
  // Set default custom dates (today)
  const today = new Date().toISOString().split('T')[0];
  const [customDateFrom, setCustomDateFrom] = useState<string>(today);
  const [customDateTo, setCustomDateTo] = useState<string>(today);
  
  const queryClient = useQueryClient();

  // Calculate date ranges
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (dateFilter) {
      case 'today':
        return {
          date_from: today.toISOString(),
          date_to: new Date().toISOString(),
        };
      case 'yesterday':
        return {
          date_from: yesterday.toISOString(),
          date_to: today.toISOString(),
        };
      case 'custom':
        if (customDateFrom && customDateTo) {
          return {
            date_from: new Date(customDateFrom).toISOString(),
            date_to: new Date(customDateTo + 'T23:59:59').toISOString(),
          };
        }
        return { date_from: today.toISOString() };
      default:
        return { date_from: today.toISOString() };
    }
  };

  // Fetch workers data
  const { data: workers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['workers', selectedStatus, dateFilter, customDateFrom, customDateTo],
    staleTime: 1 * 60 * 1000, // 1 minute (workers change frequently)
    refetchOnWindowFocus: false, // Only refetch on manual refresh
    queryFn: () => {
      const dateRange = getDateRange();
      const filters = {
        ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
        ...dateRange,
      };
      return workersApi.getAll(filters);
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch worker statistics
  const { data: stats } = useQuery({
    queryKey: ['worker-stats'],
    queryFn: () => workersApi.getStats(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: (id: number) => workersApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  // Stop mutation
  const stopMutation = useMutation({
    mutationFn: (id: number) => workersApi.stop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  const handleRetry = (id: number) => {
    if (confirm('Retry this job? (Note: Backend endpoint needs to be implemented)')) {
      retryMutation.mutate(id, {
        onSuccess: () => {
          alert('Retry requested successfully!');
        },
        onError: (error) => {
          alert(`Retry endpoint not implemented yet. Backend needs to add: POST /worker/retry/${id}`);
        },
      });
    }
  };

  const handleStop = (id: number) => {
    if (confirm('Are you sure you want to stop this worker?')) {
      stopMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <Pause className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return 'N/A';
    if (seconds === 0) return '< 1s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Job Queue</h2>
          <p className="text-slate-500">Monitor ingestion jobs and worker activities</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Filter Buttons */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
            <Clock className="w-4 h-4 text-slate-400" />
            <div className="flex gap-1">
              <Button
                variant={dateFilter === 'today' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateFilter('today')}
                className={dateFilter === 'today' ? 'bg-indigo-600 hover:bg-indigo-700 h-7' : 'h-7 hover:bg-slate-100'}
              >
                Today
              </Button>
              <Button
                variant={dateFilter === 'yesterday' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateFilter('yesterday')}
                className={dateFilter === 'yesterday' ? 'bg-indigo-600 hover:bg-indigo-700 h-7' : 'h-7 hover:bg-slate-100'}
              >
                Yesterday
              </Button>
              <Button
                variant={dateFilter === 'custom' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateFilter('custom')}
                className={dateFilter === 'custom' ? 'bg-indigo-600 hover:bg-indigo-700 h-7' : 'h-7 hover:bg-slate-100'}
              >
                Custom
              </Button>
            </div>
          </div>

          {/* Custom Date Range Popover */}
          {dateFilter === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {customDateFrom && customDateTo
                    ? `${new Date(customDateFrom).toLocaleDateString()} - ${new Date(customDateTo).toLocaleDateString()}`
                    : 'Select dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">From</label>
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">To</label>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button 
            onClick={() => refetch()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Jobs"
            value={stats.total_workers}
            icon={<Activity className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title="Running Now"
            value={stats.active_workers}
            icon={<Zap className="w-5 h-5" />}
            color="emerald"
          />
          <StatsCard
            title="Jobs Today"
            value={stats.total_tasks_today}
            icon={<TrendingUp className="w-5 h-5" />}
            color="indigo"
          />
          <StatsCard
            title="Success Rate"
            value={`${stats.success_rate.toFixed(1)}%`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {['all', 'running', 'completed', 'failed', 'pending'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              selectedStatus === status
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {status}
            {status !== 'all' && workers.filter(w => w.status === status).length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
                {workers.filter(w => w.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-white border-slate-200">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Loading job queue...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-white border-red-200">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Failed to load jobs</p>
            <p className="text-sm text-slate-500">{String(error)}</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workers Table */}
      {!isLoading && !error && (
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Recent Jobs
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({workers.length} {workers.length === 1 ? 'job' : 'jobs'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No jobs found</p>
                <p className="text-sm text-slate-500 mt-1">
                  Ingestion jobs will appear here once they start running
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Job Type</TableHead>
                      <TableHead>Feed</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.map((worker) => {
                      const duration = worker.started_at && worker.completed_at
                        ? Math.floor((new Date(worker.completed_at).getTime() - new Date(worker.started_at).getTime()) / 1000)
                        : undefined;
                      
                      const processedRows = worker.result?.manifest?.processed_rows || 
                                          worker.result?.manifest?.stats?.rows_total;
                      const filteredRows = worker.result?.manifest?.stats?.rows_filtered_out;
                      
                      return (
                        <TableRow 
                          key={worker.id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => setSelectedJob(worker)}
                        >
                          <TableCell className="font-mono text-sm">
                            #{worker.id}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`${getStatusColor(worker.status)} gap-1.5`}
                            >
                              {getStatusIcon(worker.status)}
                              {worker.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-slate-900">
                                {worker.job_type}
                              </div>
                              {worker.job_data?.dryRun && (
                                <Badge variant="outline" className="mt-1 text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  Dry Run
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {worker.job_data?.feedKey ? (
                              <code className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">
                                {worker.job_data.feedKey}
                              </code>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {worker.job_data?.reason || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {formatTimestamp(worker.started_at)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {formatDuration(duration)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-sm">
                              {processedRows ? (
                                <div>
                                  <span className="text-emerald-600 font-medium">
                                    {processedRows.toLocaleString()}
                                  </span>
                                  {filteredRows && filteredRows > 0 && (
                                    <span className="text-amber-600 ml-1">
                                      (-{filteredRows.toLocaleString()})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {worker.status === 'failed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRetry(worker.id);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                  title="Retry job"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              )}
                              {worker.status === 'running' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStop(worker.id);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Stop job"
                                >
                                  <Pause className="w-4 h-4" />
                                </Button>
                              )}
                              {worker.error && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  title={worker.error}
                                  className="text-red-400 hover:text-red-700"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Details Panel */}
      <JobDetailsPanel 
        job={selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'indigo' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Calendar, Clock, Play, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { Worker } from '@/lib/api/workers';

interface JobDetailsPanelProps {
  job: Worker | null;
  onClose: () => void;
}

export function JobDetailsPanel({ job, onClose }: JobDetailsPanelProps) {
  if (!job) return null;

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const duration = job.started_at && job.completed_at
    ? Math.floor((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
    : undefined;

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return 'N/A';
    if (seconds === 0) return '< 1s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Job #{job.id}</h3>
              <p className="text-sm text-slate-500">{job.job_type}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status, Results & Error Card */}
          <Card className="border-slate-200">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-2">Status</label>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(job.status)} text-sm px-3 py-1`}
                >
                  {job.status.toUpperCase()}
                </Badge>
              </div>

              {/* Results inline - Show all available data */}
              {(() => {
                const processedRows = job.result?.manifest?.processed_rows || 
                                     job.result?.manifest?.stats?.rows_total;
                const totalRows = job.result?.manifest?.stats?.rows_total;
                const filteredRows = job.result?.manifest?.stats?.rows_filtered_out;
                const deltaDeleted = job.result?.manifest?.stats?.delta_deleted;

                if (processedRows || totalRows || filteredRows || deltaDeleted) {
                  return (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-slate-200">
                      {processedRows && (
                        <div className="min-w-0">
                          <label className="text-xs font-medium text-slate-500 block mb-1">Processed Rows</label>
                          <p className="text-sm font-medium text-emerald-600">
                            {processedRows.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {totalRows && (
                        <div className="min-w-0">
                          <label className="text-xs font-medium text-slate-500 block mb-1">Total Rows</label>
                          <p className="text-sm text-slate-900">
                            {totalRows.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {filteredRows !== undefined && filteredRows > 0 && (
                        <div className="min-w-0">
                          <label className="text-xs font-medium text-slate-500 block mb-1">Filtered Out</label>
                          <p className="text-sm text-amber-600">
                            {filteredRows.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {deltaDeleted !== undefined && deltaDeleted > 0 && (
                        <div className="min-w-0">
                          <label className="text-xs font-medium text-slate-500 block mb-1">Deleted</label>
                          <p className="text-sm text-red-600">
                            {deltaDeleted.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Error inline */}
              {job.error && (
                <div className="pt-3 border-t border-slate-200">
                  <label className="text-xs font-medium text-red-600 flex items-center gap-1 mb-1">
                    <AlertCircle className="w-3 h-3" />
                    Error
                  </label>
                  <p className="text-xs text-red-900 bg-red-50 p-2 rounded border border-red-200 break-words">
                    {job.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Information - Auto-layout 2-column grid */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-500">Job Information</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Job ID</label>
                  <p className="text-sm font-mono text-slate-900 truncate">#{job.id}</p>
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Tenant ID</label>
                  <p className="text-sm text-slate-900 truncate">{job.tenant_id}</p>
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Job Type</label>
                  <p className="text-sm text-slate-900 truncate">{job.job_type}</p>
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Retry Count</label>
                  <p className="text-sm text-slate-900">
                    {job.retry_count} / {job.max_retries}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Parameters - Auto-layout 2-column grid */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-500">Job Parameters</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {job.job_data.feedKey && (
                  <div className="min-w-0">
                    <label className="text-xs font-medium text-slate-500 block mb-1">Feed Key</label>
                    <p className="text-sm font-mono text-slate-900 truncate">{job.job_data.feedKey}</p>
                  </div>
                )}
                {job.job_data.reason && (
                  <div className="min-w-0">
                    <label className="text-xs font-medium text-slate-500 block mb-1">Reason</label>
                    <p className="text-sm text-slate-900 truncate">{job.job_data.reason}</p>
                  </div>
                )}
                {job.job_data.dryRun !== undefined && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Dry Run</label>
                    <Badge 
                      variant="outline" 
                      className={job.job_data.dryRun ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'}
                    >
                      {job.job_data.dryRun ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                )}
              </div>
              {Object.keys(job.job_data).length > 3 && (
                <details className="mt-4">
                  <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700">
                    View Additional Data
                  </summary>
                  <pre className="text-xs bg-slate-50 p-3 rounded mt-2 overflow-x-auto max-h-48">
                    {JSON.stringify(job.job_data, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>

          {/* Timeline - All 4 timestamps in 2-column grid */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-500">Timeline</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Created At</label>
                  <p className="text-sm text-slate-900 truncate">{formatDate(job.created_at)}</p>
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Updated At</label>
                  <p className="text-sm text-slate-900 truncate">{formatDate(job.updated_at)}</p>
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Started At</label>
                  <p className="text-sm text-slate-900 truncate">{job.started_at ? formatDate(job.started_at) : 'N/A'}</p>
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Completed At</label>
                  <p className="text-sm text-slate-900 truncate">{job.completed_at ? formatDate(job.completed_at) : 'N/A'}</p>
                </div>
                {duration !== undefined && (
                  <div className="col-span-2 pt-3 border-t border-slate-200">
                    <label className="text-xs font-medium text-slate-500 block mb-1">Duration</label>
                    <p className="text-sm font-medium text-indigo-600">{formatDuration(duration)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Full Results JSON (Expandable) */}
          {job.result && Object.keys(job.result).length > 0 && (
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <details>
                  <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    View Full Results JSON
                  </summary>
                  <pre className="text-xs bg-slate-50 p-3 rounded mt-3 overflow-x-auto max-h-64">
                    {JSON.stringify(job.result, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}


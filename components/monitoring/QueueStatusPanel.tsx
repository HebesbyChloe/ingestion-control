'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QueueStats } from '@/lib/api/monitoring';

interface QueueStatusPanelProps {
  queue?: QueueStats;
}

export function QueueStatusPanel({ queue }: QueueStatusPanelProps) {
  const pending = queue?.pending ?? 0;
  const processing = queue?.processing ?? 0;
  const failed = queue?.failed ?? 0;
  const completed = queue?.completed ?? 0;
  
  // Total includes all statuses
  const total = pending + processing + failed + completed;
  
  // Calculate success rate (completed / (completed + failed))
  const finishedJobs = completed + failed;
  const successRate = finishedJobs > 0 ? Math.round((completed / finishedJobs) * 100) : 0;
  
  const segments = [
    { label: 'Pending', value: pending, color: 'bg-amber-500' },
    { label: 'Processing', value: processing, color: 'bg-indigo-500' },
    { label: 'Completed', value: completed, color: 'bg-emerald-500' },
    { label: 'Failed', value: failed, color: 'bg-rose-500' },
  ];

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="text-base text-slate-700">Queue Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-semibold text-slate-900">{total}</p>
          <p className="text-sm text-slate-500">Total jobs tracked</p>
          {finishedJobs > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-slate-600">Success Rate:</span>
              <span className={`text-sm font-semibold ${successRate >= 90 ? 'text-emerald-600' : successRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                {successRate}%
              </span>
              <span className="text-xs text-slate-400">
                ({completed}/{finishedJobs} finished)
              </span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {segments.map((segment) => {
            const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;
            return (
              <div key={segment.label}>
                <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
                  <span>{segment.label}</span>
                  <span className="font-semibold text-slate-900">
                    {segment.value}{' '}
                    <span className="text-xs text-slate-400">({percentage}%)</span>
                  </span>
                </div>
                <Progress value={percentage} className={`h-2 ${segment.color}`} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}



'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QueueStats } from '@/lib/api/monitoring';

interface QueueStatusPanelProps {
  queue?: QueueStats;
}

export function QueueStatusPanel({ queue }: QueueStatusPanelProps) {
  const total = (queue?.pending ?? 0) + (queue?.processing ?? 0) + (queue?.failed ?? 0);
  const segments = [
    { label: 'Pending', value: queue?.pending ?? 0, color: 'bg-amber-500' },
    { label: 'Processing', value: queue?.processing ?? 0, color: 'bg-indigo-500' },
    { label: 'Failed', value: queue?.failed ?? 0, color: 'bg-rose-500' },
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
        </div>
        <div className="space-y-3">
          {segments.map((segment) => {
            const percentage = total ? Math.round((segment.value / total) * 100) : 0;
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



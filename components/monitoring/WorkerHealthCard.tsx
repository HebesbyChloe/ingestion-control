'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/components/ui/utils';
import { WorkerHealth } from '@/lib/api/monitoring';

interface WorkerHealthCardProps {
  health?: WorkerHealth;
}

const STATUS_COLORS: Record<string, string> = {
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  degraded: 'bg-amber-50 text-amber-700 border-amber-200',
  down: 'bg-red-50 text-red-700 border-red-200',
};

export function WorkerHealthCard({ health }: WorkerHealthCardProps) {
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="text-base text-slate-700">Worker Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <Badge
              variant="outline"
              className={cn(
                'mt-1 capitalize',
                STATUS_COLORS[health?.status ?? 'degraded'],
              )}
            >
              {health?.status ?? 'unknown'}
            </Badge>
          </div>
          {health?.last_check && (
            <div className="text-xs text-slate-400">
              Last check: {new Date(health.last_check).toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">Queue Status</div>
          <div className="space-y-1 text-xs text-slate-500">
            <QueueBar label="Pending" value={health?.queue.pending ?? 0} color="bg-amber-500" />
            <QueueBar label="Processing" value={health?.queue.processing ?? 0} color="bg-indigo-500" />
            <QueueBar label="Failed" value={health?.queue.failed ?? 0} color="bg-rose-500" />
          </div>
        </div>

        {health?.message && (
          <div className="p-3 rounded border border-slate-200 bg-slate-50 text-sm text-slate-600">
            {health.message}
          </div>
        )}

        {health?.stuck_jobs?.length ? (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Stuck Jobs</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {health.stuck_jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="p-3 rounded border border-amber-200 bg-amber-50 text-xs text-amber-900"
                >
                  <div className="font-mono text-slate-900">#{job.job_id}</div>
                  <div className="flex justify-between mt-1">
                    <span>Runtime</span>
                    <span>{formatDuration(job.runtime_seconds)}</span>
                  </div>
                  {job.schedule_id && (
                    <div className="flex justify-between">
                      <span>Schedule</span>
                      <span>#{job.schedule_id}</span>
                    </div>
                  )}
                  {job.details && <p className="mt-1">{job.details}</p>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">No stuck jobs reported</div>
        )}
      </CardContent>
    </Card>
  );
}

function QueueBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const max = Math.max(value, 1);
  return (
    <div>
      <div className="flex justify-between text-slate-500">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{value}</span>
      </div>
      <Progress value={(value / max) * 100 || 0} className={cn('h-2 mt-1', color)} />
    </div>
  );
}

function formatDuration(seconds: number) {
  if (!seconds) return '< 1m';
  const mins = Math.floor(seconds / 60);
  if (mins < 1) return '< 1m';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}



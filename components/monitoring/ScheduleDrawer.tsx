'use client';

import { ScheduleMonitorRow } from '@/lib/api/monitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Play } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface ScheduleDrawerProps {
  schedule: ScheduleMonitorRow | null;
  onClose: () => void;
  onExecute: (schedule: ScheduleMonitorRow) => void;
  executingId?: number | null;
}

export function ScheduleDrawer({
  schedule,
  onClose,
  onExecute,
  executingId,
}: ScheduleDrawerProps) {
  if (!schedule) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:max-w-xl bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{schedule.name}</h2>
            <p className="text-sm text-slate-500">Schedule #{schedule.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onExecute(schedule)}
              disabled={executingId === schedule.id}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {executingId === schedule.id ? (
                'Running...'
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Now
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Status & Metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Metric label="Status">
                <Badge
                  variant="outline"
                  className={cn(
                    schedule.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200',
                  )}
                >
                  {schedule.enabled ? 'Enabled' : 'Paused'}
                </Badge>
              </Metric>
              <Metric label="Error Rate">
                <Badge variant="outline" className={getErrorColor(schedule.error_rate)}>
                  {(schedule.error_rate ?? 0).toFixed(1)}%
                </Badge>
              </Metric>
              <Metric label="Run Count" value={schedule.run_count} />
              <Metric label="Error Count" value={schedule.error_count} />
              <Metric label="Last Run" value={formatFull(schedule.last_run)} />
              <Metric label="Next Run" value={formatFull(schedule.next_run)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">Cron Expression</span>
                <code className="px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs">
                  {schedule.cron_expression}
                </code>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase">Service</span>
                  <div className="font-semibold text-slate-900">{schedule.target_service}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase">Method</span>
                  <div className="font-semibold text-slate-900">{schedule.http_method}</div>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Endpoint</span>
                <code className="block px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs text-slate-700">
                  {schedule.target_endpoint}
                </code>
              </div>
            </CardContent>
          </Card>

          {schedule.last_error && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-sm text-red-600">Last Error</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-red-800 whitespace-pre-wrap">{schedule.last_error}</pre>
              </CardContent>
            </Card>
          )}

          {schedule.active_job && (
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardHeader>
                <CardTitle className="text-sm text-indigo-700">Active Job</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                <Metric label="Job ID" value={`#${schedule.active_job.job_id}`} />
                <Metric label="Status" value={schedule.active_job.status} />
                <Metric label="Started" value={formatFull(schedule.active_job.started_at)} />
                <Metric
                  label="Runtime"
                  value={`${Math.round(schedule.active_job.runtime_seconds / 60)} mins`}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-slate-900 font-medium">{children ?? value ?? 'N/A'}</div>
    </div>
  );
}

function getErrorColor(rate: number) {
  if (rate >= 20) return 'bg-red-50 text-red-700 border-red-200';
  if (rate > 0) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function formatFull(timestamp?: string) {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString();
}



'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScheduleMonitorRow } from '@/lib/api/monitoring';
import { Loader2, Play, Info } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface ScheduleTableProps {
  schedules: ScheduleMonitorRow[];
  isLoading: boolean;
  onSelect: (schedule: ScheduleMonitorRow) => void;
  onExecute: (schedule: ScheduleMonitorRow) => void;
  executingId?: number | null;
}

export function ScheduleTable({
  schedules,
  isLoading,
  onSelect,
  onExecute,
  executingId,
}: ScheduleTableProps) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Error Rate</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Runs</TableHead>
            <TableHead>Errors</TableHead>
            <TableHead>Service</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading schedules...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && schedules.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-slate-500">
                No schedules match the current filters
              </TableCell>
            </TableRow>
          )}
          {schedules.map((schedule) => (
            <TableRow
              key={schedule.id}
              className="hover:bg-slate-50 cursor-pointer"
              onClick={() => onSelect(schedule)}
            >
              <TableCell>
                <div>
                  <div className="font-medium text-slate-900 flex items-center gap-2">
                    {schedule.name || 'Unnamed Schedule'}
                    {schedule.active_job && (
                      <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200">
                        running #{schedule.active_job.job_id}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">{schedule.cron_expression || 'N/A'}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    'capitalize',
                    schedule.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200',
                  )}
                >
                  {schedule.enabled ? 'Enabled' : 'Paused'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn(getErrorColor(schedule.error_rate ?? 0))}>
                  {(schedule.error_rate ?? 0).toFixed(1)}%
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-600">{formatRelative(schedule.last_run)}</TableCell>
              <TableCell className="text-sm text-slate-600">{formatRelative(schedule.next_run)}</TableCell>
              <TableCell className="font-mono text-slate-900">{schedule.run_count ?? 0}</TableCell>
              <TableCell className="font-mono text-red-600">{schedule.error_count ?? 0}</TableCell>
              <TableCell className="text-sm text-slate-600">{schedule.target_service || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(schedule);
                    }}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={executingId === schedule.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onExecute(schedule);
                    }}
                  >
                    {executingId === schedule.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getErrorColor(rate: number) {
  if (rate >= 20) return 'bg-red-50 text-red-700 border-red-200';
  if (rate > 0) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function formatRelative(timestamp?: string) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleString();
}



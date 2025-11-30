'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { monitoringApi, MonitoringSnapshot, ScheduleMonitorRow } from '@/lib/api/monitoring';
import { schedulesApi } from '@/lib/api/schedules';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { SummaryCards } from '@/components/monitoring/SummaryCards';
import { WorkerHealthCard } from '@/components/monitoring/WorkerHealthCard';
import { QueueStatusPanel } from '@/components/monitoring/QueueStatusPanel';
import { AlertsPanel } from '@/components/monitoring/AlertsPanel';
import {
  ScheduleFilters,
  ScheduleFiltersState,
} from '@/components/monitoring/ScheduleFilters';
import { ScheduleTable } from '@/components/monitoring/ScheduleTable';
import { ScheduleDrawer } from '@/components/monitoring/ScheduleDrawer';

export default function MonitoringPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ScheduleFiltersState>({
    tenant: 'all',
    status: 'all',
    service: 'all',
  });
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleMonitorRow | null>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);

  const {
    data: snapshot,
    isLoading,
    error,
    refetch,
  } = useQuery<MonitoringSnapshot>({
    queryKey: ['monitoring'],
    queryFn: () => monitoringApi.getOverview(),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const executeMutation = useMutation({
    mutationFn: (scheduleId: number) => schedulesApi.execute(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring'] });
    },
    onSettled: () => {
      setExecutingId(null);
    },
    onError: (mutationError: any) => {
      alert(`Failed to run schedule: ${mutationError}`);
    },
  });

  const scheduleAlerts = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.schedules.filter((schedule) => schedule.error_rate >= 20 || schedule.last_error);
  }, [snapshot]);

  const tenantOptions = useMemo(() => {
    if (!snapshot) return [];
    const unique = new Map<number, string>();
    snapshot.schedules.forEach((schedule) => {
      unique.set(schedule.tenant_id, `Tenant ${schedule.tenant_id}`);
    });
    return Array.from(unique.entries()).map(([value, label]) => ({
      value: String(value),
      label,
    }));
  }, [snapshot]);

  const serviceOptions = useMemo(() => {
    if (!snapshot) return [];
    const unique = Array.from(
      new Set(
        snapshot.schedules
          .map((schedule) => schedule.target_service)
          .filter((service): service is string => Boolean(service)),
      ),
    );
    return unique.map((service) => ({
      value: service,
      label: service.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }, [snapshot]);

  const filteredSchedules = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.schedules.filter((schedule) => {
      if (filters.tenant !== 'all' && String(schedule.tenant_id) !== filters.tenant) {
        return false;
      }
      if (filters.service !== 'all' && schedule.target_service !== filters.service) {
        return false;
      }
      if (filters.status === 'enabled' && !schedule.enabled) return false;
      if (filters.status === 'disabled' && schedule.enabled) return false;
      if (filters.status === 'alert') {
        return schedule.error_rate >= 20 || !!schedule.last_error || schedule.active_job != null;
      }
      return true;
    });
  }, [snapshot, filters]);

  const handleExecute = (schedule: ScheduleMonitorRow) => {
    setExecutingId(schedule.id);
    executeMutation.mutate(schedule.id);
  };

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-red-700 mb-2">Failed to load monitoring data</p>
            <p className="text-sm text-red-600 mb-4">{String(error)}</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Monitoring</p>
          <h1 className="text-3xl font-semibold text-slate-900">Scheduler & Worker Health</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Observe scheduler status, worker queue pressure, and per-schedule reliability in real
            time. Use the filters below to focus on specific tenants or services.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={isLoading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
          Refresh
        </Button>
      </div>

      <SummaryCards snapshot={snapshot} isLoading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <WorkerHealthCard health={snapshot?.worker_health} />
        <QueueStatusPanel queue={snapshot?.queue} />
        <AlertsPanel alerts={snapshot?.alerts} />
      </div>

      <ScheduleFilters
        state={filters}
        onChange={setFilters}
        tenantOptions={tenantOptions}
        serviceOptions={serviceOptions}
        alertCount={scheduleAlerts.length}
      />

      <ScheduleTable
        schedules={filteredSchedules}
        isLoading={isLoading}
        onSelect={setSelectedSchedule}
        onExecute={handleExecute}
        executingId={executingId}
      />

      {selectedSchedule && (
        <ScheduleDrawer
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onExecute={handleExecute}
          executingId={executingId}
        />
      )}

      {!snapshot && isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      )}
    </div>
  );
}



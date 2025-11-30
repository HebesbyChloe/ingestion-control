export interface SchedulerStatus {
  is_running: boolean;
  active_schedules: number;
  poll_interval_ms: number;
  monitoring_interval_ms: number;
  last_check?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed?: number;
  stuck?: number;
}

export interface WorkerHealth {
  status: 'healthy' | 'degraded' | 'down';
  last_check: string;
  message?: string;
  queue: QueueStats;
  stuck_jobs: Array<{
    job_id: string;
    schedule_id?: number;
    runtime_seconds: number;
    started_at?: string;
    details?: string;
  }>;
}

export interface AlertItem {
  id: string;
  type:
    | 'worker_down'
    | 'stuck_jobs'
    | 'high_failures'
    | 'queue_backup'
    | 'schedule_high_error_rate'
    | string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  meta?: Record<string, any>;
}

export interface ScheduleMonitorRow {
  id: number;
  tenant_id: number;
  name: string;
  enabled: boolean;
  cron_expression: string;
  last_run?: string;
  next_run?: string;
  run_count: number;
  error_count: number;
  error_rate: number;
  target_service: string;
  target_endpoint: string;
  http_method: string;
  active_job?: {
    job_id: string;
    status: string;
    started_at: string;
    runtime_seconds: number;
  };
  last_error?: string;
}

export interface MonitoringSnapshot {
  updated_at: string;
  scheduler: SchedulerStatus;
  worker_health: WorkerHealth;
  alerts: AlertItem[];
  queue: QueueStats;
  schedules: ScheduleMonitorRow[];
  totals?: {
    schedules: number;
    active_schedules: number;
    failed_jobs: number;
    stuck_jobs: number;
  };
}

// Transform camelCase API response to snake_case interface
function transformMonitoringResponse(data: any): MonitoringSnapshot {
  // Transform scheduler (camelCase to snake_case)
  const scheduler = data.scheduler ? {
    is_running: data.scheduler.isRunning ?? false,
    active_schedules: data.scheduler.activeSchedules ?? 0,
    poll_interval_ms: data.scheduler.pollInterval ?? 0,
    monitoring_interval_ms: data.scheduler.monitoringInterval ?? 0,
    last_check: data.scheduler.lastCheck,
  } : {
    is_running: false,
    active_schedules: 0,
    poll_interval_ms: 0,
    monitoring_interval_ms: 0,
  };

  // Helper function to extract queue counts from stats array
  const getQueueCounts = (healthQueue: any) => {
    const stats = Array.isArray(healthQueue?.stats) ? healthQueue.stats : [];
    
    // Extract counts from stats array
    const getCount = (status: string) => {
      const stat = stats.find((s: any) => s.status === status);
      return stat ? parseInt(String(stat.count), 10) || 0 : 0;
    };
    
    return {
      pending: getCount('pending') || (healthQueue?.pending ?? 0),
      processing: getCount('processing') || (healthQueue?.processing ?? 0),
      failed: getCount('failed') || 0,
      completed: getCount('completed') || 0,
    };
  };

  // Transform worker health
  const workerHealthQueueCounts = getQueueCounts(data.worker?.health?.queue);
  const workerHealth = data.worker?.health ? {
    status: (data.worker.health.status || 'down') as 'healthy' | 'degraded' | 'down',
    last_check: data.worker.health.timestamp || new Date().toISOString(),
    message: data.worker.health.message,
    queue: {
      ...workerHealthQueueCounts,
      stuck: data.worker.queue?.stuckJobs?.length ?? 0,
    },
    stuck_jobs: (data.worker.queue?.stuckJobs || []).map((job: any) => ({
      job_id: job.jobId || job.job_id || String(job.id || ''),
      schedule_id: job.scheduleId || job.schedule_id,
      runtime_seconds: job.runtimeSeconds || job.runtime_seconds || 0,
      started_at: job.startedAt || job.started_at,
      details: job.details,
    })),
  } : {
    status: 'down' as const,
    last_check: new Date().toISOString(),
    queue: {
      pending: 0,
      processing: 0,
      failed: 0,
      completed: 0,
    },
    stuck_jobs: [],
  };

  // Transform queue - use same logic as worker_health.queue
  const queue = data.worker?.health?.queue ? {
    ...getQueueCounts(data.worker.health.queue),
    stuck: data.worker.queue?.stuckJobs?.length ?? 0,
  } : {
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
  };

  // Transform schedules (camelCase to snake_case)
  const schedules = Array.isArray(data.schedules) ? data.schedules.map((schedule: any) => ({
    id: typeof schedule.id === 'string' ? parseInt(schedule.id, 10) : schedule.id,
    tenant_id: schedule.tenantId ?? schedule.tenant_id ?? 1,
    name: schedule.name || 'Unnamed Schedule',
    enabled: schedule.enabled ?? false,
    cron_expression: schedule.cronExpression || schedule.cron_expression || '',
    last_run: schedule.lastRun || schedule.last_run,
    next_run: schedule.nextRun || schedule.next_run,
    run_count: schedule.runCount ?? schedule.run_count ?? 0,
    error_count: schedule.errorCount ?? schedule.error_count ?? 0,
    error_rate: schedule.errorRate ?? schedule.error_rate ?? 0,
    target_service: schedule.targetService || schedule.target_service || '',
    target_endpoint: schedule.targetEndpoint || schedule.target_endpoint || '',
    http_method: schedule.httpMethod || schedule.http_method || 'POST',
    active_job: schedule.activeJob && schedule.activeJob !== null ? {
      job_id: schedule.activeJob.jobId || schedule.activeJob.job_id || String(schedule.activeJob.id || ''),
      status: schedule.activeJob.status || 'running',
      started_at: schedule.activeJob.startedAt || schedule.activeJob.started_at || new Date().toISOString(),
      runtime_seconds: schedule.activeJob.runtimeSeconds || schedule.activeJob.runtime_seconds || 0,
    } : undefined,
    last_error: schedule.lastError || schedule.last_error,
  })) : [];

  // Transform alerts
  const alerts = Array.isArray(data.alerts) ? data.alerts.map((alert: any) => ({
    id: alert.id || String(alert.id || ''),
    type: alert.type || 'unknown',
    message: alert.message || '',
    severity: (alert.severity || 'info') as 'info' | 'warning' | 'critical',
    created_at: alert.createdAt || alert.created_at || new Date().toISOString(),
    meta: alert.meta,
  })) : [];

  return {
    updated_at: data.timestamp || data.updated_at || new Date().toISOString(),
    scheduler,
    worker_health: workerHealth,
    alerts,
    queue,
    schedules,
    totals: data.totals,
  };
}

export const monitoringApi = {
  getOverview: async (): Promise<MonitoringSnapshot> => {
    const response = await fetch('/api/scheduler/monitoring', {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to load monitoring snapshot: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the API response from camelCase to snake_case
    return transformMonitoringResponse(data);
  },
};



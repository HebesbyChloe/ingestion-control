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

export const monitoringApi = {
  getOverview: async (): Promise<MonitoringSnapshot> => {
    const response = await fetch('/api/scheduler/monitoring', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to load monitoring snapshot');
    }

    return response.json();
  },
};



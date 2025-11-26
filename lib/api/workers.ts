import { apiClient } from './client';

export interface Worker {
  id: number;
  tenant_id: number;
  job_type: string;
  job_data: {
    dryRun?: boolean;
    reason?: string;
    feedKey?: string;
    [key: string]: any;
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: {
    manifest?: any;
    [key: string]: any;
  };
  error?: string | null;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  max_retries: number;
}

export interface WorkerStats {
  total_workers: number;
  active_workers: number;
  idle_workers: number;
  failed_workers: number;
  total_tasks_today: number;
  success_rate: number;
}

export interface WorkerFilters {
  status?: string;
  tenant_id?: number;
  worker_id?: string;
  feed_name?: string;
  date_from?: string;
  date_to?: string;
}

export const workersApi = {
  // Get all workers with optional filters (using Next.js proxy to avoid CORS)
  getAll: async (filters?: WorkerFilters): Promise<Worker[]> => {
    const params = new URLSearchParams({
      order: 'started_at.desc.nullslast,created_at.desc',
    });
    
    // PostgREST filtering syntax
    if (filters?.status) {
      params.append('status', `eq.${filters.status}`);
    }
    if (filters?.tenant_id) {
      params.append('tenant_id', `eq.${filters.tenant_id}`);
    }
    if (filters?.worker_id) {
      params.append('worker_id', `eq.${filters.worker_id}`);
    }
    if (filters?.feed_name) {
      params.append('feed_name', `eq.${filters.feed_name}`);
    }
    
    // Date range filtering using created_at (handles nulls in started_at)
    if (filters?.date_from) {
      params.append('created_at', `gte.${filters.date_from}`);
    }
    if (filters?.date_to) {
      params.append('created_at', `lte.${filters.date_to}`);
    }
    
    // Use Next.js API proxy to avoid CORS issues
    const response = await fetch(`/api/workers?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch workers');
    return response.json();
  },

  // Get worker by ID (using Next.js proxy)
  getById: async (id: number): Promise<Worker> => {
    const params = new URLSearchParams({ id: `eq.${id}` });
    const response = await fetch(`/api/workers?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch worker');
    const data = await response.json();
    return data[0];
  },

  // Get worker statistics (calculated from all workers)
  getStats: async (tenantId?: number): Promise<WorkerStats> => {
    const params = new URLSearchParams();
    if (tenantId) {
      params.append('tenant_id', `eq.${tenantId}`);
    }
    
    // Use Next.js API proxy
    const response = await fetch(`/api/workers?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch workers');
    const workers: Worker[] = await response.json();
    
    // Calculate stats from the data
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return {
      total_workers: workers.length,
      active_workers: workers.filter(w => w.status === 'running').length,
      idle_workers: workers.filter(w => w.status === 'pending').length,
      failed_workers: workers.filter(w => w.status === 'failed').length,
      total_tasks_today: workers.filter(w => 
        w.started_at && new Date(w.started_at) >= startOfDay
      ).length,
      success_rate: workers.length > 0 
        ? (workers.filter(w => w.status === 'completed').length / workers.length) * 100
        : 0,
    };
  },

  // Get recent worker activities (limit using Next.js proxy)
  getRecent: async (limit: number = 20): Promise<Worker[]> => {
    const params = new URLSearchParams({
      order: 'started_at.desc.nullslast,created_at.desc',
      limit: limit.toString(),
    });
    const response = await fetch(`/api/workers?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch workers');
    return response.json();
  },

  // Retry a failed worker task (would need custom endpoint)
  retry: async (id: number): Promise<Worker> => {
    // This requires a custom endpoint on the worker service
    const response = await apiClient.post(`/worker/retry/${id}`);
    return response.data;
  },

  // Stop a running worker (would need custom endpoint)
  stop: async (id: number): Promise<void> => {
    // This requires a custom endpoint on the worker service
    await apiClient.post(`/worker/stop/${id}`);
  },
};


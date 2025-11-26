import { apiClient } from './client';

export interface Schedule {
  id: number;
  tenant_id: number;
  name: string;
  cron_expression: string;
  target_service: string;
  target_endpoint: string;
  http_method: string;
  payload?: Record<string, any>;
  headers?: Record<string, string>;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  run_count: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleInput {
  tenant_id: number;
  name: string;
  cron_expression: string;
  target_service: string;
  target_endpoint: string;
  http_method?: string;
  payload?: Record<string, any>;
  headers?: Record<string, string>;
  enabled?: boolean;
}

export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {
  id: number;
}

export const schedulesApi = {
  // Get all schedules (via Next.js API proxy)
  getAll: async (tenantId?: number): Promise<Schedule[]> => {
    const params = new URLSearchParams(tenantId ? { tenant_id: tenantId.toString() } : {});
    const response = await fetch(`/api/schedules?${params}`);
    if (!response.ok) throw new Error('Failed to fetch schedules');
    return response.json();
  },

  // Get schedule by ID
  getById: async (id: number): Promise<Schedule> => {
    const response = await fetch(`/api/schedules?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch schedule');
    return response.json();
  },

  // Create schedule
  create: async (data: CreateScheduleInput): Promise<Schedule> => {
    const response = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create schedule');
    const result = await response.json();
    // API returns array, get first item
    return Array.isArray(result) ? result[0] : result;
  },

  // Update schedule
  update: async (id: number, data: Partial<CreateScheduleInput>): Promise<Schedule> => {
    const response = await fetch(`/api/schedules?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update schedule');
    return response.json();
  },

  // Delete schedule
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/schedules?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete schedule');
  },

  // Execute schedule manually (still use apiClient for this special action)
  execute: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/scheduler/schedules/${id}/execute`);
    return response.data;
  },
};


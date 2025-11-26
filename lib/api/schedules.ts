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
  // Get all schedules
  getAll: async (tenantId?: number): Promise<Schedule[]> => {
    const params = tenantId ? { tenant_id: tenantId } : {};
    const response = await apiClient.get('/scheduler/schedules', { params });
    return response.data;
  },

  // Get schedule by ID
  getById: async (id: number): Promise<Schedule> => {
    const response = await apiClient.get(`/scheduler/schedules/${id}`);
    return response.data;
  },

  // Create schedule
  create: async (data: CreateScheduleInput): Promise<Schedule> => {
    const response = await apiClient.post('/scheduler/schedules', data);
    // API returns array, get first item
    return Array.isArray(response.data) ? response.data[0] : response.data;
  },

  // Update schedule
  update: async (id: number, data: Partial<CreateScheduleInput>): Promise<Schedule> => {
    const response = await apiClient.put(`/scheduler/schedules/${id}`, data);
    return response.data;
  },

  // Delete schedule
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/scheduler/schedules/${id}`);
  },

  // Execute schedule manually
  execute: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/scheduler/schedules/${id}/execute`);
    return response.data;
  },
};


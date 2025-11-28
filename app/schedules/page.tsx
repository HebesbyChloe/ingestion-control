'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Trash2, Edit, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi, Schedule, CreateScheduleInput } from '@/lib/api/schedules';
import { SERVICE_ENDPOINTS } from '@/lib/schedules/serviceEndpoints';
import { CRON_PRESETS, cronToHuman } from '@/lib/schedules/cronUtils';
import { CronBuilder } from '@/components/schedules/CronBuilder';
import { ScheduleDetailsPanel } from '@/components/schedules/ScheduleDetailsPanel';

export default function SchedulesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [executingScheduleId, setExecutingScheduleId] = useState<number | null>(null);
  const [togglingScheduleId, setTogglingScheduleId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch schedules from API
  const { data: schedules = [], isLoading, error } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false, // Only refetch on manual action
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateScheduleInput> }) =>
      schedulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error) => {
      alert(`Failed to update schedule: ${error}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => schedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  // Execute mutation
  const executeMutation = useMutation({
    mutationFn: (id: number) => {
      setExecutingScheduleId(id);
      return schedulesApi.execute(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setExecutingScheduleId(null);
    },
    onError: (error) => {
      console.error('Execute mutation error:', error);
      setExecutingScheduleId(null);
    },
  });

  // Toggle enabled mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => {
      setTogglingScheduleId(id);
      return schedulesApi.update(id, { enabled: !enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setTogglingScheduleId(null);
    },
    onError: (error) => {
      console.error('Toggle mutation error:', error);
      alert(`Failed to toggle schedule: ${error}`);
      setTogglingScheduleId(null);
    },
  });

  const handleUpdate = (id: number, data: Partial<CreateScheduleInput>) => {
    updateMutation.mutate({ id, data });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleExecute = (id: number) => {
    executeMutation.mutate(id, {
      onSuccess: () => {
        alert('Schedule executed successfully!');
      },
      onError: (error) => {
        alert(`Failed to execute schedule: ${error}`);
      },
    });
  };

  const handleToggle = (id: number, enabled: boolean) => {
    toggleMutation.mutate({ id, enabled });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Ingestion Schedules</h2>
          <p className="text-slate-500">Manage automated worker triggers and intervals</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-white border-slate-200">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Loading schedules...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-white border-red-200">
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Failed to load schedules: {String(error)}</p>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      {!isLoading && !error && (
        <div className="grid gap-4">
          {schedules.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No schedules found</p>
                <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                  Create your first schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onClick={() => setSelectedSchedule(schedule)}
                onExecute={() => handleExecute(schedule.id)}
                onToggle={() => handleToggle(schedule.id, schedule.enabled)}
                isExecuting={executingScheduleId === schedule.id}
                isToggling={togglingScheduleId === schedule.id}
              />
            ))
          )}
        </div>
      )}

      {showCreateForm && (
        <CreateScheduleModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
          }}
        />
      )}

      {selectedSchedule && (
        <ScheduleDetailsPanel
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onExecute={handleExecute}
        />
      )}
    </div>
  );
}

function ScheduleCard({
  schedule,
  onClick,
  onExecute,
  onToggle,
  isExecuting = false,
  isToggling = false,
}: {
  schedule: Schedule;
  onClick: () => void;
  onExecute: () => void;
  onToggle: () => void;
  isExecuting?: boolean;
  isToggling?: boolean;
}) {
  const status = schedule.enabled ? 'active' : 'paused';
  
  const now = useMemo(() => Date.now(), [schedule.last_run, schedule.next_run]);
  
  const lastRun = useMemo(() => {
    if (!schedule.last_run) return 'Never';
    return `${Math.floor((now - new Date(schedule.last_run).getTime()) / 60000)} mins ago`;
  }, [schedule.last_run, now]);
  
  const nextRun = useMemo(() => {
    if (!schedule.next_run) return schedule.enabled ? 'Calculating...' : 'N/A';
    return `${Math.floor((new Date(schedule.next_run).getTime() - now) / 60000)} mins`;
  }, [schedule.next_run, schedule.enabled, now]);

  return (
    <Card 
      className="bg-white border-slate-200 transition-all hover:border-indigo-200 hover:shadow-md group cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-medium text-slate-900">{schedule.name}</h3>
                <Badge 
                  variant="outline" 
                  className={
                    status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }
                >
                  {status}
                </Badge>
              </div>

              {/* Cron Expression */}
              <div className="mb-3">
                <div className="text-sm text-slate-700 mb-1">
                  📅 {cronToHuman(schedule.cron_expression)}
                </div>
                <code className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs">
                  {schedule.cron_expression}
                </code>
              </div>

              {/* Target Info */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-slate-500">Target Service:</span>
                  <span className="ml-2 font-medium text-slate-900">{schedule.target_service}</span>
                </div>
                <div>
                  <span className="text-slate-500">HTTP Method:</span>
                  <span className="ml-2 font-medium text-slate-900">{schedule.http_method}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Endpoint:</span>
                  <code className="ml-2 px-1.5 py-0.5 rounded bg-slate-50 text-slate-700 font-mono text-xs">
                    {schedule.target_endpoint}
                  </code>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Last: {lastRun}
                </span>
                <span>•</span>
                <span>Next: {nextRun}</span>
                <span>•</span>
                <span>Runs: {schedule.run_count}</span>
                {schedule.error_count > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-600">Errors: {schedule.error_count}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                onExecute();
              }}
              disabled={isExecuting || isToggling}
              title="Execute now"
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              disabled={isExecuting || isToggling}
              title={status === 'active' ? 'Pause schedule' : 'Enable schedule'}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : status === 'active' ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateScheduleModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    tenant_id: 1,
    name: '',
    cron_expression: '0 */3 * * *',
    target_service: 'worker',
    target_endpoint: '',
    http_method: 'POST',
  });
  
  const [selectedPreset, setSelectedPreset] = useState('0 */3 * * *');
  const [showAdvancedCron, setShowAdvancedCron] = useState(false);

  // Get available endpoints based on selected service
  const availableEndpoints = SERVICE_ENDPOINTS[formData.target_service as keyof typeof SERVICE_ENDPOINTS] || [];

  // Handle endpoint change (auto-set HTTP method)
  const handleEndpointChange = (endpoint: string) => {
    const selected = availableEndpoints.find(e => e.value === endpoint);
    setFormData({
      ...formData,
      target_endpoint: endpoint,
      http_method: selected?.method || 'GET',
    });
  };

  // Handle preset change
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setFormData({ ...formData, cron_expression: preset });
      setShowAdvancedCron(false);
    } else {
      setShowAdvancedCron(true);
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => schedulesApi.create(data),
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      alert(`Failed to create schedule: ${error}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl m-4 bg-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">Create Schedule</h2>
          <p className="text-slate-500 mb-6">Set up a new automated ingestion schedule</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Target Service</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.target_service}
                  onChange={(e) => {
                    setFormData({ ...formData, target_service: e.target.value, target_endpoint: '' });
                  }}
                >
                  <option value="worker">Worker</option>
                  <option value="mcp">MCP</option>
                  <option value="backend-api">Backend API</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Target Endpoint</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.target_endpoint}
                  onChange={(e) => handleEndpointChange(e.target.value)}
                >
                  <option value="">Select endpoint...</option>
                  {availableEndpoints.map(ep => (
                    <option key={ep.value} value={ep.value}>
                      {ep.label} ({ep.method})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Show selected endpoint details */}
            {formData.target_endpoint && (
              <div className="text-sm p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Selected endpoint:</span>
                  <Badge variant="outline" className="text-xs">
                    {formData.http_method}
                  </Badge>
                </div>
                <code className="block mt-1 text-indigo-600 font-mono">
                  {formData.target_endpoint}
                </code>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Schedule (Cron Expression)</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                {CRON_PRESETS.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              
              {/* Human readable description */}
              <div className="text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                📅 {cronToHuman(formData.cron_expression)}
              </div>
              
              {/* Advanced builder */}
              {showAdvancedCron && (
                <CronBuilder 
                  value={formData.cron_expression}
                  onChange={(cron) => setFormData({ ...formData, cron_expression: cron })}
                />
              )}
              
              {/* Toggle advanced mode */}
              {!showAdvancedCron && selectedPreset !== 'custom' && (
                <button 
                  type="button"
                  onClick={() => setShowAdvancedCron(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                >
                  ⚙️ Advanced: Edit expression manually
                </button>
              )}
              
              {/* Current expression display */}
              <div className="text-xs text-slate-400 font-mono mt-2">
                Expression: {formData.cron_expression}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

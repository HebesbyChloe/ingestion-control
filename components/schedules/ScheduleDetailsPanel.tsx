'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Save, Trash2, CheckCircle2, XCircle, Clock, Edit } from 'lucide-react';
import { useState } from 'react';
import { Schedule, CreateScheduleInput } from '@/lib/api/schedules';
import { SERVICE_ENDPOINTS } from '@/lib/schedules/serviceEndpoints';
import { CRON_PRESETS, cronToHuman } from '@/lib/schedules/cronUtils';
import { CronBuilder } from '@/components/schedules/CronBuilder';

interface ScheduleDetailsPanelProps {
  schedule: Schedule;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<CreateScheduleInput>) => void;
  onDelete: (id: number) => void;
  onExecute: (id: number) => void;
}

export function ScheduleDetailsPanel({ schedule, onClose, onUpdate, onDelete, onExecute }: ScheduleDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(() => {
    const preset = CRON_PRESETS.find(p => p.value === schedule.cron_expression);
    return preset ? preset.value : 'custom';
  });
  const [showAdvancedCron, setShowAdvancedCron] = useState(false);
  
  const [formData, setFormData] = useState<Partial<CreateScheduleInput>>({
    name: schedule.name,
    cron_expression: schedule.cron_expression,
    target_service: schedule.target_service,
    target_endpoint: schedule.target_endpoint,
    http_method: schedule.http_method,
    payload: schedule.payload,
    headers: schedule.headers,
    enabled: schedule.enabled,
  });

  const availableEndpoints = SERVICE_ENDPOINTS[formData.target_service as keyof typeof SERVICE_ENDPOINTS] || [];

  const handleEndpointChange = (endpoint: string) => {
    const selected = availableEndpoints.find(e => e.value === endpoint);
    setFormData({
      ...formData,
      target_endpoint: endpoint,
      http_method: selected?.method || 'GET',
    });
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setFormData({ ...formData, cron_expression: preset });
      setShowAdvancedCron(false);
    } else {
      setShowAdvancedCron(true);
    }
  };

  const handleSave = () => {
    onUpdate(schedule.id, formData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`⚠️ DELETE SCHEDULE?\n\nAre you absolutely sure you want to delete "${schedule.name}"?\n\nThis action cannot be undone!`)) {
      if (confirm(`⚠️ FINAL CONFIRMATION\n\nThis will permanently delete the schedule.\n\nAre you really sure?`)) {
        onDelete(schedule.id);
        onClose();
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0 mr-2">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">Schedule Details</h2>
            <p className="text-xs sm:text-sm text-slate-500 truncate">{schedule.name}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {!isEditing ? (
              <>
                <Button onClick={() => onExecute(schedule.id)} variant="outline" size="sm" className="hidden sm:inline-flex text-indigo-600">
                  Execute
                </Button>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="hidden sm:inline-flex">
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="text-xs sm:text-sm">
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm">
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </>
            )}
            <Button onClick={onClose} variant="ghost" size="icon" className="w-8 h-8 sm:w-10 sm:h-10">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Status & Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                {isEditing ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                ) : (
                  <Badge variant="outline" className={schedule.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                    {schedule.enabled ? <><CheckCircle2 className="w-3 h-3 mr-1" />Active</> : <><XCircle className="w-3 h-3 mr-1" />Paused</>}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <div className="text-slate-500 mb-1">Total Runs</div>
                  <div className="font-semibold text-slate-900">{schedule.run_count}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Error Count</div>
                  <div className={`font-semibold ${schedule.error_count > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {schedule.error_count}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Schedule ID</div>
                  <div className="font-mono text-slate-900">{schedule.id}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Tenant ID</div>
                  <div className="font-mono text-slate-900">{schedule.tenant_id}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cron Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Schedule Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Cron Expression Preset</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                      value={selectedPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                    >
                      {CRON_PRESETS.map(preset => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="text-sm text-slate-600 p-2 bg-slate-50 rounded border border-slate-200">
                    📅 {cronToHuman(formData.cron_expression || '')}
                  </div>
                  
                  {showAdvancedCron && (
                    <CronBuilder 
                      value={formData.cron_expression || ''}
                      onChange={(cron) => setFormData({ ...formData, cron_expression: cron })}
                    />
                  )}
                  
                  {!showAdvancedCron && selectedPreset !== 'custom' && (
                    <button 
                      type="button"
                      onClick={() => setShowAdvancedCron(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      ⚙️ Advanced: Edit expression manually
                    </button>
                  )}
                  
                  <div className="text-xs text-slate-400 font-mono">
                    Expression: {formData.cron_expression}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-slate-700 mb-1">
                      📅 {cronToHuman(schedule.cron_expression)}
                    </div>
                    <code className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs">
                      {schedule.cron_expression}
                    </code>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500 mb-1">Last Run</div>
                      <div className="text-slate-900">
                        {schedule.last_run 
                          ? new Date(schedule.last_run).toLocaleString()
                          : 'Never'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">Next Run</div>
                      <div className="text-slate-900">
                        {schedule.next_run 
                          ? new Date(schedule.next_run).toLocaleString()
                          : 'Not scheduled'}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Target Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Target Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Target Service</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
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
                    <label className="text-sm font-medium text-slate-700 block mb-1">Target Endpoint</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
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
                </>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-slate-500 mb-1">Service</div>
                      <Badge variant="outline">{schedule.target_service}</Badge>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">HTTP Method</div>
                      <Badge variant="outline">{schedule.http_method}</Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Endpoint</div>
                    <code className="block px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono text-xs">
                      {schedule.target_endpoint}
                    </code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Configuration */}
          {(schedule.payload || schedule.headers || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600">Advanced Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {schedule.payload && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">Payload</div>
                    <pre className="text-xs bg-slate-50 p-3 rounded border border-slate-200 overflow-auto">
                      {JSON.stringify(schedule.payload, null, 2)}
                    </pre>
                  </div>
                )}
                {schedule.headers && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">Headers</div>
                    <pre className="text-xs bg-slate-50 p-3 rounded border border-slate-200 overflow-auto">
                      {JSON.stringify(schedule.headers, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-500 mb-1">Created At</div>
                <div className="font-mono text-slate-900 text-xs">{new Date(schedule.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Updated At</div>
                <div className="font-mono text-slate-900 text-xs">{new Date(schedule.updated_at).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-slate-900">Delete This Schedule</div>
                  <div className="text-sm text-slate-500 mt-1">Once deleted, this action cannot be undone.</div>
                </div>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Action Buttons for Mobile */}
        {!isEditing && (
          <div className="sm:hidden fixed bottom-6 right-6 flex flex-col gap-3 z-10">
            <Button 
              onClick={() => onExecute(schedule.id)}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg rounded-full w-14 h-14"
            >
              <Clock className="w-5 h-5" />
            </Button>
            <Button 
              onClick={() => setIsEditing(true)} 
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg rounded-full w-14 h-14"
            >
              <Edit className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}


'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export type ScheduleFiltersState = {
  tenant: string;
  status: 'all' | 'enabled' | 'disabled' | 'alert';
  service: string;
};

interface ScheduleFiltersProps {
  state: ScheduleFiltersState;
  onChange: (next: ScheduleFiltersState) => void;
  tenantOptions: Array<{ value: string; label: string }>;
  serviceOptions: Array<{ value: string; label: string }>;
  alertCount: number;
}

export function ScheduleFilters({
  state,
  onChange,
  tenantOptions,
  serviceOptions,
  alertCount,
}: ScheduleFiltersProps) {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4 space-y-3 md:flex md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>Filter by:</span>
          <Select
            label="Tenant"
            value={state.tenant}
            options={[{ value: 'all', label: 'All Tenants' }, ...tenantOptions]}
            onChange={(tenant) => onChange({ ...state, tenant })}
          />
          <Select
            label="Service"
            value={state.service}
            options={[{ value: 'all', label: 'All Services' }, ...serviceOptions]}
            onChange={(service) => onChange({ ...state, service })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'enabled', 'disabled', 'alert'] as const).map((status) => (
            <Button
              key={status}
              variant={state.status === status ? 'default' : 'outline'}
              size="sm"
              className={
                state.status === status
                  ? 'bg-indigo-600 hover:bg-indigo-700 border-0'
                  : 'border-slate-200 text-slate-600'
              }
              onClick={() => onChange({ ...state, status })}
            >
              {status === 'alert' ? (
                <span className="flex items-center gap-1">
                  Alerts <Badge variant="secondary">{alertCount}</Badge>
                </span>
              ) : (
                status.charAt(0).toUpperCase() + status.slice(1)
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
      {label}
      <select
        className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}



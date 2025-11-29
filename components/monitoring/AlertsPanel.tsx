'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, BellRing, ShieldAlert } from 'lucide-react';
import { AlertItem } from '@/lib/api/monitoring';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';

interface AlertsPanelProps {
  alerts?: AlertItem[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export function AlertsPanel({ alerts = [] }: AlertsPanelProps) {
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base text-slate-700">Active Alerts</CardTitle>
        <Badge variant="outline">{alerts.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
        {alerts.length === 0 && (
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-emerald-500" />
            System is healthy — no alerts
          </div>
        )}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 rounded border border-slate-200 bg-slate-50 text-sm text-slate-700 space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <SeverityIcon severity={alert.severity} />
                {formatAlertType(alert.type)}
              </div>
              <Badge
                variant="outline"
                className={cn('capitalize', SEVERITY_COLORS[alert.severity])}
              >
                {alert.severity}
              </Badge>
            </div>
            <p>{alert.message}</p>
            <div className="text-xs text-slate-400">
              {new Date(alert.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatAlertType(type: string) {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'critical':
      return <ShieldAlert className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    default:
      return <BellRing className="w-4 h-4 text-indigo-500" />;
  }
}



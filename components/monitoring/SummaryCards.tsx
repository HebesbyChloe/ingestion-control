'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Activity, CalendarClock, AlertCircle, Zap } from 'lucide-react';
import { MonitoringSnapshot } from '@/lib/api/monitoring';

interface SummaryCardsProps {
  snapshot?: MonitoringSnapshot;
  isLoading: boolean;
}

export function SummaryCards({ snapshot, isLoading }: SummaryCardsProps) {
  const totals = snapshot?.totals;
  const cards = [
    {
      label: 'Total Schedules',
      value: totals?.schedules ?? snapshot?.schedules.length ?? 0,
      icon: CalendarClock,
      accent: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Active Schedules',
      value:
        totals?.active_schedules ??
        snapshot?.schedules.filter((s) => s.enabled).length ??
        0,
      icon: Activity,
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Failed Jobs',
      value: totals?.failed_jobs ?? snapshot?.queue.failed ?? 0,
      icon: AlertCircle,
      accent: 'text-red-600 bg-red-50',
    },
    {
      label: 'Stuck Jobs',
      value: totals?.stuck_jobs ?? snapshot?.worker_health.stuck_jobs.length ?? 0,
      icon: Zap,
      accent: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="border-slate-200 bg-white">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">
                  {isLoading ? '—' : card.value}
                </p>
              </div>
              <span className={`p-3 rounded-xl ${card.accent}`}>
                <Icon className="w-5 h-5" />
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}



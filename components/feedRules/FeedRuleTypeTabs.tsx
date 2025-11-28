'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Filter, ArrowRightLeft, Sparkles, Calculator, Database } from 'lucide-react';

type RuleType = 'filters' | 'fieldMappings' | 'fieldTransformations' | 'calculatedFields' | 'shardRules';

interface FeedRuleTypeTabsProps {
  selectedRuleType: RuleType;
  onSelectRuleType: (type: RuleType) => void;
  counts: {
    filters: number;
    fieldMappings: number;
    fieldTransformations: number;
    calculatedFields: number;
    shardRules: number;
  };
}

const RULE_TYPES: Array<{
  id: RuleType;
  label: string;
  icon: any;
  description: string;
}> = [
  {
    id: 'filters',
    label: 'Filters',
    icon: Filter,
    description: 'Include/exclude rows',
  },
  {
    id: 'fieldMappings',
    label: 'Field Mappings',
    icon: ArrowRightLeft,
    description: 'Map source to target',
  },
  {
    id: 'fieldTransformations',
    label: 'Transformations',
    icon: Sparkles,
    description: 'Transform values',
  },
  {
    id: 'calculatedFields',
    label: 'Calculated Fields',
    icon: Calculator,
    description: 'Compute new fields',
  },
  {
    id: 'shardRules',
    label: 'Shard Rules',
    icon: Database,
    description: 'Route to shards',
  },
];

export default function FeedRuleTypeTabs({
  selectedRuleType,
  onSelectRuleType,
  counts,
}: FeedRuleTypeTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {RULE_TYPES.map((type) => {
        const Icon = type.icon;
        const isActive = selectedRuleType === type.id;
        const count = counts[type.id];

        return (
          <button
            key={type.id}
            onClick={() => onSelectRuleType(type.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
              'hover:border-indigo-300 hover:bg-indigo-50',
              isActive
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                isActive ? 'text-indigo-600' : 'text-slate-400'
              )}
            />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-indigo-900' : 'text-slate-700'
                  )}
                >
                  {type.label}
                </span>
                {count > 0 && (
                  <Badge
                    variant={isActive ? 'default' : 'outline'}
                    className={cn(
                      'h-5 min-w-[20px] px-1.5',
                      isActive ? 'bg-indigo-600' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-slate-500">{type.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

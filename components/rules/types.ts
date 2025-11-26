import { IngestionRule } from '@/lib/api/rules';

export interface RuleColumnProps {
  rule: IngestionRule;
  isEditing: boolean;
  config: Record<string, any>;
  onConfigChange: (field: string, value: any) => void;
  onMaxPriceChange?: (ruleId: number, newMaxPrice: number) => void;
  onManualEdit?: (ruleId: number) => void;
  manuallyEditedRows?: Set<number>;
}

export interface ColumnHeader {
  key: string;
  label: string;
}

export interface RuleTypeConfig {
  component: React.ComponentType<RuleColumnProps>;
  headers: ColumnHeader[];
  defaultConfig: Record<string, any>;
}


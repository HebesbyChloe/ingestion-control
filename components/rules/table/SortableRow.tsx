import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type IngestionRule, type CreateRuleInput } from '@/lib/api/rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Check, X, GripVertical } from 'lucide-react';
import { getRuleTypeConfig } from '../ruleTypeRegistry';

interface SortableRowProps {
  rule: IngestionRule;
  isEditing: boolean;
  isPending: boolean;
  editFormData: Partial<IngestionRule>;
  pendingChange?: Partial<CreateRuleInput>;
  selectedFeed: string;
  selectedRuleType: string;
  manuallyEditedRows: Set<number>;
  onStartEdit: (rule: IngestionRule) => void;
  onSaveEdit: (rule: IngestionRule) => void;
  onCancelEdit: () => void;
  onDelete: (id: number) => void;
  onConfigChange: (field: string, value: any) => void;
  onMaxPriceChange: (ruleId: number, newMaxPrice: number) => void;
  onManualEdit: (ruleId: number) => void;
  editingRuleId: number | null;
  onRowClick: (rule: IngestionRule) => void;
}

/**
 * Sortable table row component for displaying and editing rules
 * Supports drag-and-drop reordering and inline editing
 */
export function SortableRow({
  rule,
  isEditing,
  isPending,
  editFormData,
  pendingChange,
  selectedFeed,
  selectedRuleType,
  manuallyEditedRows,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onConfigChange,
  onMaxPriceChange,
  onManualEdit,
  editingRuleId,
  onRowClick,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const currentConfig = isEditing 
    ? (editFormData.config || rule.config)
    : (pendingChange?.config || rule.config);
  
  const config = currentConfig as any;
  
  const displayData = isEditing ? editFormData : rule;
  const isNewRule = rule.id < 0;
  
  // Validate price range for pricing rules
  const isValidPriceRange = selectedRuleType === 'pricing' 
    ? (config?.min_price ?? 0) < (config?.max_price ?? 0) 
    : true;
  
  // Get the column component for this rule type
  const ruleTypeConfig = getRuleTypeConfig(selectedRuleType);
  const ColumnComponent = ruleTypeConfig.component;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`hover:bg-slate-50 ${isEditing ? '' : 'cursor-pointer'} ${isPending ? 'opacity-75 bg-amber-50' : ''} ${!isValidPriceRange ? 'bg-red-50' : ''}`}
      onClick={() => !isEditing && onRowClick(rule)}
    >
      <TableCell className="font-mono text-sm">
        {isNewRule ? <span className="text-slate-400">New</span> : rule.id}
      </TableCell>
      <TableCell>
        <span className="text-sm">{selectedFeed}</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {rule.rule_type}
        </Badge>
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={displayData.name || ''}
            onChange={(e) => onConfigChange('name', e.target.value)}
            className="w-[150px] bg-white"
            placeholder="Rule name"
          />
        ) : (
          <span className="text-sm">{rule.name || `${rule.rule_type} Rule`}</span>
        )}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          {isEditing ? (
            <Input
              type="number"
              value={displayData.priority ?? 0}
              onChange={(e) => onConfigChange('priority', Number(e.target.value))}
              className="w-[60px] bg-white"
            />
          ) : (
            <span className="text-sm">{rule.priority}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {isEditing ? (
          <select
            value={displayData.enabled ? 'true' : 'false'}
            onChange={(e) => onConfigChange('enabled', e.target.value === 'true')}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        ) : (
          <Badge 
            variant="outline"
            className={rule.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}
          >
            {rule.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        )}
      </TableCell>
      <ColumnComponent
        rule={rule}
        isEditing={isEditing}
        config={config}
        onConfigChange={onConfigChange}
        onMaxPriceChange={onMaxPriceChange}
        onManualEdit={onManualEdit}
        manuallyEditedRows={manuallyEditedRows}
      />
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSaveEdit(rule)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStartEdit(rule)}
                className="text-slate-400 hover:text-blue-600"
                disabled={editingRuleId !== null}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(rule.id)}
                className="text-slate-400 hover:text-rose-500"
                disabled={editingRuleId !== null}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}


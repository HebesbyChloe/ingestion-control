import React from 'react';
import { Input } from '@/components/ui/input';
import { TableCell } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';
import { RuleColumnProps, ColumnHeader } from './types';

export const PRICING_HEADERS: ColumnHeader[] = [
  { key: 'min_price', label: 'From (Min $)' },
  { key: 'max_price', label: 'To (Max $)' },
  { key: 'percent', label: 'Markup %' },
  { key: 'fixed_amount', label: 'Fixed Amount ($)' },
];

export default function PricingRuleColumns({
  rule,
  isEditing,
  config,
  onConfigChange,
  onMaxPriceChange,
  onManualEdit,
  manuallyEditedRows,
}: RuleColumnProps) {
  const minPrice = config?.min_price ?? 0;
  const maxPrice = config?.max_price ?? 0;
  const markup = config?.percent ?? 0;
  const fixedAmount = config?.fixed_amount ?? 0;
  
  const isValidPriceRange = minPrice < maxPrice;

  return (
    <>
      <TableCell>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={minPrice}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                onConfigChange('min_price', value);
                onManualEdit?.(rule.id);
              }}
              className={`w-[100px] bg-white ${!isValidPriceRange ? 'border-red-500' : ''}`}
            />
            {!isValidPriceRange && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
        ) : (
          <span className={`text-sm ${!isValidPriceRange ? 'text-red-600' : ''}`}>${minPrice}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={maxPrice}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                onConfigChange('max_price', value);
                onMaxPriceChange?.(rule.id, value);
                onManualEdit?.(rule.id);
              }}
              className={`w-[100px] bg-white ${!isValidPriceRange ? 'border-red-500' : ''}`}
            />
            {!isValidPriceRange && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
        ) : (
          <span className={`text-sm ${!isValidPriceRange ? 'text-red-600' : ''}`}>${maxPrice}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1000"
              value={markup}
              onChange={(e) => onConfigChange('percent', e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-[100px] bg-white"
            />
            <span className="text-slate-500 text-sm">%</span>
          </div>
        ) : (
          <span className="text-sm">{markup}%</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={fixedAmount}
              onChange={(e) => onConfigChange('fixed_amount', e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-[100px] bg-white"
            />
          </div>
        ) : (
          <span className="text-sm">${fixedAmount}</span>
        )}
      </TableCell>
    </>
  );
}


import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, MapPin, Target, Filter, FileJson } from 'lucide-react';

interface TemplateSelectorProps {
  isOpen: boolean;
  ruleTypeName: string;
  onSelect: (ruleTypeName: string, templateName: string) => void;
  onCancel: () => void;
}

const TEMPLATES = [
  {
    id: 'pricing',
    name: 'Pricing Template',
    description: 'For price range based rules with markup percentages and fixed amounts',
    icon: DollarSign,
    columns: ['Source Field', 'Target Field', 'From (Min $)', 'To (Max $)', 'Markup %', 'Fixed Amount ($)'],
    color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
  },
  {
    id: 'origin',
    name: 'Origin Template',
    description: 'For field mapping from source to target values',
    icon: MapPin,
    columns: ['Source Field', 'Source Value', 'Target Field', 'Target Value'],
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    id: 'scoring',
    name: 'Scoring Template',
    description: 'For relevance scoring with field matching and multipliers',
    icon: Target,
    columns: ['Field Name', 'Field Value', 'Target Field', 'Score Multiplier', 'Conditions'],
    color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
  },
  {
    id: 'filter',
    name: 'Filter Template',
    description: 'For filtering rules with operators and field comparisons',
    icon: Filter,
    columns: ['Field Name', 'Operator', 'Field Value'],
    color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
  },
  {
    id: 'generic',
    name: 'Generic Template',
    description: 'Flexible field mapping template for custom configurations',
    icon: FileJson,
    columns: ['Source Field', 'Source Value', 'Target Field', 'Target Value'],
    color: 'bg-slate-50 hover:bg-slate-100 border-slate-200',
  },
];

export default function TemplateSelector({ isOpen, ruleTypeName, onSelect, onCancel }: TemplateSelectorProps) {
  const [typeName, setTypeName] = useState(ruleTypeName);

  useEffect(() => {
    setTypeName(ruleTypeName);
  }, [ruleTypeName]);

  const handleSelect = (templateId: string) => {
    if (!typeName.trim()) {
      alert('Please enter a rule type name');
      return;
    }
    onSelect(typeName.trim(), templateId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Rule Type</DialogTitle>
          <DialogDescription>
            Enter a name and choose a table template for your new rule type.
          </DialogDescription>
        </DialogHeader>

        {/* Rule Type Name Input */}
        <div className="mt-4 mb-6">
          <Label htmlFor="rule-type-name" className="text-sm font-medium text-slate-700">
            Rule Type Name
          </Label>
          <Input
            id="rule-type-name"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            placeholder="e.g., custom_rule, inventory, discount"
            className="mt-2"
            autoFocus
          />
        </div>

        {/* Template Selection */}
        <div className="mb-4">
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Select Table Template
          </Label>
          <div className="grid grid-cols-2 gap-4">
            {TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className={`p-5 cursor-pointer transition-all border-2 hover:shadow-md ${template.color}`}
                  onClick={() => handleSelect(template.id)}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <Icon className="w-5 h-5 text-slate-700" />
                      </div>
                      <h3 className="font-semibold text-slate-900">{template.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{template.description}</p>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500 uppercase">Columns:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {template.columns.map((col) => (
                          <span
                            key={col}
                            className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-700"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


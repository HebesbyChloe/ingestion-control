import React, { useState, useEffect, useRef } from 'react';
import { IngestionRule } from '@/lib/api/rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, Edit2, Save, Calendar, User, FileText, Building2, Settings, Hash, Key, ToggleLeft } from 'lucide-react';
import { format } from 'date-fns';
import { getRuleTypeConfig } from './ruleTypeRegistry';

interface RuleDetailsPanelProps {
  rule: IngestionRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: IngestionRule, updates: Partial<IngestionRule>) => Promise<void>;
  selectedRuleType: string;
}

export default function RuleDetailsPanel({ rule, isOpen, onClose, onSave, selectedRuleType }: RuleDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<IngestionRule>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rule) {
      // Initialize config with defaults for pricing rules
      let config = { ...rule.config };
      
      // Ensure pricing rules have source_field and target_field
      if (selectedRuleType === 'pricing') {
        if (!config.source_field) config.source_field = [];
        if (!config.target_field) config.target_field = [];
      }
      
      setEditData({
        name: rule.name,
        priority: rule.priority,
        enabled: rule.enabled,
        notes: rule.notes,
        config: config,
      });
    }
  }, [rule, selectedRuleType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (rule) {
      setIsSaving(true);
      try {
        // Ensure source_field and target_field are arrays for pricing rules
        const finalEditData = { ...editData };
        if (selectedRuleType === 'pricing' && finalEditData.config) {
          if (typeof finalEditData.config.source_field === 'string') {
            finalEditData.config.source_field = stringToArray(finalEditData.config.source_field);
          }
          if (typeof finalEditData.config.target_field === 'string') {
            finalEditData.config.target_field = stringToArray(finalEditData.config.target_field);
          }
        }
        
        await onSave(rule, finalEditData);
        setIsEditing(false);
      } catch (error) {
        console.error('Save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    setEditData({
      ...editData,
      config: { ...editData.config, [field]: value },
    });
  };

  // Helper to convert array to comma-separated string for display
  const arrayToString = (value: any): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      return value.join(', ');
    }
    if (typeof value === 'string') return value;
    return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  };

  // Helper to convert comma-separated string to array (with space to underscore conversion)
  const stringToArray = (value: string): string[] => {
    return value.split(',').map(s => s.trim().replace(/\s+/g, '_')).filter(Boolean);
  };

  if (!isOpen || !rule) return null;

  const ruleTypeConfig = getRuleTypeConfig(selectedRuleType);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-[700px] bg-gradient-to-br from-slate-50 to-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-8 py-5 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900">Rule Details</h2>
                <Badge variant="outline" className="text-xs font-mono">
                  #{rule.id < 0 ? 'New' : rule.id}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <Key className="w-3 h-3" />
                {rule.feed_key} · {rule.rule_type}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Basic Info Card */}
          <Card className="p-6 border-slate-200 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-5">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <Label className="text-slate-700 text-sm font-medium">Rule Name</Label>
                {isEditing ? (
                  <Input
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="mt-2"
                    placeholder="Enter rule name"
                  />
                ) : (
                  <p className="mt-2 text-slate-900 font-medium">{rule.name || '-'}</p>
                )}
              </div>

              <div>
                <Label className="text-slate-700 text-sm font-medium flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  Priority
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editData.priority ?? 0}
                    onChange={(e) => setEditData({ ...editData, priority: Number(e.target.value) })}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-slate-900 font-medium">{rule.priority}</p>
                )}
              </div>

              <div>
                <Label className="text-slate-700 text-sm font-medium flex items-center gap-1.5">
                  <ToggleLeft className="w-3.5 h-3.5" />
                  Status
                </Label>
                {isEditing ? (
                  <select
                    value={editData.enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditData({ ...editData, enabled: e.target.value === 'enabled' })}
                    className="mt-2 w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                ) : (
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={`${rule.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-300'}`}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Configuration Card */}
          <Card className="p-6 border-slate-200 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-5">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Configuration</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              {(() => {
                const config = editData.config || {};
                let entries = Object.entries(config);
                
                // For pricing rules, show source_field and target_field first
                if (selectedRuleType === 'pricing') {
                const priorityFields = ['source_field', 'target_field'];
                const priorityEntries: [string, any][] = priorityFields
                  .filter(key => key in config)
                  .map(key => [key, config[key]] as [string, any]);
                const otherEntries = entries.filter(([key]) => !priorityFields.includes(key));
                entries = [...priorityEntries, ...otherEntries];
                }
                
                return entries.map(([key, value]) => {
                  const isPricingArrayField = selectedRuleType === 'pricing' && (key === 'source_field' || key === 'target_field');
                  
                  return (
                    <div key={key} className={entries.length === 1 ? 'col-span-2' : ''}>
                      <Label className="text-slate-700 text-sm font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                      </Label>
                      {isEditing ? (
                        isPricingArrayField ? (
                          <Input
                            value={arrayToString(value)}
                            onChange={(e) => {
                              // Allow spaces during input, convert to array on save
                              const inputValue = e.target.value;
                              // Store as-is during editing for better UX
                              handleConfigChange(key, inputValue);
                            }}
                            onBlur={(e) => {
                              // Convert to array with underscores when field loses focus
                              const inputValue = e.target.value;
                              handleConfigChange(key, stringToArray(inputValue));
                            }}
                            className="mt-2"
                            placeholder={`Enter ${key.replace(/_/g, ' ')} (comma-separated)`}
                          />
                        ) : (
                          <Input
                            value={typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              try {
                                const parsed = JSON.parse(newValue);
                                handleConfigChange(key, parsed);
                              } catch {
                                handleConfigChange(key, newValue);
                              }
                            }}
                            className="mt-2"
                            placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                          />
                        )
                      ) : (
                        <p className="mt-2 text-slate-900 font-mono text-sm bg-slate-50 px-3 py-2 rounded border border-slate-200">
                          {isPricingArrayField ? arrayToString(value) : (typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-'))}
                        </p>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </Card>

          {/* Metadata Card */}
          <Card className="p-6 border-slate-200 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Metadata & Notes</h3>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <Label className="text-slate-700 text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Updated At
                  </Label>
                  <p className="mt-2 text-slate-900 text-sm bg-slate-50 px-3 py-2 rounded border border-slate-200">
                    {rule.updated_at ? format(new Date(rule.updated_at), 'MMM d, yyyy HH:mm') : '-'}
                  </p>
                </div>

                <div>
                  <Label className="text-slate-700 text-sm font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Created By
                  </Label>
                  <p className="mt-2 text-slate-900 text-sm bg-slate-50 px-3 py-2 rounded border border-slate-200">
                    {rule.created_by || '-'}
                  </p>
                </div>

                <div>
                  <Label className="text-slate-700 text-sm font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Tenant ID
                  </Label>
                  <p className="mt-2 text-slate-900 text-sm bg-slate-50 px-3 py-2 rounded border border-slate-200">
                    {rule.tenant_id}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-slate-700 text-sm font-medium">Notes</Label>
                {isEditing ? (
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="mt-2 w-full min-h-[120px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Add notes about this rule..."
                  />
                ) : (
                  <p className="mt-2 text-slate-900 text-sm whitespace-pre-wrap bg-slate-50 px-3 py-2 rounded border border-slate-200 min-h-[60px]">
                    {rule.notes || 'No notes available'}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, Eye, EyeOff, X } from 'lucide-react';
import { markupRulesApi, type FeedWithMarkup, type MarkupRule, type MarkupRulesConfig, DEFAULT_PRICE_FIELDS } from '@/lib/api/markupRules';

interface MarkupRulesModalProps {
  feed: FeedWithMarkup;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function MarkupRulesModal({ feed, isOpen, onClose, onSave }: MarkupRulesModalProps) {
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [priceFields, setPriceFields] = useState<string[]>(DEFAULT_PRICE_FIELDS);
  const [newFieldInput, setNewFieldInput] = useState('');
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load existing rules when modal opens
  useEffect(() => {
    if (isOpen) {
      const normalized = markupRulesApi.normalizeMarkupRules(feed.markup_rules);
      if (normalized && normalized.rules.length > 0) {
        setRules(normalized.rules);
        setPriceFields(normalized.priceFields || DEFAULT_PRICE_FIELDS);
      } else {
        // Default: add one empty rule
        setRules([{ minPrice: 0, maxPrice: null, percent: 300 }]);
        setPriceFields(DEFAULT_PRICE_FIELDS);
      }
      setValidationErrors([]);
      setShowJsonPreview(false);
    }
  }, [isOpen, feed]);

  const handleAddRule = () => {
    // Auto-set minPrice to last rule's maxPrice if available
    const lastRule = rules[rules.length - 1];
    const newMinPrice = lastRule?.maxPrice ?? 0;
    
    setRules([...rules, { minPrice: newMinPrice, maxPrice: null, percent: 300 }]);
  };

  const handleDeleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleUpdateRule = (index: number, field: keyof MarkupRule, value: any) => {
    const updated = [...rules];
    
    // Parse numeric values
    if (field === 'minPrice' || field === 'maxPrice') {
      updated[index][field] = value === '' || value === null ? null : parseFloat(value);
    } else if (field === 'percent') {
      updated[index][field] = value === '' ? 0 : parseFloat(value);
    }
    
    setRules(updated);
  };

  const handleAddPriceField = () => {
    const trimmed = newFieldInput.trim();
    if (trimmed && !priceFields.includes(trimmed)) {
      setPriceFields([...priceFields, trimmed]);
      setNewFieldInput('');
    }
  };

  const handleRemovePriceField = (field: string) => {
    setPriceFields(priceFields.filter(f => f !== field));
  };

  const handleResetPriceFields = () => {
    setPriceFields(DEFAULT_PRICE_FIELDS);
  };

  const handleSave = async () => {
    // Validate
    const config: MarkupRulesConfig = { rules, priceFields };
    const validation = markupRulesApi.validateMarkupRules(config);
    
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    setValidationErrors([]);

    try {
      await markupRulesApi.updateMarkupRules(feed.id, config);
      onSave();
    } catch (error) {
      console.error('Error saving markup rules:', error);
      alert(`Failed to save markup rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getJsonPreview = (): string => {
    const config = markupRulesApi.denormalizeMarkupRules({ rules, priceFields });
    return JSON.stringify(config, null, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Markup Rules</DialogTitle>
          <DialogDescription>
            Configure markup percentages for <strong>{feed.label}</strong> ({feed.feed_key})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="text-sm text-red-700 space-y-1">
                  <p className="font-medium">❌ Validation Errors:</p>
                  <ul className="list-disc list-inside ml-2">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Markup Rules Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Price Range Rules</h3>
              <Button onClick={handleAddRule} size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Rule
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Min Price ($)</TableHead>
                    <TableHead>Max Price ($)</TableHead>
                    <TableHead>Markup %</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No rules added. Click "Add Rule" to create a markup rule.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={rule.minPrice ?? ''}
                            onChange={(e) => handleUpdateRule(index, 'minPrice', e.target.value)}
                            placeholder="0 or leave empty"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={rule.maxPrice ?? ''}
                            onChange={(e) => handleUpdateRule(index, 'maxPrice', e.target.value)}
                            placeholder="Leave empty for ∞"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={rule.percent}
                            onChange={(e) => handleUpdateRule(index, 'percent', e.target.value)}
                            placeholder="300"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteRule(index)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
              <strong>Rule Matching:</strong> minPrice ≤ price &lt; maxPrice (first matching rule is used)
            </div>
          </div>

          {/* Price Fields Configuration */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Price Fields to Markup</h3>
              <Button onClick={handleResetPriceFields} size="sm" variant="outline">
                Reset to Defaults
              </Button>
            </div>

            <div className="space-y-3">
              {/* Tag Display */}
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px] bg-slate-50">
                {priceFields.length === 0 ? (
                  <span className="text-sm text-slate-400">No price fields configured</span>
                ) : (
                  priceFields.map((field) => (
                    <Badge key={field} variant="secondary" className="gap-1 pr-1">
                      <span className="font-mono text-xs">{field}</span>
                      <button
                        onClick={() => handleRemovePriceField(field)}
                        className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>

              {/* Add Field Input */}
              <div className="flex gap-2">
                <Input
                  value={newFieldInput}
                  onChange={(e) => setNewFieldInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPriceField()}
                  placeholder="Enter field name (e.g., price, TotalPrice)"
                  className="flex-1"
                />
                <Button onClick={handleAddPriceField} variant="outline">
                  Add Field
                </Button>
              </div>

              <div className="text-xs text-slate-600 bg-blue-50 p-2 rounded">
                <strong>Default fields:</strong> {DEFAULT_PRICE_FIELDS.join(', ')}
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          <div>
            <Button
              onClick={() => setShowJsonPreview(!showJsonPreview)}
              variant="outline"
              size="sm"
              className="mb-3 gap-2"
            >
              {showJsonPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showJsonPreview ? 'Hide' : 'Show'} JSON Preview
            </Button>

            {showJsonPreview && (
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {getJsonPreview()}
              </pre>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Markup Rules'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


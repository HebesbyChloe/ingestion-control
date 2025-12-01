'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Save, AlertTriangle, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FeedSelector from '@/components/feedRules/FeedSelector';
import FeedRuleTypeTabs from '@/components/feedRules/FeedRuleTypeTabs';
import FilterRulesTable from '@/components/feedRules/FilterRulesTable';
import FieldMappingsTable from '@/components/feedRules/FieldMappingsTable';
import TransformationsTable from '@/components/feedRules/TransformationsTable';
import CalculatedFieldsTable from '@/components/feedRules/CalculatedFieldsTable';
import ShardRulesTable from '@/components/feedRules/ShardRulesTable';
import JsonPreviewPanel from '@/components/feedRules/JsonPreviewPanel';
import { useFeedRules } from '@/hooks/useFeedRules';
import { useFeedRulesMutations } from '@/hooks/useFeedRulesMutations';
import { feedsApi } from '@/lib/api/feeds';
import { feedRulesApi, type FeedRulesConfig } from '@/lib/api/feedRules';

type RuleType = 'filters' | 'fieldMappings' | 'fieldTransformations' | 'calculatedFields' | 'shardRules';

/**
 * Feed Rules Page Component
 * 
 * Manages feed-level rules stored in sys_feeds.rules JSONB column.
 * Supports filters, field mappings, field transformations, and calculated fields.
 */
export default function FeedRulesPage() {
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
  const [selectedRuleType, setSelectedRuleType] = useState<RuleType>('fieldMappings');
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyToFeedId, setCopyToFeedId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch the selected feed to get field schema
  const { data: selectedFeed } = useQuery({
    queryKey: ['feed', selectedFeedId],
    queryFn: () => selectedFeedId ? feedsApi.getById(selectedFeedId) : null,
    enabled: !!selectedFeedId,
  });

  // Fetch all feeds for copy dialog
  const { data: allFeeds = [] } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => feedsApi.getAll(),
  });

  // Fetch rules for selected feed
  const {
    rules,
    localRules,
    setLocalRules,
    isLoading,
    error,
    pendingChanges,
    hasPendingChanges,
  } = useFeedRules(selectedFeedId);

  // Mutations for saving
  const { saveRulesMutation } = useFeedRulesMutations(selectedFeedId, setLocalRules);

  const handleSaveChanges = () => {
    if (!selectedFeedId || !hasPendingChanges) return;

    saveRulesMutation.mutate(localRules, {
      onSuccess: () => {
        alert('Rules saved successfully!');
      },
      onError: (error) => {
        console.error('Failed to save rules:', error);
        alert(`Failed to save rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
    });
  };

  const handleCopyRules = async () => {
    if (!selectedFeedId || !copyToFeedId) {
      alert('Please select both source and target feeds');
      return;
    }

    if (selectedFeedId === copyToFeedId) {
      alert('Source and target feeds cannot be the same');
      return;
    }

    try {
      // Get rules from source feed
      const sourceRules = await feedRulesApi.getFeedRules(selectedFeedId);
      
      // Copy rules to target feed
      await feedRulesApi.updateFeedRules(copyToFeedId, sourceRules);
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['feedRules'] });
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      
      alert(`Successfully copied rules from feed ID ${selectedFeedId} to feed ID ${copyToFeedId}`);
      setShowCopyDialog(false);
      setCopyToFeedId(null);
    } catch (error) {
      console.error('Failed to copy rules:', error);
      alert(`Failed to copy rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportRules = (importedRules: FeedRulesConfig) => {
    if (!selectedFeedId) return;

    // Show confirmation
    const totalRules = 
      (importedRules.filters?.length || 0) +
      (importedRules.fieldMappings?.length || 0) +
      (importedRules.fieldTransformations?.length || 0) +
      (importedRules.calculatedFields?.length || 0) +
      (importedRules.shardRules?.length || 0);

    if (totalRules === 0) {
      alert('No rules found in imported JSON');
      return;
    }

    const confirmed = window.confirm(
      `Import ${totalRules} rule(s)? Existing rules will be merged with imported rules.`
    );
    if (!confirmed) return;

    // Merge strategy: combine arrays, keeping existing and adding new
    const mergedRules: FeedRulesConfig = {
      filters: [
        ...(localRules.filters || []),
        ...(importedRules.filters || []),
      ],
      fieldMappings: [
        ...(localRules.fieldMappings || []),
        ...(importedRules.fieldMappings || []),
      ],
      fieldTransformations: [
        ...(localRules.fieldTransformations || []),
        ...(importedRules.fieldTransformations || []),
      ],
      calculatedFields: [
        ...(localRules.calculatedFields || []),
        ...(importedRules.calculatedFields || []),
      ],
      shardRules: [
        ...(localRules.shardRules || []),
        ...(importedRules.shardRules || []),
      ],
    };

    setLocalRules(mergedRules);
    alert(`Import complete: ${totalRules} rule(s) added to existing rules.`);
  };

  // Get count for each rule type
  const getCounts = () => {
    return {
      filters: localRules.filters?.length || 0,
      fieldMappings: localRules.fieldMappings?.length || 0,
      fieldTransformations: localRules.fieldTransformations?.length || 0,
      calculatedFields: localRules.calculatedFields?.length || 0,
      shardRules: localRules.shardRules?.length || 0,
    };
  };

  const counts = getCounts();

  // Validation: Check if all fields from field_schema are mapped
  const validateFieldMappings = () => {
    if (!selectedFeed?.field_schema?.fields || !selectedFeed.field_schema.fields.length) {
      return { isValid: true, unmappedFields: [] };
    }

    const fieldMappings = selectedFeed.field_mapping || [];
    
    // Create a map of source field -> mapping to check both existence and valid target
    const mappingMap = new Map<string, any>();
    fieldMappings.forEach((m: any) => {
      if (m?.source) {
        mappingMap.set(m.source, m);
      }
    });

    // A field is considered mapped if:
    // 1. It exists in the mappings
    // 2. The target is either "ignore" or a non-empty string (valid path)
    const unmappedFields = selectedFeed.field_schema.fields.filter((field) => {
      const mapping = mappingMap.get(field.name);
      if (!mapping) {
        console.log(`❌ Field "${field.name}" not found in mappings`);
        return true; // Field not found in mappings
      }
      // Check if target is valid: must be "ignore" or a non-empty string
      const target = mapping.target;
      if (!target || (typeof target === 'string' && target.trim() === '')) {
        console.log(`❌ Field "${field.name}" has empty target:`, mapping);
        return true; // Target is empty, field is not properly mapped
      }
      return false; // Field is properly mapped
    });
    
    console.log('🔍 Field mapping validation:', {
      totalFields: selectedFeed.field_schema.fields.length,
      totalMappings: fieldMappings.length,
      unmappedCount: unmappedFields.length,
      unmappedFields: unmappedFields.map(f => f.name),
    });

    return {
      isValid: unmappedFields.length === 0,
      unmappedFields,
    };
  };

  const fieldMappingValidation = validateFieldMappings();
  const canAccessOtherRules = fieldMappingValidation.isValid;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Feed Rules</h2>
          <p className="text-slate-500">Manage filters, field mappings, transformations, and calculated fields</p>
        </div>
      </div>

      {/* Feed Selector */}
      <FeedSelector
        selectedFeedId={selectedFeedId}
        onSelectFeed={setSelectedFeedId}
      />

      {/* Show content only if feed is selected */}
      {selectedFeedId && (
        <>
          {/* Validation Warning */}
          {!fieldMappingValidation.isValid && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-amber-900 mb-1">
                      Field Mappings Required
                    </div>
                    <div className="text-sm text-amber-700">
                      {fieldMappingValidation.unmappedFields.length} field(s) from the field schema are not mapped. 
                      Please complete field mappings before configuring other rules.
                    </div>
                    {fieldMappingValidation.unmappedFields.length > 0 && (
                      <div className="mt-2 text-xs text-amber-600">
                        Unmapped fields: {fieldMappingValidation.unmappedFields.map(f => f.name).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rule Type Tabs */}
          <FeedRuleTypeTabs
            selectedRuleType={selectedRuleType}
            onSelectRuleType={(type) => {
              // Prevent switching to other rules if field mappings are incomplete
              if (!canAccessOtherRules && type !== 'fieldMappings') {
                alert('Please complete all field mappings before configuring other rules.');
                return;
              }
              setSelectedRuleType(type);
            }}
            counts={counts}
            disabledTabs={!canAccessOtherRules ? ['filters', 'fieldTransformations', 'calculatedFields', 'shardRules'] : []}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasPendingChanges && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {pendingChanges} unsaved change{pendingChanges !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCopyDialog(true)}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Rules
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
              >
                {showJsonPreview ? 'Hide' : 'Show'} JSON
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={!hasPendingChanges || saveRulesMutation.isPending}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saveRulesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Rules Table Card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="capitalize">
                {selectedRuleType.replace(/([A-Z])/g, ' $1').trim()} Rules
              </CardTitle>
              <CardDescription>
                {selectedRuleType === 'filters' && 'Filter rows based on field conditions'}
                {selectedRuleType === 'fieldMappings' && 'Map source fields to target fields'}
                {selectedRuleType === 'fieldTransformations' && 'Transform field values conditionally'}
                {selectedRuleType === 'calculatedFields' && 'Create calculated fields using operations'}
                {selectedRuleType === 'shardRules' && 'Route data to different shards based on conditions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">
                  Loading rules...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Error loading rules: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
              ) : (
                <>
                  {selectedRuleType === 'filters' && (
                    <FilterRulesTable
                      rules={localRules}
                      setRules={setLocalRules}
                      fieldSchema={selectedFeed?.field_schema}
                    />
                  )}
                  {selectedRuleType === 'fieldMappings' && (
                    <FieldMappingsTable
                      feedId={selectedFeedId}
                      fieldSchema={selectedFeed?.field_schema}
                      onMappingsChange={(mappings) => {
                        // Update feed's field_mapping when mappings change
                        // This will trigger a refetch of the feed for validation
                        if (selectedFeedId) {
                          queryClient.invalidateQueries({ queryKey: ['feed', selectedFeedId] });
                          queryClient.invalidateQueries({ queryKey: ['feeds'] });
                        }
                      }}
                    />
                  )}
                  {selectedRuleType === 'fieldTransformations' && (
                    <TransformationsTable
                      rules={localRules}
                      setRules={setLocalRules}
                      fieldSchema={selectedFeed?.field_schema}
                    />
                  )}
                  {selectedRuleType === 'calculatedFields' && (
                    <CalculatedFieldsTable
                      rules={localRules}
                      setRules={setLocalRules}
                    />
                  )}
                  {selectedRuleType === 'shardRules' && (
                    <ShardRulesTable
                      rules={localRules}
                      setRules={setLocalRules}
                      fieldSchema={selectedFeed?.field_schema}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* JSON Preview Panel */}
          {showJsonPreview && (
            <JsonPreviewPanel
              rules={localRules}
              onClose={() => setShowJsonPreview(false)}
              onImport={handleImportRules}
              feedKey={selectedFeed?.feed_key || selectedFeed?.label || 'unknown'}
            />
          )}
        </>
      )}

      {/* No Feed Selected State */}
      {!selectedFeedId && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center text-slate-500">
              <p className="text-lg">Select a feed to manage its rules</p>
              <p className="text-sm mt-2">Use the dropdown above to choose a feed</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Copy Rules Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Feed Rules</DialogTitle>
            <DialogDescription>
              Copy all rules from the current feed to another feed. This will overwrite the target feed's existing rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Source Feed (Current)
              </label>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                {selectedFeed && (
                  <div>
                    <div className="font-medium">{selectedFeed.label}</div>
                    <div className="text-sm text-slate-500">{selectedFeed.feed_key} (ID: {selectedFeed.id})</div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Target Feed (Copy To)
              </label>
              <Select
                value={copyToFeedId?.toString() || ''}
                onValueChange={(value) => setCopyToFeedId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target feed..." />
                </SelectTrigger>
                <SelectContent>
                  {allFeeds
                    .filter(feed => feed.id !== selectedFeedId)
                    .map((feed) => (
                      <SelectItem key={feed.id} value={feed.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{feed.label}</span>
                          <span className="text-xs text-slate-500">{feed.feed_key} (ID: {feed.id})</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCopyDialog(false);
              setCopyToFeedId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCopyRules} disabled={!copyToFeedId}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Rules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


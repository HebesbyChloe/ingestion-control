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
  const [selectedRuleType, setSelectedRuleType] = useState<RuleType>('filters');
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
          {/* Rule Type Tabs */}
          <FeedRuleTypeTabs
            selectedRuleType={selectedRuleType}
            onSelectRuleType={setSelectedRuleType}
            counts={counts}
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
                      rules={localRules}
                      setRules={setLocalRules}
                      fieldSchema={selectedFeed?.field_schema}
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


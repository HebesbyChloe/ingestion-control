'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Save, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FeedSelector from '@/components/feedRules/FeedSelector';
import FeedRuleTypeTabs from '@/components/feedRules/FeedRuleTypeTabs';
import FilterRulesTable from '@/components/feedRules/FilterRulesTable';
import FieldMappingsTable from '@/components/feedRules/FieldMappingsTable';
import TransformationsTable from '@/components/feedRules/TransformationsTable';
import CalculatedFieldsTable from '@/components/feedRules/CalculatedFieldsTable';
import JsonPreviewPanel from '@/components/feedRules/JsonPreviewPanel';
import { useFeedRules } from '@/hooks/useFeedRules';
import { useFeedRulesMutations } from '@/hooks/useFeedRulesMutations';
import type { FeedRulesConfig } from '@/lib/api/feedRules';

type RuleType = 'filters' | 'fieldMappings' | 'fieldTransformations' | 'calculatedFields';

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

  // Get count for each rule type
  const getCounts = () => {
    return {
      filters: localRules.filters?.length || 0,
      fieldMappings: localRules.fieldMappings?.length || 0,
      fieldTransformations: localRules.fieldTransformations?.length || 0,
      calculatedFields: localRules.calculatedFields?.length || 0,
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
                    />
                  )}
                  {selectedRuleType === 'fieldMappings' && (
                    <FieldMappingsTable
                      rules={localRules}
                      setRules={setLocalRules}
                    />
                  )}
                  {selectedRuleType === 'fieldTransformations' && (
                    <TransformationsTable
                      rules={localRules}
                      setRules={setLocalRules}
                    />
                  )}
                  {selectedRuleType === 'calculatedFields' && (
                    <CalculatedFieldsTable
                      rules={localRules}
                      setRules={setLocalRules}
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
    </div>
  );
}


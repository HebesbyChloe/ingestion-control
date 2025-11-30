'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Upload } from 'lucide-react';
import type { IngestionRule } from '@/lib/api/rules';
import { JsonImportDialog } from './JsonImportDialog';
import { parseCombinedConfig } from '@/lib/rules/jsonGenerator';

interface JsonConfigCardProps {
  selectedFeed: string | null;
  allFeedRules: IngestionRule[];
  showConfig: boolean;
  onToggleConfig: () => void;
  getCombinedConfig: () => any;
  onImportRules?: (rules: IngestionRule[]) => void;
}

/**
 * JsonConfigCard Component
 * 
 * Displays a collapsible card showing the combined JSON configuration
 * for all enabled rules in the selected feed.
 * 
 * Features:
 * - Shows/hides with toggle button
 * - Displays formatted JSON with syntax highlighting
 * - Only renders when there are enabled rules for the selected feed
 * 
 * @component
 */
export function JsonConfigCard({
  selectedFeed,
  allFeedRules,
  showConfig,
  onToggleConfig,
  getCombinedConfig,
  onImportRules,
}: JsonConfigCardProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Don't render if no enabled rules for this feed (unless import is available)
  const hasEnabledRules = allFeedRules.filter(
    r => r.feed_key === selectedFeed && r.enabled
  ).length > 0;

  if (!hasEnabledRules && !onImportRules) {
    return null;
  }

  const handleImport = (json: any) => {
    if (!onImportRules || !selectedFeed) return;
    
    try {
      const tenantId = 1; // Default tenant, should be passed as prop if needed
      const importedRules = parseCombinedConfig(json, selectedFeed, tenantId);
      onImportRules(importedRules);
    } catch (error) {
      console.error('Failed to import rules:', error);
      alert(`Failed to import rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-900">Feed Configuration (JSON)</CardTitle>
            <CardDescription className="text-slate-500">
              {hasEnabledRules 
                ? `Complete configuration for feed "${selectedFeed}" - All enabled rules (pricing, origin, scoring, filter)`
                : `Import or view configuration for feed "${selectedFeed}"`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onImportRules && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                className="text-slate-600 hover:text-slate-900"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import JSON
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleConfig}
              className="text-slate-600 hover:text-slate-900"
            >
              {showConfig ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Config
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  View Config JSON
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {showConfig && (
        <CardContent>
          <pre className="bg-slate-900 text-green-400 rounded-md p-4 overflow-x-auto text-sm font-mono">
            <code>{JSON.stringify(getCombinedConfig(), null, 2)}</code>
          </pre>
        </CardContent>
      )}
      {onImportRules && selectedFeed && (
        <JsonImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
          feedKey={selectedFeed}
        />
      )}
    </Card>
  );
}


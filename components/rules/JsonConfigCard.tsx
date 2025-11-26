'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { IngestionRule } from '@/lib/api/rules';

interface JsonConfigCardProps {
  selectedFeed: string | null;
  allFeedRules: IngestionRule[];
  showConfig: boolean;
  onToggleConfig: () => void;
  getCombinedConfig: () => any;
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
}: JsonConfigCardProps) {
  // Don't render if no enabled rules for this feed
  const hasEnabledRules = allFeedRules.filter(
    r => r.feed_key === selectedFeed && r.enabled
  ).length > 0;

  if (!hasEnabledRules) {
    return null;
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-900">Feed Configuration (JSON)</CardTitle>
            <CardDescription className="text-slate-500">
              Complete configuration for feed "{selectedFeed}" - All enabled rules (pricing, origin, scoring, filter)
            </CardDescription>
          </div>
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
      </CardHeader>
      {showConfig && (
        <CardContent>
          <pre className="bg-slate-900 text-green-400 rounded-md p-4 overflow-x-auto text-sm font-mono">
            <code>{JSON.stringify(getCombinedConfig(), null, 2)}</code>
          </pre>
        </CardContent>
      )}
    </Card>
  );
}


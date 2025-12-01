'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import type { FeedRulesConfig } from '@/lib/api/feedRules';
import { JsonImportDialog } from '@/components/rules/JsonImportDialog';

interface RulesPreviewPanelProps {
  rules: FeedRulesConfig;
  onClose: () => void;
  onImport?: (json: FeedRulesConfig) => void;
  feedKey?: string;
}

export default function RulesPreviewPanel({ rules, onClose, onImport, feedKey }: RulesPreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Create rules config without fieldMappings (since they're stored separately now)
  const rulesWithoutMappings: FeedRulesConfig = {
    filters: rules.filters || [],
    fieldTransformations: rules.fieldTransformations || [],
    calculatedFields: rules.calculatedFields || [],
    shardRules: rules.shardRules || [],
    // Explicitly exclude fieldMappings
  };

  const jsonString = JSON.stringify(rulesWithoutMappings, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = (json: any) => {
    if (!onImport) return;
    
    try {
      // Validate and normalize the imported JSON (excluding fieldMappings)
      const importedRules: FeedRulesConfig = {
        filters: Array.isArray(json.filters) ? json.filters : [],
        fieldTransformations: Array.isArray(json.fieldTransformations) ? json.fieldTransformations : [],
        calculatedFields: Array.isArray(json.calculatedFields) ? json.calculatedFields : [],
        shardRules: Array.isArray(json.shardRules) ? json.shardRules : [],
        // Explicitly exclude fieldMappings from import
      };
      
      onImport(importedRules);
    } catch (error) {
      console.error('Failed to import rules:', error);
      alert(`Failed to import rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="border-2 border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-lg">Rules JSON Preview</CardTitle>
          <CardDescription>
            Rules configuration (filters, transformations, calculated fields, shard rules) from rules column
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {onImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import JSON
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-[500px] overflow-y-auto">
              {jsonString}
            </pre>
            <div className="absolute top-2 right-2 bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">
              JSON
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-600 space-y-1">
            <p><strong>Total Size:</strong> {new Blob([jsonString]).size} bytes</p>
            <p>
              <strong>Filters:</strong> {rulesWithoutMappings.filters?.length || 0} | 
              <strong> Transformations:</strong> {rulesWithoutMappings.fieldTransformations?.length || 0} | 
              <strong> Calculated Fields:</strong> {rulesWithoutMappings.calculatedFields?.length || 0} | 
              <strong> Shard Rules:</strong> {rulesWithoutMappings.shardRules?.length || 0}
            </p>
            <p className="text-slate-500 italic">
              Note: Field mappings are stored separately in the field_mapping column
            </p>
          </div>
        </CardContent>
      )}
      {onImport && feedKey && (
        <JsonImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
          feedKey={feedKey}
        />
      )}
    </Card>
  );
}


'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { FeedRulesConfig } from '@/lib/api/feedRules';

interface JsonPreviewPanelProps {
  rules: FeedRulesConfig;
  onClose: () => void;
}

export default function JsonPreviewPanel({ rules, onClose }: JsonPreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const jsonString = JSON.stringify(rules, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-2 border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-lg">JSON Preview</CardTitle>
          <CardDescription>
            Complete rules configuration for this feed
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
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
            <p><strong>Filters:</strong> {rules.filters?.length || 0} | <strong>Field Mappings:</strong> {rules.fieldMappings?.length || 0} | <strong>Transformations:</strong> {rules.fieldTransformations?.length || 0} | <strong>Calculated Fields:</strong> {rules.calculatedFields?.length || 0}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

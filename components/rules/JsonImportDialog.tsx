'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JsonImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (json: any) => void;
  feedKey: string;
}

export function JsonImportDialog({
  isOpen,
  onClose,
  onImport,
  feedKey,
}: JsonImportDialogProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [previewCount, setPreviewCount] = useState<{
    pricing: number;
    origin: number;
    scoring: number;
    filter: number;
  } | null>(null);

  const validateJson = () => {
    setError(null);
    setIsValidating(true);
    setParsedJson(null);
    setPreviewCount(null);

    try {
      if (!jsonText.trim()) {
        setError('Please paste JSON configuration');
        setIsValidating(false);
        return;
      }

      const parsed = JSON.parse(jsonText);

      // Basic validation - check if it looks like a combined config
      if (typeof parsed !== 'object' || parsed === null) {
        setError('Invalid JSON: Expected an object');
        setIsValidating(false);
        return;
      }

      // Count rules by type for preview (support both combined config and markup rules format)
      const markupCount = Array.isArray(parsed.rules) ? parsed.rules.length : (Array.isArray(parsed) ? parsed.length : 0);
      const feedRulesCount = (Array.isArray(parsed.filters) ? parsed.filters.length : 0) +
                            (Array.isArray(parsed.fieldMappings) ? parsed.fieldMappings.length : 0) +
                            (Array.isArray(parsed.fieldTransformations) ? parsed.fieldTransformations.length : 0) +
                            (Array.isArray(parsed.calculatedFields) ? parsed.calculatedFields.length : 0) +
                            (Array.isArray(parsed.shardRules) ? parsed.shardRules.length : 0);
      
      const counts = {
        pricing: Array.isArray(parsed.markup_rules) ? parsed.markup_rules.length : markupCount,
        origin: Array.isArray(parsed.field_mapping) ? parsed.field_mapping.length : 0,
        scoring: Array.isArray(parsed.scoring_rules) ? parsed.scoring_rules.length : 0,
        filter: Array.isArray(parsed.filter_rules) ? parsed.filter_rules.length : 0,
      };

      const totalRules = counts.pricing + counts.origin + counts.scoring + counts.filter + feedRulesCount;

      if (totalRules === 0) {
        setError('No rules found in JSON. Expected markup_rules, field_mapping, scoring_rules, filter_rules, rules (markup), or feed rules arrays.');
        setIsValidating(false);
        return;
      }
      
      // Set preview counts (adjust for feed rules if present)
      if (feedRulesCount > 0) {
        setPreviewCount({
          pricing: 0,
          origin: feedRulesCount,
          scoring: 0,
          filter: 0,
        });
      } else {
        setPreviewCount(counts);
      }

      setParsedJson(parsed);
      setPreviewCount(counts);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Invalid JSON: ${e.message}`
          : 'Invalid JSON format'
      );
      setParsedJson(null);
      setPreviewCount(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = () => {
    if (parsedJson) {
      onImport(parsedJson);
      handleClose();
    }
  };

  const handleClose = () => {
    setJsonText('');
    setError(null);
    setParsedJson(null);
    setPreviewCount(null);
    setIsValidating(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import JSON Configuration</DialogTitle>
          <DialogDescription>
            Paste the JSON configuration for feed &quot;{feedKey}&quot;. Rules will be merged with existing rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              JSON Configuration
            </label>
            <Textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setError(null);
                setParsedJson(null);
                setPreviewCount(null);
              }}
              placeholder='Paste JSON here, e.g.:\n{\n  "feed_name": "my-feed",\n  "markup_rules": [...],\n  "scoring_rules": [...]\n}'
              className="font-mono text-sm min-h-[200px]"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {previewCount && parsedJson && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Preview - Rules to import:</div>
                <div className="text-sm space-y-1">
                  {previewCount.pricing > 0 && (
                    <div>• {previewCount.pricing} pricing rule(s)</div>
                  )}
                  {previewCount.origin > 0 && (
                    <div>• {previewCount.origin} origin rule(s)</div>
                  )}
                  {previewCount.scoring > 0 && (
                    <div>• {previewCount.scoring} scoring rule(s)</div>
                  )}
                  {previewCount.filter > 0 && (
                    <div>• {previewCount.filter} filter rule(s)</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={validateJson} disabled={isValidating || !jsonText.trim()}>
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate JSON'
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedJson || !!error}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Import Rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


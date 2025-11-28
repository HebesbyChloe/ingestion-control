'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, ChevronDown, ChevronUp, Key, DollarSign, FileJson } from 'lucide-react';
import { feedsApi, type Feed } from '@/lib/api/feeds';

interface FeedSelectorProps {
  selectedFeedId: number | null;
  onSelectFeed: (feedId: number) => void;
}

export default function FeedSelector({ selectedFeedId, onSelectFeed }: FeedSelectorProps) {
  const [showFieldSchema, setShowFieldSchema] = useState(false);
  
  const { data: feeds, isLoading, error } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => feedsApi.getAll(),
  });

  const selectedFeed = feeds?.find(f => f.id === selectedFeedId);
  const fieldSchema = selectedFeed?.field_schema;
  const hasFields = fieldSchema && fieldSchema.fields && fieldSchema.fields.length > 0;

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-[120px]">
            <Radio className="w-5 h-5 text-indigo-600" />
            <label className="text-sm font-medium text-slate-700">
              Select Feed:
            </label>
          </div>
          <div className="flex-1">
            {isLoading ? (
              <div className="text-sm text-slate-500">Loading feeds...</div>
            ) : error ? (
              <div className="text-sm text-red-500">Error loading feeds</div>
            ) : (
              <Select
                value={selectedFeedId?.toString() || ''}
                onValueChange={(value) => onSelectFeed(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  {selectedFeed ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">{selectedFeed.label}</span>
                        <span className="text-xs text-slate-500">{selectedFeed.feed_key}</span>
                      </div>
                      <Badge variant="outline" className="ml-2 font-mono text-xs">
                        ID: {selectedFeed.id}
                      </Badge>
                    </div>
                  ) : (
                    <SelectValue placeholder="Choose a feed to manage rules" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {feeds?.map((feed) => (
                    <SelectItem key={feed.id} value={feed.id.toString()}>
                      <div className="flex items-center justify-between gap-3 min-w-[300px]">
                        <div className="flex flex-col">
                          <span className="font-medium">{feed.label}</span>
                          <span className="text-xs text-slate-500">{feed.feed_key}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          ID: {feed.id}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        {selectedFeed && (
          <>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Feed Key:</span>
                  <div className="font-mono text-xs font-medium">{selectedFeed.feed_key}</div>
                </div>
                <div>
                  <span className="text-slate-500">Collection:</span>
                  <div className="font-mono text-xs font-medium">{selectedFeed.typesense_collection}</div>
                </div>
                <div>
                  <span className="text-slate-500">Shard Strategy:</span>
                  <div className="font-mono text-xs font-medium">{selectedFeed.shard_strategy}</div>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <div className={`text-xs font-medium ${selectedFeed.enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedFeed.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
            </div>

            {/* Available Fields Section */}
            {hasFields && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => setShowFieldSchema(!showFieldSchema)}
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-between hover:bg-indigo-50 text-indigo-700"
                >
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    <span className="font-medium">
                      Available Fields ({fieldSchema.fields.length})
                    </span>
                  </div>
                  {showFieldSchema ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>

                {showFieldSchema && (
                  <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                    {fieldSchema.fields.map((field, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-900 text-sm">
                                {field.name}
                              </span>
                              {field.isPrimaryKey && (
                                <span title="Primary Key">
                                  <Key className="w-3 h-3 text-amber-600" />
                                </span>
                              )}
                              {field.isPriceField && (
                                <span title="Price Field">
                                  <DollarSign className="w-3 h-3 text-green-600" />
                                </span>
                              )}
                              {field.required && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  Required
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {field.sample && (
                                <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                  {field.sample}
                                </code>
                              )}
                            </div>

                            {field.description && (
                              <p className="text-xs text-slate-600 mb-2">
                                {field.description}
                              </p>
                            )}

                            {field.aliases && field.aliases.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-slate-500">Aliases:</span>
                                {field.aliases.map((alias, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs bg-slate-50 text-slate-600"
                                  >
                                    {alias}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

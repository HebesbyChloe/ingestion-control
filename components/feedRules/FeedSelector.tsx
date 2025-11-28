'use client';

import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Radio } from 'lucide-react';
import { feedsApi, type Feed } from '@/lib/api/feeds';

interface FeedSelectorProps {
  selectedFeedId: number | null;
  onSelectFeed: (feedId: number) => void;
}

export default function FeedSelector({ selectedFeedId, onSelectFeed }: FeedSelectorProps) {
  const { data: feeds, isLoading, error } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => feedsApi.getAll(),
  });

  const selectedFeed = feeds?.find(f => f.id === selectedFeedId);

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
                  <SelectValue placeholder="Choose a feed to manage rules" />
                </SelectTrigger>
                <SelectContent>
                  {feeds?.map((feed) => (
                    <SelectItem key={feed.id} value={feed.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{feed.label}</span>
                        <span className="text-xs text-slate-500">{feed.feed_key}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        {selectedFeed && (
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
        )}
      </CardContent>
    </Card>
  );
}


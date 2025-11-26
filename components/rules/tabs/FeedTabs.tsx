'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Plus, Trash2, Copy } from 'lucide-react';

interface FeedTabsProps {
  feedKeys: string[];
  selectedFeed: string | null;
  isLoadingFeeds: boolean;
  onSelectFeed: (feed: string) => void;
  onDeleteFeed: (feed: string) => void;
  onAddFeed: (feedKey: string) => void;
  onCopyFeed: (toFeedKey: string) => void;
  newFeedKey: string;
  setNewFeedKey: (key: string) => void;
  isAddingFeed: boolean;
  setIsAddingFeed: (open: boolean) => void;
  copyToFeedKey: string;
  setCopyToFeedKey: (key: string) => void;
  isCopyingFeed: boolean;
  setIsCopyingFeed: (open: boolean) => void;
}

/**
 * FeedTabs Component
 * 
 * Displays horizontal tabs for feed selection with:
 * - Feed tab buttons with context menu for deletion
 * - Add Feed button with popover dialog
 * - Copy Feed button with popover dialog
 * - Visual "Feeds:" label for clarity
 * 
 * @component
 */
export function FeedTabs({
  feedKeys,
  selectedFeed,
  isLoadingFeeds,
  onSelectFeed,
  onDeleteFeed,
  onAddFeed,
  onCopyFeed,
  newFeedKey,
  setNewFeedKey,
  isAddingFeed,
  setIsAddingFeed,
  copyToFeedKey,
  setCopyToFeedKey,
  isCopyingFeed,
  setIsCopyingFeed,
}: FeedTabsProps) {
  const handleAddFeedSubmit = () => {
    onAddFeed(newFeedKey);
  };

  const handleCopyFeedSubmit = () => {
    onCopyFeed(copyToFeedKey);
  };

  return (
    <div className="border-b border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-x-auto">
          {/* Visual label for clarity */}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Feeds:
          </span>
          
          {isLoadingFeeds ? (
            <div className="px-4 py-2 text-sm text-slate-500">Loading feeds...</div>
          ) : (
            <>
              {feedKeys.map((feedKey) => (
                <ContextMenu key={feedKey}>
                  <ContextMenuTrigger>
                    <button
                      onClick={() => onSelectFeed(feedKey)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                        selectedFeed === feedKey
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      {feedKey}
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => onDeleteFeed(feedKey)}
                      className="text-rose-600 focus:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Feed
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </>
          )}
        </div>
        
        {/* Action buttons - far right */}
        {!isLoadingFeeds && (
          <div className="flex items-center gap-1 ml-auto">
            {/* Add Feed button */}
            <Popover open={isAddingFeed} onOpenChange={setIsAddingFeed}>
              <PopoverTrigger asChild>
                <button
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all whitespace-nowrap border-b-2 border-transparent"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Feed
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-feed-key">New Feed Key</Label>
                    <Input
                      id="new-feed-key"
                      value={newFeedKey}
                      onChange={(e) => setNewFeedKey(e.target.value)}
                      placeholder="e.g. newfeed"
                      className="mt-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddFeedSubmit();
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsAddingFeed(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddFeedSubmit}>
                      Add
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Copy Feed button */}
            <Popover open={isCopyingFeed} onOpenChange={setIsCopyingFeed}>
              <PopoverTrigger asChild>
                <button
                  disabled={!selectedFeed}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border-b-2 border-transparent",
                    selectedFeed
                      ? "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                      : "text-slate-400 cursor-not-allowed"
                  )}
                  title={!selectedFeed ? "Select a feed to copy" : "Copy all rules to a new feed"}
                >
                  <Copy className="w-4 h-4 inline mr-1" />
                  Copy Feed
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="copy-to-feed-key">Copy "{selectedFeed}" to:</Label>
                    <Input
                      id="copy-to-feed-key"
                      value={copyToFeedKey}
                      onChange={(e) => setCopyToFeedKey(e.target.value)}
                      placeholder="e.g. newfeed"
                      className="mt-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCopyFeedSubmit();
                        }
                      }}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      This will copy all rules from the current feed to the new feed.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsCopyingFeed(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCopyFeedSubmit}>
                      Copy
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}


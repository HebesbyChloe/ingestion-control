'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { markupRulesApi, type FeedWithMarkup, type MarkupRulesConfig, DEFAULT_PRICE_FIELDS } from '@/lib/api/markupRules';
import MarkupRulesModal from '@/components/markupRules/MarkupRulesModal';

/**
 * Markup Rules Page Component
 * 
 * Manages markup_rules column in sys_feeds table (VUTR DB).
 * Shows all feeds with their markup rules in one table.
 */
export default function MarkupRulesPage() {
  const [selectedFeed, setSelectedFeed] = useState<FeedWithMarkup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all feeds with markup rules
  const { data: feeds, isLoading, error } = useQuery({
    queryKey: ['feeds-with-markup'],
    queryFn: () => markupRulesApi.getAllFeedsWithMarkup(),
  });

  const handleEdit = (feed: FeedWithMarkup) => {
    setSelectedFeed(feed);
    setIsModalOpen(true);
  };

  const handleAdd = (feed: FeedWithMarkup) => {
    setSelectedFeed(feed);
    setIsModalOpen(true);
  };

  const handleDelete = async (feed: FeedWithMarkup) => {
    if (confirm(`Remove all markup rules for "${feed.label}"?`)) {
      try {
        await markupRulesApi.updateMarkupRules(feed.id, {
          rules: [],
          priceFields: DEFAULT_PRICE_FIELDS,
        });
        queryClient.invalidateQueries({ queryKey: ['feeds-with-markup'] });
        queryClient.invalidateQueries({ queryKey: ['feeds'] });
      } catch (error) {
        console.error('Error deleting markup rules:', error);
        alert('Failed to delete markup rules');
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedFeed(null);
  };

  const handleModalSave = () => {
    queryClient.invalidateQueries({ queryKey: ['feeds-with-markup'] });
    queryClient.invalidateQueries({ queryKey: ['feeds'] });
    handleModalClose();
  };

  const getMarkupSummary = (feed: FeedWithMarkup): string => {
    const normalized = markupRulesApi.normalizeMarkupRules(feed.markup_rules);
    if (!normalized || normalized.rules.length === 0) {
      return 'No rules';
    }
    return `${normalized.rules.length} rule${normalized.rules.length !== 1 ? 's' : ''}`;
  };

  const getRulesSummary = (feed: FeedWithMarkup): string[] => {
    const normalized = markupRulesApi.normalizeMarkupRules(feed.markup_rules);
    if (!normalized || normalized.rules.length === 0) {
      return [];
    }
    return normalized.rules.map(rule => {
      const min = rule.minPrice !== null ? `$${rule.minPrice}` : 'any';
      const max = rule.maxPrice !== null ? `$${rule.maxPrice}` : '∞';
      return `${min} - ${max}: ${rule.percent}%`;
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Markup Rules</h2>
          <p className="text-slate-500">Manage pricing markup percentages for each feed</p>
        </div>
      </div>

      {/* Main Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Feed Markup Configuration
          </CardTitle>
          <CardDescription>
            Define markup percentages based on price ranges for each feed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              Loading feeds...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Error loading feeds: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : !feeds || feeds.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No feeds found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Feed</TableHead>
                    <TableHead>Feed Key</TableHead>
                    <TableHead>Markup Rules</TableHead>
                    <TableHead>Rules Summary</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeds.map((feed, index) => {
                    const hasRules = markupRulesApi.normalizeMarkupRules(feed.markup_rules)?.rules.length > 0;
                    const rulesSummary = getRulesSummary(feed);
                    
                    return (
                      <TableRow key={feed.id}>
                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{feed.label}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-slate-600">{feed.feed_key}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={hasRules ? 'default' : 'outline'}>
                            {getMarkupSummary(feed)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rulesSummary.length > 0 ? (
                            <div className="text-xs text-slate-600 space-y-1">
                              {rulesSummary.slice(0, 2).map((summary, i) => (
                                <div key={i} className="font-mono">{summary}</div>
                              ))}
                              {rulesSummary.length > 2 && (
                                <div className="text-slate-400">+{rulesSummary.length - 2} more</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={feed.enabled ? 'default' : 'secondary'} className="text-xs">
                            {feed.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {hasRules ? (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleEdit(feed)}
                                  title="Edit markup rules"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(feed)}
                                  title="Remove markup rules"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs"
                                onClick={() => handleAdd(feed)}
                              >
                                <Plus className="h-3 w-3" />
                                Add Rules
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-700 space-y-2">
            <p className="font-medium">💡 How Markup Rules Work:</p>
            <ul className="list-disc list-inside space-y-1 text-xs ml-2">
              <li>Define markup percentages based on price ranges (e.g., $0-$1000: 300%)</li>
              <li>First matching rule is applied (rules are evaluated in order)</li>
              <li>Markup is calculated as: price × (1 + percent/100)</li>
              <li>Applied to all configured price fields (price, TotalPrice, price_per_carat, etc.)</li>
              <li>Example: 300% markup means price × 4.0 (original + 300%)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Markup Rules Modal */}
      {selectedFeed && (
        <MarkupRulesModal
          feed={selectedFeed}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}


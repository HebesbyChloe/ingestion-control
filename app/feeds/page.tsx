'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  RefreshCw,
  Loader2,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Database,
  Calendar
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedsApi, Feed, CreateFeedInput } from '@/lib/api/feeds';
import { FeedDetailsPanel } from '@/components/feeds/FeedDetailsPanel';

export default function FeedsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const queryClient = useQueryClient();

  // Fetch feeds
  const { data: feeds = [], isLoading, error, refetch } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => feedsApi.getAll(),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateFeedInput> }) => 
      feedsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
    onError: (error) => {
      alert(`Failed to update feed: ${error}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => feedsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
    onError: (error) => {
      alert(`Failed to delete feed: ${error}`);
    },
  });

  const handleUpdate = (id: number, data: Partial<CreateFeedInput>) => {
    updateMutation.mutate({ id, data });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Feed Management</h2>
          <p className="text-slate-500">Manage ingestion feeds and data sources</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => refetch()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add Feed
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-white border-slate-200">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Loading feeds...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-white border-red-200">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Failed to load feeds</p>
            <p className="text-sm text-slate-500">{String(error)}</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feeds Table */}
      {!isLoading && !error && (
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              All Feeds
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({feeds.length} {feeds.length === 1 ? 'feed' : 'feeds'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feeds.length === 0 ? (
              <div className="py-12 text-center">
                <Database className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No feeds found</p>
                <p className="text-sm text-slate-500 mt-1">
                  Create your first feed to get started
                </p>
                <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feed
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feed Key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Collection</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>External Feed URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeds.map((feed) => (
                    <TableRow 
                      key={feed.id} 
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedFeed(feed)}
                    >
                      <TableCell className="font-mono text-sm">
                        {feed.feed_key}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {feed.label}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={feed.enabled 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                          }
                        >
                          {feed.enabled ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" />Enabled</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" />Disabled</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">
                          {feed.typesense_collection}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          {feed.request_method}
                          {feed.response_is_zip && (
                            <Badge variant="outline" className="text-xs ml-1">ZIP</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-slate-600">
                          {feed.external_feed_url}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Feed Modal */}
      {showCreateForm && (
        <FeedFormModal
          feed={null}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
          }}
        />
      )}

      {/* Feed Details Panel */}
      {selectedFeed && (
        <FeedDetailsPanel
          feed={selectedFeed}
          onClose={() => setSelectedFeed(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function FeedFormModal({
  feed,
  onClose,
  onSuccess,
}: {
  feed: Feed | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateFeedInput>({
    tenant_id: feed?.tenant_id || 1,
    feed_key: feed?.feed_key || '',
    label: feed?.label || '',
    typesense_collection: feed?.typesense_collection || '',
    external_feed_url: feed?.external_feed_url || '',
    request_method: feed?.request_method || 'POST',
    response_is_zip: feed?.response_is_zip ?? true,
    primary_key: feed?.primary_key || 'id',
    shard_strategy: feed?.shard_strategy || 'size',
    enabled: feed?.enabled ?? true,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFeedInput) => feedsApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (error) => {
      alert(`Failed to create feed: ${error}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateFeedInput>) => feedsApi.update(feed!.id, data),
    onSuccess: () => onSuccess(),
    onError: (error) => {
      alert(`Failed to update feed: ${error}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feed) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50">
        <Card className="bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="border-b border-slate-200">
            <CardTitle>{feed ? 'Edit Feed' : 'Add New Feed'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Feed Key *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!feed}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                    value={formData.feed_key}
                    onChange={(e) => setFormData({ ...formData, feed_key: e.target.value })}
                    placeholder="labgrown"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Label *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Lab Grown Diamonds"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  External Feed URL *
                </label>
                <input
                  type="url"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.external_feed_url}
                  onChange={(e) => setFormData({ ...formData, external_feed_url: e.target.value })}
                  placeholder="https://api.example.com/feed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Typesense Collection *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.typesense_collection}
                    onChange={(e) => setFormData({ ...formData, typesense_collection: e.target.value })}
                    placeholder="lab_grown_diamond"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Request Method *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.request_method}
                    onChange={(e) => setFormData({ ...formData, request_method: e.target.value })}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Primary Key *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.primary_key}
                    onChange={(e) => setFormData({ ...formData, primary_key: e.target.value })}
                    placeholder="id"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Shard Strategy *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.shard_strategy}
                    onChange={(e) => setFormData({ ...formData, shard_strategy: e.target.value })}
                  >
                    <option value="size">Size</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="response_is_zip"
                    checked={formData.response_is_zip}
                    onChange={(e) => setFormData({ ...formData, response_is_zip: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="response_is_zip" className="text-sm font-medium text-slate-700">
                    Response is ZIP
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-slate-700">
                    Enable this feed
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    feed ? 'Update Feed' : 'Create Feed'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

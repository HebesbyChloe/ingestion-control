'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Save, Trash2, CheckCircle2, XCircle, Eye, EyeOff, Edit } from 'lucide-react';
import { useState } from 'react';
import { Feed, CreateFeedInput } from '@/lib/api/feeds';

interface FeedDetailsPanelProps {
  feed: Feed;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<CreateFeedInput>) => void;
  onDelete: (id: number) => void;
}

export function FeedDetailsPanel({ feed, onClose, onUpdate, onDelete }: FeedDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateFeedInput>>({
    feed_key: feed.feed_key,
    label: feed.label,
    typesense_collection: feed.typesense_collection,
    external_feed_url: feed.external_feed_url,
    api_key: feed.api_key || '',
    api_secret: feed.api_secret || '',
    request_method: feed.request_method,
    response_is_zip: feed.response_is_zip,
    primary_key: feed.primary_key,
    shard_naming_prefix: feed.shard_naming_prefix || '',
    shard_strategy: feed.shard_strategy,
    shard_directory: feed.shard_directory || '',
    manifest_directory: feed.manifest_directory || '',
    enabled: feed.enabled,
  });

  const handleSave = () => {
    onUpdate(feed.id, formData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`⚠️ DELETE FEED?\n\nAre you absolutely sure you want to delete "${feed.label}"?\n\nThis action cannot be undone!`)) {
      if (confirm(`⚠️ FINAL CONFIRMATION\n\nType the feed key "${feed.feed_key}" to confirm deletion.\n\nAre you really sure?`)) {
        onDelete(feed.id);
        onClose();
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0 mr-2">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">Feed Details</h2>
            <p className="text-xs sm:text-sm text-slate-500 truncate">{feed.feed_key}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="hidden sm:inline-flex">
                Edit
              </Button>
            ) : (
              <>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="text-xs sm:text-sm">
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm">
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </>
            )}
            <Button onClick={onClose} variant="ghost" size="icon" className="w-8 h-8 sm:w-10 sm:h-10">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Status & Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                {isEditing ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                ) : (
                  <Badge variant="outline" className={feed.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}>
                    {feed.enabled ? <><CheckCircle2 className="w-3 h-3 mr-1" />Enabled</> : <><XCircle className="w-3 h-3 mr-1" />Disabled</>}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500">Feed ID</div>
                  <div className="font-mono text-slate-900">{feed.id}</div>
                </div>
                <div>
                  <div className="text-slate-500">Tenant ID</div>
                  <div className="font-mono text-slate-900">{feed.tenant_id}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Feed Key</label>
                <input
                  type="text"
                  value={formData.feed_key}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, feed_key: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Typesense Collection</label>
                <input
                  type="text"
                  value={formData.typesense_collection}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, typesense_collection: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Feed Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Feed Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">External Feed URL</label>
                <input
                  type="url"
                  value={formData.external_feed_url}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, external_feed_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Request Method</label>
                  <select
                    value={formData.request_method}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, request_method: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="flex items-center pt-7">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.response_is_zip}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData, response_is_zip: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded disabled:opacity-50"
                    />
                    <span className="text-sm text-slate-700">Response is ZIP</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={formData.api_key}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="Enter API key"
                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">API Secret</label>
                <div className="relative">
                  <input
                    type={showApiSecret ? "text" : "password"}
                    value={formData.api_secret}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    placeholder="Enter API secret"
                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shard Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Shard Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Primary Key</label>
                <input
                  type="text"
                  value={formData.primary_key}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, primary_key: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Shard Strategy</label>
                  <select
                    value={formData.shard_strategy}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, shard_strategy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="size">Size</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Shard Prefix</label>
                  <input
                    type="text"
                    value={formData.shard_naming_prefix}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, shard_naming_prefix: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Shard Directory</label>
                <input
                  type="text"
                  value={formData.shard_directory}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, shard_directory: e.target.value })}
                  placeholder="/data/shards"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Manifest Directory</label>
                <input
                  type="text"
                  value={formData.manifest_directory}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, manifest_directory: e.target.value })}
                  placeholder="/data/manifests"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-500">Created At</div>
                <div className="font-mono text-slate-900">{new Date(feed.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-500">Updated At</div>
                <div className="font-mono text-slate-900">{new Date(feed.updated_at).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-slate-900">Delete This Feed</div>
                  <div className="text-sm text-slate-500 mt-1">Once deleted, this action cannot be undone.</div>
                </div>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Edit Button for Mobile */}
        {!isEditing && (
          <div className="sm:hidden fixed bottom-6 right-6 z-10">
            <Button 
              onClick={() => setIsEditing(true)} 
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg rounded-full w-14 h-14"
            >
              <Edit className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}


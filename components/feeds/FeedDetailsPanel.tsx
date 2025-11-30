'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { X, Save, Trash2, CheckCircle2, XCircle, Eye, EyeOff, Edit, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Feed, CreateFeedInput, FieldSchema, feedsApi } from '@/lib/api/feeds';
import FieldSchemaTab from './FieldSchemaTab';

interface FeedDetailsPanelProps {
  feed: Feed;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<CreateFeedInput>) => void;
  onDelete: (id: number) => void;
}

export function FeedDetailsPanel({ feed, onClose, onUpdate, onDelete }: FeedDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [requestHeadersJson, setRequestHeadersJson] = useState(
    feed.request_headers ? JSON.stringify(feed.request_headers, null, 2) : ''
  );
  const [requestBodyJson, setRequestBodyJson] = useState(
    feed.request_body ? JSON.stringify(feed.request_body, null, 2) : ''
  );
  const [jsonErrors, setJsonErrors] = useState({ headers: '', body: '' });
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);
  const [showFieldSchemaView, setShowFieldSchemaView] = useState(false);
  
  const [formData, setFormData] = useState<Partial<CreateFeedInput>>({
    feed_key: feed.feed_key,
    label: feed.label,
    typesense_collection: feed.typesense_collection,
    external_feed_url: feed.external_feed_url,
    api_key: feed.api_key || '',
    api_secret: feed.api_secret || '',
    request_method: feed.request_method,
    request_headers: feed.request_headers,
    request_body: feed.request_body,
    response_is_zip: feed.response_is_zip,
    primary_key: feed.primary_key,
    shard_naming_prefix: feed.shard_naming_prefix || '',
    shard_strategy: feed.shard_strategy,
    shard_directory: feed.shard_directory || '',
    manifest_directory: feed.manifest_directory || '',
    field_schema: feed.field_schema,
    field_mapping: feed.field_mapping,
    enabled: feed.enabled,
  });

  const handleFieldSchemaUpdate = (fieldSchema: FieldSchema) => {
    setFormData({ ...formData, field_schema: fieldSchema });
  };

  const handleSave = () => {
    // Validate and parse JSON fields
    let hasErrors = false;
    const errors = { headers: '', body: '' };
    
    if (requestHeadersJson.trim()) {
      try {
        formData.request_headers = JSON.parse(requestHeadersJson);
      } catch (e) {
        errors.headers = 'Invalid JSON format';
        hasErrors = true;
      }
    } else {
      formData.request_headers = undefined;
    }
    
    if (requestBodyJson.trim()) {
      try {
        formData.request_body = JSON.parse(requestBodyJson);
      } catch (e) {
        errors.body = 'Invalid JSON format';
        hasErrors = true;
      }
    } else {
      formData.request_body = undefined;
    }
    
    if (hasErrors) {
      setJsonErrors(errors);
      return;
    }
    
    onUpdate(feed.id, formData);
    setIsEditing(false);
  };
  
  const handleHeadersChange = (value: string) => {
    setRequestHeadersJson(value);
    if (jsonErrors.headers) {
      // Clear error when user starts typing
      setJsonErrors({ ...jsonErrors, headers: '' });
    }
  };
  
  const handleBodyChange = (value: string) => {
    setRequestBodyJson(value);
    if (jsonErrors.body) {
      // Clear error when user starts typing
      setJsonErrors({ ...jsonErrors, body: '' });
    }
  };

  const handleDelete = () => {
    if (confirm(`⚠️ DELETE FEED?\n\nAre you absolutely sure you want to delete "${feed.label}"?\n\nThis action cannot be undone!`)) {
      if (confirm(`⚠️ FINAL CONFIRMATION\n\nType the feed key "${feed.feed_key}" to confirm deletion.\n\nAre you really sure?`)) {
        onDelete(feed.id);
        onClose();
      }
    }
  };

  const handleFetchHeaderSchema = async (save: boolean = false) => {
    setIsFetchingSchema(true);
    try {
      const schema = await feedsApi.fetchHeaderSchema(feed.feed_key, feed.tenant_id, save);
      if (save) {
        // Update form data with the fetched schema
        setFormData({ ...formData, field_schema: schema });
        // Also update the feed immediately
        onUpdate(feed.id, { field_schema: schema });
      } else {
        // Just show the schema in the view
        setFormData({ ...formData, field_schema: schema });
      }
      setShowFieldSchemaView(true);
    } catch (error) {
      console.error('Error fetching header schema:', error);
      alert(`Failed to fetch header schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFetchingSchema(false);
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b border-slate-200 px-4 sm:px-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="field-schema">Field Schema</TabsTrigger>
            </TabsList>
          </div>

          {/* Details Tab */}
          <TabsContent value="details" className="p-4 sm:p-6 space-y-4 sm:space-y-6 m-0">
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

          {/* Request Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Request Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Request Headers (JSON)
                </label>
                <textarea
                  value={requestHeadersJson}
                  disabled={!isEditing}
                  onChange={(e) => handleHeadersChange(e.target.value)}
                  placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500 ${
                    jsonErrors.headers ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {jsonErrors.headers && (
                  <p className="text-xs text-red-600 mt-1">{jsonErrors.headers}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Enter custom HTTP headers as JSON. Leave empty if not needed.
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Request Body (JSON)
                </label>
                <textarea
                  value={requestBodyJson}
                  disabled={!isEditing}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  placeholder='{\n  "filters": {},\n  "limit": 1000\n}'
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500 ${
                    jsonErrors.body ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {jsonErrors.body && (
                  <p className="text-xs text-red-600 mt-1">{jsonErrors.body}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Enter request body as JSON (for POST/PUT requests). Leave empty for GET requests.
                </p>
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

          {/* Header Schema Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Field Schema</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleFetchHeaderSchema(false)}
                    disabled={isFetchingSchema}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isFetchingSchema ? 'Fetching...' : 'Fetch Schema'}
                  </Button>
                  <Button
                    onClick={() => handleFetchHeaderSchema(true)}
                    disabled={isFetchingSchema}
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isFetchingSchema ? 'Saving...' : 'Fetch & Save'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {formData.field_schema && (
              <CardContent>
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowFieldSchemaView(!showFieldSchemaView)}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between"
                  >
                    <span className="text-sm font-medium">View Field Schema</span>
                    {showFieldSchemaView ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  {showFieldSchemaView && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <pre className="text-xs font-mono overflow-auto max-h-96">
                        {JSON.stringify(formData.field_schema, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
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
          </TabsContent>

          {/* Field Schema Tab */}
          <TabsContent value="field-schema" className="p-4 sm:p-6 m-0">
            <FieldSchemaTab
              fieldSchema={formData.field_schema}
              isEditing={isEditing}
              onUpdate={handleFieldSchemaUpdate}
            />

            {/* Timestamps */}
            <Card className="mt-6">
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
            <Card className="border-red-200 mt-6">
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
          </TabsContent>
        </Tabs>

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


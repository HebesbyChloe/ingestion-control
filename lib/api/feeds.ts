export interface FieldSchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean';
  sample: string;
  aliases: string[];
  required: boolean;
  description: string;
  isPrimaryKey?: boolean;
  isPriceField?: boolean;
}

export interface FieldSchema {
  fields: FieldSchemaField[];
  source: string;
  lastUpdated: string;
}

export interface Feed {
  id: number;
  tenant_id: number;
  feed_key: string;
  label: string;
  typesense_collection: string;
  external_feed_url: string;
  api_key?: string;
  api_secret?: string;
  request_method: string;
  request_headers?: Record<string, any>;
  request_body?: Record<string, any>;
  response_is_zip: boolean;
  zip_entry_pattern?: string;
  primary_key: string;
  shard_naming_prefix?: string;
  shard_strategy: string;
  shard_directory?: string;
  manifest_directory?: string;
  rules?: Record<string, any>;
  markup_rules?: any;
  field_schema?: FieldSchema;
  field_mapping?: any[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedInput {
  tenant_id: number;
  feed_key: string;
  label: string;
  typesense_collection: string;
  external_feed_url: string;
  api_key?: string;
  api_secret?: string;
  request_method?: string;
  request_headers?: Record<string, any>;
  request_body?: Record<string, any>;
  response_is_zip?: boolean;
  zip_entry_pattern?: string;
  primary_key?: string;
  shard_naming_prefix?: string;
  shard_strategy?: string;
  shard_directory?: string;
  manifest_directory?: string;
  rules?: Record<string, any>;
  markup_rules?: any;
  field_schema?: FieldSchema;
  field_mapping?: any[];
  enabled?: boolean;
}

export const feedsApi = {
  // Get all feeds (using Next.js proxy to /rest/sys_feeds)
  getAll: async (): Promise<Feed[]> => {
    const params = new URLSearchParams({
      order: 'created_at.desc',
    });
    const response = await fetch(`/api/feeds?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch feeds');
    }
    return response.json();
  },

  // Get feed by ID
  getById: async (id: number): Promise<Feed> => {
    const params = new URLSearchParams({ id: `eq.${id}` });
    const response = await fetch(`/api/feeds?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch feed');
    }
    const data = await response.json();
    return data[0];
  },

  // Create feed
  create: async (data: CreateFeedInput): Promise<Feed> => {
    const response = await fetch('/api/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to create feed');
    }
    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  },

  // Update feed
  update: async (id: number, data: Partial<CreateFeedInput>): Promise<Feed> => {
    const response = await fetch('/api/feeds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to update feed');
    }
    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  },

  // Delete feed
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/feeds?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to delete feed');
    }
  },

  // Fetch header schema from worker service
  fetchHeaderSchema: async (feedKey: string, tenantId: number, save: boolean = false): Promise<FieldSchema> => {
    const params = new URLSearchParams({
      feedKey,
      tenant_id: tenantId.toString(),
    });
    if (save) {
      params.append('save', 'true');
    }
    
    const response = await fetch(`/api/feeds/headers?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to fetch header schema');
    }
    return response.json();
  },
};


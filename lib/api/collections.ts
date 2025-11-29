export interface Collection {
  name: string;
  num_documents: number;
  created_at: number; // Unix timestamp
  fields: Array<{
    name: string;
    type: string;
    optional?: boolean;
    facet?: boolean;
    index?: boolean;
  }>;
  default_sorting_field?: string;
  last_updated_at?: number | null; // Unix timestamp from most recent document
}

export interface CollectionWithLastUpdate extends Collection {
  last_updated_at: number | null;
}

export interface TypesenseMetrics {
  system_cpu1_active_percentage?: string;
  system_cpu_active_percentage?: string;
  system_disk_total_bytes?: string;
  system_disk_used_bytes?: string;
  system_memory_total_bytes?: string;
  system_memory_total_swap_bytes?: string;
  system_memory_used_bytes?: string;
  system_memory_used_swap_bytes?: string;
  system_network_received_bytes?: string;
  system_network_sent_bytes?: string;
  typesense_memory_active_bytes?: string;
  typesense_memory_allocated_bytes?: string;
  typesense_memory_fragmentation_ratio?: string;
  typesense_memory_mapped_bytes?: string;
  typesense_memory_metadata_bytes?: string;
  typesense_memory_resident_bytes?: string;
  typesense_memory_retained_bytes?: string;
  [key: string]: string | undefined;
}

export interface TypesenseStats {
  delete_latency_ms?: number;
  delete_requests_per_second?: number;
  import_latency_ms?: number;
  import_requests_per_second?: number;
  latency_ms?: Record<string, number>;
  overloaded_requests_per_second?: number;
  pending_write_batches?: number;
  requests_per_second?: Record<string, number>;
  search_latency_ms?: number;
  search_requests_per_second?: number;
  total_requests_per_second?: number;
  write_latency_ms?: number;
  write_requests_per_second?: number;
}

export interface TypesenseHealth {
  ok: boolean;
}

export const collectionsApi = {
  // Get all collections
  getAll: async (): Promise<Collection[]> => {
    const response = await fetch('/api/collections');
    if (!response.ok) {
      throw new Error('Failed to fetch collections');
    }
    return response.json();
  },

  // Get last update time for a collection
  getLastUpdate: async (collectionName: string): Promise<number | null> => {
    const response = await fetch(`/api/collections/${collectionName}/last-update`);
    if (!response.ok) {
      // If collection has no documents, return null
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch last update');
    }
    const data = await response.json();
    return data.last_updated_at || null;
  },

  // Get all collections with last update times
  getAllWithLastUpdate: async (): Promise<CollectionWithLastUpdate[]> => {
    const collections = await collectionsApi.getAll();
    
    // Fetch last update for each collection in parallel
    const collectionsWithUpdates = await Promise.all(
      collections.map(async (collection) => {
        try {
          const lastUpdate = await collectionsApi.getLastUpdate(collection.name);
          return {
            ...collection,
            last_updated_at: lastUpdate,
          };
        } catch (error) {
          console.error(`Error fetching last update for ${collection.name}:`, error);
          return {
            ...collection,
            last_updated_at: null,
          };
        }
      })
    );

    return collectionsWithUpdates;
  },

  // Get Typesense metrics
  getMetrics: async (): Promise<TypesenseMetrics> => {
    const response = await fetch('/api/typesense/metrics');
    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }
    return response.json();
  },

  // Get Typesense stats
  getStats: async (): Promise<TypesenseStats> => {
    const response = await fetch('/api/typesense/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  },

  // Get Typesense health
  getHealth: async (): Promise<TypesenseHealth> => {
    const response = await fetch('/api/typesense/health');
    if (!response.ok) {
      throw new Error('Failed to fetch health');
    }
    return response.json();
  },
};


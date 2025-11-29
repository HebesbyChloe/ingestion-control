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
};


export interface Module {
  name: string;
  label?: string;
}

export interface TableColumn {
  table: string;
  field: string;
  type?: string;
}

export interface ModuleColumns {
  module: string;
  tables: {
    [tableName: string]: {
      columns: TableColumn[];
    };
  };
}

export const schemaApi = {
  // Get list of available modules
  getModules: async (): Promise<Module[]> => {
    const response = await fetch('/api/schema/columns');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to fetch modules');
    }
    const data = await response.json();
    // If response is an array of modules, return it
    // Otherwise, extract modules from the response structure
    if (Array.isArray(data)) {
      return data;
    }
    // Handle different response formats
    if (data.modules && Array.isArray(data.modules)) {
      return data.modules;
    }
    // If it's an object with module names as keys
    if (typeof data === 'object' && !Array.isArray(data)) {
      return Object.keys(data).map(name => ({ name, label: name }));
    }
    return [];
  },

  // Get columns for a specific module
  getModuleColumns: async (module: string): Promise<ModuleColumns> => {
    const params = new URLSearchParams({
      modules: module,
    });
    const response = await fetch(`/api/schema/columns?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to fetch module columns');
    }
    return response.json();
  },
};


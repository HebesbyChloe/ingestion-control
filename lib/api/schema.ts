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
    try {
      console.log('Fetching modules from /api/schema/columns');
      const response = await fetch('/api/schema/columns');
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error('Failed to fetch modules:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || errorData.details || `Failed to fetch modules: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received modules data:', data);
      
      // If response is an array of modules, return it
      if (Array.isArray(data)) {
        return data.map((item: any) => 
          typeof item === 'string' ? { name: item, label: item } : item
        );
      }
      
      // Handle different response formats
      if (data.modules && Array.isArray(data.modules)) {
        return data.modules.map((item: any) => 
          typeof item === 'string' ? { name: item, label: item } : item
        );
      }
      
      // If it's an object with module names as keys
      if (typeof data === 'object' && !Array.isArray(data)) {
        return Object.keys(data).map(name => ({ name, label: name }));
      }
      
      console.warn('Unexpected response format for modules:', data);
      return [];
    } catch (error) {
      console.error('Error in getModules:', error);
      throw error;
    }
  },

  // Get columns for a specific module
  getModuleColumns: async (module: string): Promise<ModuleColumns> => {
    try {
      console.log(`Fetching columns for module: ${module}`);
      const params = new URLSearchParams({
        modules: module,
      });
      const response = await fetch(`/api/schema/columns?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error('Failed to fetch module columns:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          module
        });
        throw new Error(errorData.error || errorData.details || `Failed to fetch module columns: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received columns data for module ${module}:`, data);
      return data;
    } catch (error) {
      console.error('Error in getModuleColumns:', error);
      throw error;
    }
  },
};


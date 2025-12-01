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
      console.log(`📡 Fetching columns for module: ${module}`);
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
        console.error('❌ Failed to fetch module columns:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          module
        });
        throw new Error(errorData.error || errorData.details || `Failed to fetch module columns: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📥 Received raw columns data for module ${module}:`, JSON.stringify(data, null, 2));
      console.log(`📊 Data type:`, typeof data, Array.isArray(data) ? 'array' : 'object');
      console.log(`📊 Data keys:`, data ? Object.keys(data) : 'null/undefined');
      
      // Handle different response formats
      // PostgREST RPC might return an array or object
      if (Array.isArray(data)) {
        // If it's an array, it might be an array of objects or a single-element array
        if (data.length === 0) {
          console.warn('⚠️ Empty array returned from API');
          return { module, tables: {} };
        }
        
        // If first element has the expected structure
        const firstItem = data[0];
        if (firstItem && typeof firstItem === 'object') {
          // Check if it's already in the expected format
          if (firstItem.module && firstItem.tables) {
            console.log('✅ Found expected format in array[0]');
            return firstItem;
          }
          
          // Try to transform array format to expected format
          console.log('🔄 Transforming array format to expected format');
          const result: ModuleColumns = {
            module: firstItem.module || module,
            tables: {}
          };
          
          // Group by table name
          data.forEach((item: any) => {
            if (item.table) {
              if (!result.tables[item.table]) {
                result.tables[item.table] = { columns: [] };
              }
              result.tables[item.table].columns.push({
                table: item.table,
                field: item.field || item.column || item.name,
                type: item.type
              });
            }
          });
          
          console.log('✅ Transformed data:', JSON.stringify(result, null, 2));
          return result;
        }
      }
      
      // If it's already in the expected format
      if (data && typeof data === 'object' && data.module && data.tables) {
        console.log('✅ Data already in expected format');
        return data;
      }
      
      // If it's an object but not in expected format, try to transform
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        console.log('🔄 Attempting to transform object format');
        // Check if it has tables as direct keys
        const result: ModuleColumns = {
          module: data.module || module,
          tables: {}
        };
        
        // If data has table names as keys
        for (const key in data) {
          if (key !== 'module' && typeof data[key] === 'object') {
            result.tables[key] = {
              columns: Array.isArray(data[key]) 
                ? data[key].map((col: any) => ({
                    table: key,
                    field: col.field || col.column || col.name,
                    type: col.type
                  }))
                : []
            };
          }
        }
        
        console.log('✅ Transformed object data:', JSON.stringify(result, null, 2));
        return result;
      }
      
      console.error('❌ Unexpected response format:', data);
      return { module, tables: {} };
    } catch (error) {
      console.error('❌ Error in getModuleColumns:', error);
      throw error;
    }
  },
};


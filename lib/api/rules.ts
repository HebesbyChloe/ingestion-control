import { apiClient } from './client';

export type RuleType = 'pricing' | 'origin' | 'scoring' | 'filter';

export interface IngestionRule {
  id: number;
  tenant_id: number;
  feed_key: string;
  rule_type: RuleType;
  name?: string;
  priority: number;
  enabled: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  notes?: string;
}

export interface PricingRuleConfig {
  min_price: number | null;
  max_price: number | null;
  percent: number;
  fixed_amount?: number;
}

export interface OriginRuleConfig {
  origin_country?: string | null;
  color_range?: string[];
  preferred_labs?: string[];
  shard_key?: string;
  include: boolean;
}

export interface ScoringRuleConfig {
  field_name: string;
  field_value?: string;
  score_multiplier: number;
  conditions?: Record<string, any>;
}

export interface CreateRuleInput {
  tenant_id: number;
  feed_key: string;
  rule_type: RuleType;
  name?: string;
  priority?: number;
  enabled?: boolean;
  config: PricingRuleConfig | OriginRuleConfig | ScoringRuleConfig;
  notes?: string;
}

export const rulesApi = {
  // Get unique feed keys
  getFeedKeys: async (tenantId: number): Promise<string[]> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ingestion_rules?tenant_id=eq.${tenantId}&select=feed_key`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch feed keys: ${response.statusText}`);
    }

    const data = await response.json();
    const uniqueKeys = [...new Set(data.map((item: any) => item.feed_key))];
    return uniqueKeys.sort();
  },

  // Count rules for a feed
  countRulesByFeed: async (feedKey: string, tenantId: number): Promise<number> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ingestion_rules?tenant_id=eq.${tenantId}&feed_key=eq.${feedKey}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'count=exact',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to count rules: ${response.statusText}`);
    }

    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    const data = await response.json();
    return data.length;
  },

  // Get unique rule types
  getRuleTypes: async (tenantId: number): Promise<string[]> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ingestion_rules?tenant_id=eq.${tenantId}&select=rule_type`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch rule types: ${response.statusText}`);
    }

    const data = await response.json();
    const uniqueTypes = [...new Set(data.map((item: any) => item.rule_type))];
    return uniqueTypes.sort();
  },

  // Count rules by rule type
  countRulesByType: async (ruleType: string, tenantId: number): Promise<number> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ingestion_rules?tenant_id=eq.${tenantId}&rule_type=eq.${ruleType}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'count=exact',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to count rules: ${response.statusText}`);
    }

    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    const data = await response.json();
    return data.length;
  },

  // Get all rules for a feed
  getByFeed: async (
    feedKey: string,
    tenantId: number,
    ruleType?: RuleType
  ): Promise<IngestionRule[]> => {
    const params: any = {
      tenant_id: `eq.${tenantId}`,
      feed_key: `eq.${feedKey}`,
    };
    if (ruleType) {
      params.rule_type = `eq.${ruleType}`;
    }
    params.order = 'priority.asc';

    // For all rule types, use Supabase PostgREST directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ingestion_rules?${queryParams.toString()}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch rules: ${response.statusText}`);
    }

    return response.json();
  },

  // Create rule
  create: async (data: CreateRuleInput): Promise<IngestionRule> => {
    console.log('🟡 [API CREATE] Function called');
    console.log('🟡 [API CREATE] Create data:', JSON.stringify(data, null, 2));
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🟡 [API CREATE] Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('🟡 [API CREATE] Supabase Key:', supabaseKey ? '✅ Set (length: ' + supabaseKey.length + ')' : '❌ Missing');

    if (!supabaseUrl || !supabaseKey) {
      const error = 'Supabase configuration missing';
      console.error('🔴 [API CREATE] ERROR:', error);
      throw new Error(error);
    }

    const url = `${supabaseUrl}/rest/v1/ingestion_rules`;
    console.log('🟡 [API CREATE] Request URL:', url);
    console.log('🟡 [API CREATE] Request method: POST');
    console.log('🟡 [API CREATE] Request body:', JSON.stringify(data, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(data),
    });

    console.log('🟡 [API CREATE] Response status:', response.status, response.statusText);
    console.log('🟡 [API CREATE] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 [API CREATE] FAILED:', response.status, response.statusText);
      console.error('🔴 [API CREATE] Error body:', errorText);
      throw new Error(`Failed to create rule: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('🟢 [API CREATE] SUCCESS:', result);
    return Array.isArray(result) ? result[0] : result;
  },

  // Update rule
  update: async (id: number, data: Partial<CreateRuleInput>): Promise<IngestionRule> => {
    console.log('🔵 [API UPDATE] Function called');
    console.log('🔵 [API UPDATE] Rule ID:', id);
    console.log('🔵 [API UPDATE] Update data:', JSON.stringify(data, null, 2));
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔵 [API UPDATE] Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('🔵 [API UPDATE] Supabase Key:', supabaseKey ? '✅ Set (length: ' + supabaseKey.length + ')' : '❌ Missing');

    if (!supabaseUrl || !supabaseKey) {
      const error = 'Supabase configuration missing';
      console.error('🔴 [API UPDATE] ERROR:', error);
      throw new Error(error);
    }

    const url = `${supabaseUrl}/rest/v1/ingestion_rules?id=eq.${id}`;
    console.log('🔵 [API UPDATE] Request URL:', url);
    console.log('🔵 [API UPDATE] Request method: PATCH');
    console.log('🔵 [API UPDATE] Request body:', JSON.stringify(data, null, 2));

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(data),
    });

    console.log('🔵 [API UPDATE] Response status:', response.status, response.statusText);
    console.log('🔵 [API UPDATE] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 [API UPDATE] FAILED:', response.status, response.statusText);
      console.error('🔴 [API UPDATE] Error body:', errorText);
      throw new Error(`Failed to update rule: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('🟢 [API UPDATE] SUCCESS:', result);
    return Array.isArray(result) ? result[0] : result;
  },

  // Delete rule
  delete: async (id: number, feedKey: string, tenantId: number): Promise<void> => {
    console.log('🔴 [API DELETE] Function called');
    console.log('🔴 [API DELETE] Rule ID:', id);
    console.log('🔴 [API DELETE] Feed Key:', feedKey);
    console.log('🔴 [API DELETE] Tenant ID:', tenantId);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔴 [API DELETE] Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('🔴 [API DELETE] Supabase Key:', supabaseKey ? '✅ Set (length: ' + supabaseKey.length + ')' : '❌ Missing');

    if (!supabaseUrl || !supabaseKey) {
      const error = 'Supabase configuration missing';
      console.error('🔴 [API DELETE] ERROR:', error);
      throw new Error(error);
    }

    const url = `${supabaseUrl}/rest/v1/ingestion_rules?id=eq.${id}`;
    console.log('🔴 [API DELETE] Request URL:', url);
    console.log('🔴 [API DELETE] Request method: DELETE');

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    console.log('🔴 [API DELETE] Response status:', response.status, response.statusText);
    console.log('🔴 [API DELETE] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 [API DELETE] FAILED:', response.status, response.statusText);
      console.error('🔴 [API DELETE] Error body:', errorText);
      throw new Error(`Failed to delete rule: ${response.statusText} - ${errorText}`);
    }

    console.log('🟢 [API DELETE] SUCCESS');
  },
};


export interface ServiceEndpoint {
  value: string;
  label: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export const SERVICE_ENDPOINTS: Record<string, ServiceEndpoint[]> = {
  worker: [
    { value: '/ingestion/feeds', label: 'Get Feeds', method: 'GET' },
    { value: '/ingestion/run', label: 'Run Ingestion', method: 'POST' },
    { value: '/ingestion/status', label: 'Get Status', method: 'GET' },
    { value: '/jobs', label: 'Jobs (List/Create)', method: 'GET' },
    { value: '/jobs/:id', label: 'Job by ID', method: 'GET' },
    { value: '/jobs/:id/execute', label: 'Execute Job', method: 'POST' },
    { value: '/jobs/recover', label: 'Recover Jobs', method: 'POST' },
    { value: '/jobs/stats/queue', label: 'Queue Stats', method: 'GET' },
    { value: '/jobs/failed', label: 'Failed Jobs', method: 'GET' },
    { value: '/admin/markup/:feedKey', label: 'Markup Config', method: 'GET' },
    { value: '/health', label: 'Health Check', method: 'GET' },
  ],
  mcp: [
    { value: '/mcp/chat', label: 'Chat', method: 'POST' },
    { value: '/mcp/query', label: 'Query', method: 'POST' },
    { value: '/mcp/analyze', label: 'Analyze', method: 'POST' },
    { value: '/mcp/action', label: 'Action', method: 'POST' },
    { value: '/mcp/embeddings', label: 'Embeddings', method: 'POST' },
    { value: '/health', label: 'Health Check', method: 'GET' },
  ],
  'backend-api': [
    { value: '/orders', label: 'Create Order', method: 'POST' },
    { value: '/orders/calculate', label: 'Calculate Order', method: 'POST' },
    { value: '/orders/:id/details', label: 'Order Details', method: 'GET' },
    { value: '/workflows/refund', label: 'Refund Workflow', method: 'POST' },
    { value: '/workflows/fulfill', label: 'Fulfill Workflow', method: 'POST' },
    { value: '/workflows/payroll/process', label: 'Process Payroll', method: 'POST' },
    { value: '/analytics/aggregate', label: 'Aggregate Analytics', method: 'GET' },
    { value: '/analytics/sales/by-product', label: 'Sales by Product', method: 'GET' },
    { value: '/health', label: 'Health Check', method: 'GET' },
  ],
};


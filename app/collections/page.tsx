'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Loader2,
  Database,
  Calendar,
  Clock,
  Activity,
  HardDrive,
  Cpu,
  Network,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { collectionsApi, type CollectionWithLastUpdate, type TypesenseMetrics, type TypesenseStats, type TypesenseHealth } from '@/lib/api/collections';

export default function CollectionsPage() {
  // Fetch collections with last update times
  const { data: collections = [], isLoading, error, refetch } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionsApi.getAllWithLastUpdate(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Fetch Typesense metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['typesense-metrics'],
    queryFn: () => collectionsApi.getMetrics(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fetch Typesense stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['typesense-stats'],
    queryFn: () => collectionsApi.getStats(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fetch Typesense health
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['typesense-health'],
    queryFn: () => collectionsApi.getHealth(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    refetch();
  };

  // Format Unix timestamp to readable date
  const formatDate = (timestamp: number | null | undefined): string => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp * 1000); // Convert Unix timestamp to milliseconds
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number | null | undefined): string => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp * 1000);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      return formatDate(timestamp);
    } catch (e) {
      return 'Unknown';
    }
  };

  // Format bytes to human readable
  const formatBytes = (bytes: string | number | undefined): string => {
    if (!bytes) return '0 B';
    const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (isNaN(numBytes)) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (numBytes === 0) return '0 B';
    const i = Math.floor(Math.log(numBytes) / Math.log(1024));
    return `${(numBytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Format percentage
  const formatPercentage = (value: string | number | undefined): string => {
    if (!value) return '0%';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0%';
    return `${num.toFixed(2)}%`;
  };

  // Calculate disk usage percentage
  const getDiskUsagePercent = (): number => {
    if (!metrics?.system_disk_total_bytes || !metrics?.system_disk_used_bytes) return 0;
    const total = parseFloat(metrics.system_disk_total_bytes);
    const used = parseFloat(metrics.system_disk_used_bytes);
    if (isNaN(total) || isNaN(used) || total === 0) return 0;
    return (used / total) * 100;
  };

  // Calculate memory usage percentage
  const getMemoryUsagePercent = (): number => {
    if (!metrics?.system_memory_total_bytes || !metrics?.system_memory_used_bytes) return 0;
    const total = parseFloat(metrics.system_memory_total_bytes);
    const used = parseFloat(metrics.system_memory_used_bytes);
    if (isNaN(total) || isNaN(used) || total === 0) return 0;
    return (used / total) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Typesense Collections</h2>
          <p className="text-slate-500">Monitor collection status and document counts</p>
        </div>
        
        <Button 
          onClick={handleRefresh}
          variant="outline"
          className="gap-2"
          disabled={isLoading || metricsLoading || statsLoading || healthLoading}
        >
          {(isLoading || metricsLoading || statsLoading || healthLoading) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Collections Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Collections ({collections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-slate-500">Loading collections...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">Error loading collections</p>
              <p className="text-sm text-slate-500">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <Button 
                onClick={() => refetch()} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No collections found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Collection Name</TableHead>
                    <TableHead className="font-semibold">Document Count</TableHead>
                    <TableHead className="font-semibold">Created Date</TableHead>
                    <TableHead className="font-semibold">Last Update</TableHead>
                    <TableHead className="font-semibold">Fields</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((collection) => (
                    <TableRow key={collection.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium font-mono text-sm">{collection.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {collection.num_documents.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(collection.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {collection.last_updated_at ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-green-600" />
                            <div className="flex flex-col">
                              <span className="text-slate-900">{formatDate(collection.last_updated_at)}</span>
                              <span className="text-xs text-slate-500">
                                {formatRelativeTime(collection.last_updated_at)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-slate-400">
                            Never
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {collection.fields?.length || 0} fields
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Status */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {health?.ok ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            Typesense Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking health...</span>
            </div>
          ) : health?.ok ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Healthy
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Unhealthy
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* System Metrics */}
      {metrics && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              System Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CPU */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Cpu className="w-4 h-4" />
                  <span>CPU Usage</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatPercentage(metrics.system_cpu_active_percentage)}
                </p>
              </div>

              {/* Memory */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <HardDrive className="w-4 h-4" />
                  <span>Memory Usage</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPercentage(getMemoryUsagePercent())}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(metrics.system_memory_used_bytes)} / {formatBytes(metrics.system_memory_total_bytes)}
                  </p>
                </div>
              </div>

              {/* Disk */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <HardDrive className="w-4 h-4" />
                  <span>Disk Usage</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPercentage(getDiskUsagePercent())}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(metrics.system_disk_used_bytes)} / {formatBytes(metrics.system_disk_total_bytes)}
                  </p>
                </div>
              </div>

              {/* Network */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Network className="w-4 h-4" />
                  <span>Network</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    ↓ {formatBytes(metrics.system_network_received_bytes)}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    ↑ {formatBytes(metrics.system_network_sent_bytes)}
                  </p>
                </div>
              </div>
            </div>

            {/* Typesense Memory Details */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Typesense Memory</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Active</p>
                  <p className="font-semibold">{formatBytes(metrics.typesense_memory_active_bytes)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Allocated</p>
                  <p className="font-semibold">{formatBytes(metrics.typesense_memory_allocated_bytes)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Resident</p>
                  <p className="font-semibold">{formatBytes(metrics.typesense_memory_resident_bytes)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Fragmentation</p>
                  <p className="font-semibold">{formatPercentage(metrics.typesense_memory_fragmentation_ratio)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Statistics */}
      {stats && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Request Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Total Requests/sec</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.total_requests_per_second?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Search Requests/sec</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.search_requests_per_second?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Write Requests/sec</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.write_requests_per_second?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Search Latency</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.search_latency_ms || 0}ms
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Write Latency</p>
                <p className="font-semibold">{stats.write_latency_ms || 0}ms</p>
              </div>
              <div>
                <p className="text-slate-500">Import Requests/sec</p>
                <p className="font-semibold">{stats.import_requests_per_second?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-slate-500">Pending Write Batches</p>
                <p className="font-semibold">{stats.pending_write_batches || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Collections</p>
                  <p className="text-2xl font-bold text-indigo-600">{collections.length}</p>
                </div>
                <Database className="w-8 h-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Documents</p>
                  <p className="text-2xl font-bold text-green-600">
                    {collections.reduce((sum, c) => sum + c.num_documents, 0).toLocaleString()}
                  </p>
                </div>
                <Database className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Collections with Data</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {collections.filter(c => c.num_documents > 0).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


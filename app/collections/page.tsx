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
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { collectionsApi, type CollectionWithLastUpdate } from '@/lib/api/collections';

export default function CollectionsPage() {
  // Fetch collections with last update times
  const { data: collections = [], isLoading, error, refetch } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionsApi.getAllWithLastUpdate(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Typesense Collections</h2>
          <p className="text-slate-500">Monitor collection status and document counts</p>
        </div>
        
        <Button 
          onClick={() => refetch()}
          variant="outline"
          className="gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
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


import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, RefreshCw, User, Calendar } from 'lucide-react';

interface SyncLog {
  id: number;
  entityType: string;
  syncStartedAt: string;
  syncCompletedAt?: string;
  syncStatus: 'in_progress' | 'completed' | 'failed';
  recordsFetched: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage?: string;
  triggeredBy?: string;
  createdAt: string;
}

interface SyncStatusProps {
  entityType: 'product' | 'premise' | 'facility' | 'facility_prod';
  apiEndpoint: string;
}

export default function SyncStatus({ entityType, apiEndpoint }: SyncStatusProps) {
  const [latestSync, setLatestSync] = useState<SyncLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestSync();
    // Refresh every 30 seconds
    const interval = setInterval(loadLatestSync, 30000);
    return () => clearInterval(interval);
  }, [entityType]);

  const loadLatestSync = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/sync-history?limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setLatestSync(data[0]);
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes} min ${seconds} sec`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getTriggerIcon = (trigger?: string) => {
    if (trigger === 'cron' || trigger === 'scheduled-weekly') {
      return <Clock className="w-4 h-4" />;
    }
    return <User className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading sync status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestSync) {
    return (
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            No sync history available
          </div>
        </CardContent>
      </Card>
    );
  }

  const entityLabels = {
    product: 'Product',
    premise: 'Premise',
    facility: 'UAT Facility',
    facility_prod: 'Production Facility',
  };

  return (
    <Card className="mt-6 border-t-4 border-t-blue-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(latestSync.syncStatus)}
              <h3 className="text-lg font-semibold">
                {entityLabels[entityType]} Sync #{latestSync.id}
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(
                latestSync.syncStatus
              )}`}
            >
              {latestSync.syncStatus === 'in_progress' ? 'In Progress' : 
               latestSync.syncStatus === 'completed' ? '✅ Completed' : 
               '❌ Failed'}
            </span>
          </div>
          <button
            onClick={loadLatestSync}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Started */}
          <div className="border-l-2 border-blue-400 pl-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              Started
            </div>
            <div className="text-sm font-medium">
              {new Date(latestSync.syncStartedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="border-l-2 border-purple-400 pl-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              Duration
            </div>
            <div className="text-sm font-medium">
              {formatDuration(latestSync.syncStartedAt, latestSync.syncCompletedAt)}
            </div>
          </div>

          {/* Fetched */}
          <div className="border-l-2 border-gray-400 pl-3">
            <div className="text-xs text-muted-foreground mb-1">Fetched</div>
            <div className="text-sm font-bold text-gray-700">
              {latestSync.recordsFetched.toLocaleString()}
            </div>
          </div>

          {/* Inserted */}
          <div className="border-l-2 border-green-400 pl-3">
            <div className="text-xs text-muted-foreground mb-1">Inserted</div>
            <div className="text-sm font-bold text-green-700">
              {latestSync.recordsInserted.toLocaleString()} new
            </div>
          </div>

          {/* Updated */}
          <div className="border-l-2 border-blue-400 pl-3">
            <div className="text-xs text-muted-foreground mb-1">Updated</div>
            <div className="text-sm font-bold text-blue-700">
              {latestSync.recordsUpdated.toLocaleString()} existing
            </div>
          </div>

          {/* Failed */}
          <div className="border-l-2 border-red-400 pl-3">
            <div className="text-xs text-muted-foreground mb-1">Failed</div>
            <div className="text-sm font-bold text-red-700">
              {latestSync.recordsFailed} errors
            </div>
          </div>

          {/* Triggered By */}
          <div className="border-l-2 border-indigo-400 pl-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              {getTriggerIcon(latestSync.triggeredBy)}
              Triggered by
            </div>
            <div className="text-sm font-medium capitalize">
              {latestSync.triggeredBy || 'manual'}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {latestSync.syncStatus === 'failed' && latestSync.errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-red-900 mb-1">Error Details</div>
                <div className="text-sm text-red-700">{latestSync.errorMessage}</div>
              </div>
            </div>
          </div>
        )}

        {/* Next Sync Info */}
        {latestSync.syncStatus === 'completed' && latestSync.triggeredBy === 'cron' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Next automatic sync in approximately{' '}
              <span className="font-medium text-foreground">3 hours</span> (every 3 hours at 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 EAT)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


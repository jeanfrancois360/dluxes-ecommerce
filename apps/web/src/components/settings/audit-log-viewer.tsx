'use client';

import { useState, useEffect } from 'react';
import { useSettingsAudit } from '@/hooks/use-settings';
import { Card, CardContent } from '@nextpik/ui';
import { Badge } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Clock, User, ArrowRightLeft, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogViewerProps {
  settingKey?: string;
  limit?: number;
}

export function AuditLogViewer({ settingKey, limit = 20 }: AuditLogViewerProps) {
  const { auditLogs, loading, refetch } = useSettingsAudit(settingKey);
  const [displayedLogs, setDisplayedLogs] = useState(limit);

  useEffect(() => {
    setDisplayedLogs(limit);
  }, [limit]);

  const loadMore = () => {
    setDisplayedLogs((prev) => prev + 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No audit logs found</p>
        {settingKey && <p className="text-sm mt-1">for setting: {settingKey}</p>}
      </div>
    );
  }

  const visibleLogs = auditLogs.slice(0, displayedLogs);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {visibleLogs.length} of {auditLogs.length} entries
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {visibleLogs.map((log: any) => (
          <Card key={log.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={log.action === 'CREATE' ? 'default' : log.action === 'DELETE' ? 'destructive' : 'secondary'}>
                      {log.action}
                    </Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                      {log.settingKey}
                    </code>
                  </div>

                  {/* Value Change */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs mb-1">Previous Value</p>
                      <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs block truncate">
                        {log.oldValue !== null && log.oldValue !== undefined
                          ? JSON.stringify(log.oldValue)
                          : 'null'}
                      </code>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs mb-1">New Value</p>
                      <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs block truncate">
                        {log.newValue !== null && log.newValue !== undefined
                          ? JSON.stringify(log.newValue)
                          : 'null'}
                      </code>
                    </div>
                  </div>

                  {/* Reason */}
                  {log.reason && (
                    <p className="text-sm text-muted-foreground italic">
                      Reason: {log.reason}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{log.changedBy || 'System'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {log.createdAt
                          ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })
                          : 'Unknown'}
                      </span>
                    </div>
                    {log.ipAddress && (
                      <span className="font-mono">{log.ipAddress}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displayedLogs < auditLogs.length && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore}>
            Load More ({auditLogs.length - displayedLogs} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

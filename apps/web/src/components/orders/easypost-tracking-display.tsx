'use client';

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@nextpik/ui';
import {
  Package,
  Truck,
  MapPin,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  useEasyPostTracking,
  formatTrackingStatus,
  formatTrackingDate,
} from '@/hooks/use-easypost-tracking';

interface EasyPostTrackingDisplayProps {
  shipmentId: string;
  showRefreshButton?: boolean;
  compact?: boolean;
}

export function EasyPostTrackingDisplay({
  shipmentId,
  showRefreshButton = true,
  compact = false,
}: EasyPostTrackingDisplayProps) {
  const { tracking, isLoading, error, refresh } = useEasyPostTracking(shipmentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-48 mt-2 bg-neutral-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-12 w-full bg-neutral-200 rounded animate-pulse" />
          <div className="h-12 w-full bg-neutral-200 rounded animate-pulse" />
          <div className="h-12 w-full bg-neutral-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load tracking information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tracking) {
    return null;
  }

  const statusInfo = formatTrackingStatus(tracking.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Package Tracking</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm">{tracking.trackingNumber}</span>
                <Badge variant="outline" className="text-xs">
                  {tracking.carrier}
                </Badge>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tracking.publicUrl && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={tracking.publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Track
                </a>
              </Button>
            )}
            {showRefreshButton && (
              <Button variant="ghost" size="sm" onClick={() => refresh()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Current Status</span>
            <Badge
              variant={
                statusInfo.color === 'green'
                  ? 'default'
                  : statusInfo.color === 'red'
                    ? 'destructive'
                    : 'secondary'
              }
              className="gap-1"
            >
              {statusInfo.color === 'green' && <CheckCircle2 className="h-3 w-3" />}
              {statusInfo.color === 'yellow' && <Clock className="h-3 w-3" />}
              {statusInfo.label}
            </Badge>
          </div>

          {tracking.statusDetail && (
            <p className="text-sm text-muted-foreground">{tracking.statusDetail}</p>
          )}

          {tracking.estDeliveryDate && (
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Estimated Delivery:</span>
              <span className="font-medium">
                {new Date(tracking.estDeliveryDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {tracking.signedBy && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Signed by:</span>
              <span className="font-medium">{tracking.signedBy}</span>
            </div>
          )}
        </div>

        {/* Tracking Events Timeline */}
        {!compact && tracking.trackingDetails && tracking.trackingDetails.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Tracking History</h4>
            <div className="space-y-3">
              {tracking.trackingDetails.map((event, index) => (
                <div key={event.id || index} className="flex gap-3">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        index === 0
                          ? 'bg-blue-600 dark:bg-blue-400'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                    {index < tracking.trackingDetails!.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 flex-1 min-h-[20px]" />
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.message}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {event.description}
                          </p>
                        )}
                        {(event.city || event.state || event.country) && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {[event.city, event.state, event.country].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTrackingDate(event.eventDatetime)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact Mode - Show only latest event */}
        {compact && tracking.trackingDetails && tracking.trackingDetails.length > 0 && (
          <div className="text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{tracking.trackingDetails[0].message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTrackingDate(tracking.trackingDetails[0].eventDatetime)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for use in order lists
 */
export function EasyPostTrackingCompact({ shipmentId }: { shipmentId: string }) {
  return <EasyPostTrackingDisplay shipmentId={shipmentId} compact showRefreshButton={false} />;
}

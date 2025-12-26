'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Badge } from '@nextpik/ui';
import {
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  Calendar,
  Building,
  Search,
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

interface TrackingInfo {
  trackingNumber: string;
  currentStatus: string;
  expectedDeliveryDate?: string;
  provider?: {
    name: string;
    logo?: string;
  };
  timeline: Array<{
    status: string;
    timestamp: string;
    completed: boolean;
  }>;
}

export default function TrackDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notFound, setNotFound] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    if (params.trackingNumber) {
      fetchTrackingInfo(params.trackingNumber as string);
    }
  }, [params.trackingNumber]);

  const fetchTrackingInfo = async (trackingNumber: string) => {
    try {
      setLoading(true);
      setNotFound(false);
      const response = await axios.get(`${API_URL}/deliveries/track/${trackingNumber}`);
      setTrackingInfo(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Error', error.response?.data?.message || 'Failed to fetch tracking information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/track/${searchQuery.trim()}`);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; color: string }> = {
      PENDING_PICKUP: { label: 'Pending Pickup', icon: Clock, color: 'text-gray-500' },
      PICKUP_SCHEDULED: { label: 'Pickup Scheduled', icon: Calendar, color: 'text-blue-500' },
      PICKED_UP: { label: 'Picked Up', icon: Package, color: 'text-blue-600' },
      IN_TRANSIT: { label: 'In Transit', icon: Truck, color: 'text-blue-600' },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: MapPin, color: 'text-orange-600' },
      DELIVERED: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600' },
    };

    return statusMap[status] || { label: status, icon: Package, color: 'text-gray-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Track Your Delivery</h1>
          <p className="text-muted-foreground">
            Enter your tracking number to see real-time delivery updates
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter tracking number (e.g., TRK1234567890ABC)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Track</Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 animate-bounce" />
              <p>Fetching tracking information...</p>
            </CardContent>
          </Card>
        )}

        {/* Not Found State */}
        {!loading && notFound && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Tracking Number Not Found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any delivery with tracking number:{' '}
                <span className="font-mono font-medium">{params.trackingNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Please check the tracking number and try again
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tracking Information */}
        {!loading && !notFound && trackingInfo && (
          <div className="space-y-6">
            {/* Current Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {getStatusInfo(trackingInfo.currentStatus).label}
                    </CardTitle>
                    <CardDescription className="font-mono text-base mt-1">
                      {trackingInfo.trackingNumber}
                    </CardDescription>
                  </div>
                  {trackingInfo.provider && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Delivered by</div>
                      <div className="font-semibold">{trackingInfo.provider.name}</div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {trackingInfo.expectedDeliveryDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Expected Delivery:</span>
                    <span className="font-medium">
                      {format(new Date(trackingInfo.expectedDeliveryDate), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Progress</CardTitle>
                <CardDescription>Track your package's journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {trackingInfo.timeline.map((item, index) => {
                    const statusInfo = getStatusInfo(item.status);
                    const Icon = statusInfo.icon;
                    const isCompleted = item.completed;
                    const isLast = index === trackingInfo.timeline.length - 1;

                    return (
                      <div key={index} className="relative">
                        <div className="flex items-start gap-4">
                          {/* Icon and Line */}
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`rounded-full p-2 ${
                                isCompleted
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            {!isLast && (
                              <div
                                className={`w-0.5 h-12 mt-2 ${
                                  isCompleted
                                    ? 'bg-primary'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4
                                className={`font-semibold ${
                                  isCompleted ? '' : 'text-muted-foreground'
                                }`}
                              >
                                {statusInfo.label}
                              </h4>
                              {isCompleted && (
                                <Badge variant="outline" className="ml-2">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            {item.timestamp && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(item.timestamp), 'MMMM dd, yyyy - HH:mm')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    If you have questions about your delivery, please contact customer support:
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="mailto:support@luxury.com"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <Building className="h-4 w-4" />
                      support@luxury.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

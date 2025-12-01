'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { Badge } from '@luxury/ui';
import {
  Package,
  TrendingUp,
  DollarSign,
  Star,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

interface DashboardStats {
  totalDeliveries: number;
  completedToday: number;
  totalEarnings: number;
  activeDeliveries: number;
  averageRating: number;
}

interface RecentDelivery {
  id: string;
  trackingNumber: string;
  currentStatus: string;
  deliveryFee: number;
  partnerCommission: number;
  createdAt: string;
  order: {
    orderNumber: string;
    total: number;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function DeliveryPartnerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalDeliveries: 0,
    completedToday: 0,
    totalEarnings: 0,
    activeDeliveries: 0,
    averageRating: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const [statsResponse, deliveriesResponse] = await Promise.all([
        axios.get(`${API_URL}/delivery-partner/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/delivery-partner/deliveries`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 5 },
        }),
      ]);

      setStats(statsResponse.data.statistics);
      setRecentDeliveries(deliveriesResponse.data.data || []);
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      PENDING_PICKUP: { label: 'Pending', variant: 'secondary', icon: Clock },
      PICKED_UP: { label: 'Picked Up', variant: 'default', icon: Package },
      IN_TRANSIT: { label: 'In Transit', variant: 'default', icon: Truck },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'default', icon: MapPin },
      DELIVERED: { label: 'Delivered', variant: 'default', icon: CheckCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary', icon: Package };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Partner Dashboard</h1>
          <p className="text-muted-foreground">Track your deliveries and earnings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">Deliveries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Commission earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDeliveries}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 space-y-2"
                onClick={() => router.push('/delivery-partner/deliveries?filter=active')}
              >
                <Truck className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">View Active Deliveries</div>
                  <div className="text-xs text-muted-foreground">
                    See deliveries in progress
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 space-y-2"
                onClick={() => router.push('/delivery-partner/deliveries?filter=available')}
              >
                <Package className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Available Deliveries</div>
                  <div className="text-xs text-muted-foreground">
                    Accept new delivery jobs
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 space-y-2"
                onClick={() => router.push('/delivery-partner/earnings')}
              >
                <DollarSign className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">View Earnings</div>
                  <div className="text-xs text-muted-foreground">
                    Check your earnings history
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Deliveries</CardTitle>
                <CardDescription>Your latest delivery assignments</CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push('/delivery-partner/deliveries')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentDeliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No deliveries assigned yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() =>
                      router.push(`/delivery-partner/deliveries/${delivery.id}`)
                    }
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {delivery.trackingNumber}
                        </span>
                        {getStatusBadge(delivery.currentStatus)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Order {delivery.order.orderNumber} - {delivery.order.user.firstName}{' '}
                        {delivery.order.user.lastName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        +${Number(delivery.partnerCommission).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Commission</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips & Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for Success</CardTitle>
            <CardDescription>Best practices for delivery partners</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Always update delivery status in real-time for better customer experience</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Take clear photos as proof of delivery to protect yourself</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Maintain professional communication with customers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Report issues immediately through the system</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

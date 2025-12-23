'use client';

/**
 * Admin Deliveries Management Page
 * 
 * Manage all deliveries with buyer confirmation and payout release features
 */

import { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@luxury/ui';
import { Input } from '@luxury/ui';
import { Badge } from '@luxury/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@luxury/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@luxury/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@luxury/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@luxury/ui';
import {
  Search,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { format } from 'date-fns';
import axios from 'axios';

interface Delivery {
  id: string;
  trackingNumber: string;
  currentStatus: string;
  buyerConfirmed: boolean;
  buyerConfirmedAt?: string;
  payoutReleased: boolean;
  payoutReleasedAt?: string;
  deliveryFee: number;
  partnerCommission: number;
  createdAt: string;
  deliveredAt?: string;
  proofOfDeliveryUrl?: string;
  order: {
    orderNumber: string;
    total: number;
    status: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  provider: {
    name: string;
    type: string;
  };
  deliveryPartner?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Statistics {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  awaitingConfirmation: number;
  awaitingPayout: number;
  payoutReleased: number;
}

function DeliveriesContent() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmedFilter, setConfirmedFilter] = useState<string>('all');
  const [payoutFilter, setPayoutFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [releasingPayout, setReleasingPayout] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    fetchDeliveries();
    fetchStatistics();
  }, [statusFilter, confirmedFilter, payoutFilter, page]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (confirmedFilter !== 'all') params.buyerConfirmed = confirmedFilter === 'confirmed';
      if (payoutFilter !== 'all') params.payoutReleased = payoutFilter === 'released';

      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/admin/deliveries?${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDeliveries(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/admin/deliveries/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleReleasePayout = async (deliveryId: string) => {
    if (!confirm('Are you sure you want to release the payout for this delivery?')) return;

    try {
      setReleasingPayout(deliveryId);
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/admin/deliveries/${deliveryId}/release-payout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Success', 'Payout released successfully');
        fetchDeliveries();
        fetchStatistics();
      }
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to release payout');
    } finally {
      setReleasingPayout(null);
    }
  };

  const openDetailsDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      PENDING_PICKUP: { label: 'Pending Pickup', variant: 'secondary', icon: Clock },
      PICKUP_SCHEDULED: { label: 'Pickup Scheduled', variant: 'secondary', icon: Clock },
      PICKED_UP: { label: 'Picked Up', variant: 'default', icon: Package },
      IN_TRANSIT: { label: 'In Transit', variant: 'default', icon: Truck },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'default', icon: Truck },
      DELIVERED: { label: 'Delivered', variant: 'default', icon: CheckCircle },
      FAILED_DELIVERY: { label: 'Failed', variant: 'destructive', icon: XCircle },
      RETURNED: { label: 'Returned', variant: 'destructive', icon: XCircle },
      CANCELLED: { label: 'Cancelled', variant: 'outline', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary', icon: Package };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.order.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deliveries Management</h1>
        <p className="text-muted-foreground">View and manage all deliveries in the system</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.inTransit}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.delivered}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">Awaiting Confirm</CardTitle>
              <Clock className="h-4 w-4 text-yellow-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{statistics.awaitingConfirmation}</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Ready for Payout</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{statistics.awaitingPayout}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Payout Released</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{statistics.payoutReleased}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by tracking number, order, or customer email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING_PICKUP">Pending Pickup</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="FAILED_DELIVERY">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={confirmedFilter} onValueChange={setConfirmedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Confirmation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="confirmed">Buyer Confirmed</SelectItem>
            <SelectItem value="pending">Pending Confirmation</SelectItem>
          </SelectContent>
        </Select>
        <Select value={payoutFilter} onValueChange={setPayoutFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payout Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="released">Payout Released</SelectItem>
            <SelectItem value="pending">Pending Payout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking #</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Buyer Confirmed</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading deliveries...
                </TableCell>
              </TableRow>
            ) : filteredDeliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No deliveries found
                </TableCell>
              </TableRow>
            ) : (
              filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>
                    <div className="font-medium font-mono text-sm">{delivery.trackingNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(delivery.createdAt), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{delivery.order.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      ${formatCurrencyAmount(delivery.order.total, 2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{delivery.order.user.firstName} {delivery.order.user.lastName}</div>
                    <div className="text-xs text-muted-foreground">{delivery.order.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{delivery.provider.name}</div>
                    {delivery.deliveryPartner && (
                      <div className="text-xs text-muted-foreground">
                        Driver: {delivery.deliveryPartner.firstName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(delivery.currentStatus)}</TableCell>
                  <TableCell>
                    {delivery.buyerConfirmed ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Confirmed</span>
                      </div>
                    ) : delivery.currentStatus === 'DELIVERED' ? (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Pending</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {delivery.payoutReleased ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Released</span>
                      </div>
                    ) : delivery.buyerConfirmed ? (
                      <div className="flex items-center gap-1 text-blue-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Ready</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${formatCurrencyAmount(delivery.partnerCommission, 2)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openDetailsDialog(delivery)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {delivery.buyerConfirmed && !delivery.payoutReleased && (
                        <Button
                          size="sm"
                          onClick={() => handleReleasePayout(delivery.id)}
                          disabled={releasingPayout === delivery.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {releasingPayout === delivery.id ? (
                            'Releasing...'
                          ) : (
                            <>
                              <DollarSign className="mr-1 h-3 w-3" />
                              Release Payout
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delivery Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>
              {selectedDelivery?.trackingNumber} - {selectedDelivery?.order.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-6">
              {/* Status Information */}
              <div>
                <h3 className="font-semibold mb-3">Status Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Status</div>
                    <div className="mt-1">{getStatusBadge(selectedDelivery.currentStatus)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="mt-1">{format(new Date(selectedDelivery.createdAt), 'PPp')}</div>
                  </div>
                  {selectedDelivery.deliveredAt && (
                    <div>
                      <div className="text-sm text-muted-foreground">Delivered</div>
                      <div className="mt-1">{format(new Date(selectedDelivery.deliveredAt), 'PPp')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div>{selectedDelivery.order.user.firstName} {selectedDelivery.order.user.lastName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div>{selectedDelivery.order.user.email}</div>
                  </div>
                </div>
              </div>

              {/* Provider Information */}
              <div>
                <h3 className="font-semibold mb-3">Provider Information</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Provider</div>
                    <div className="font-medium">{selectedDelivery.provider.name}</div>
                  </div>
                  {selectedDelivery.deliveryPartner && (
                    <div>
                      <div className="text-sm text-muted-foreground">Driver</div>
                      <div>
                        {selectedDelivery.deliveryPartner.firstName} {selectedDelivery.deliveryPartner.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedDelivery.deliveryPartner.email}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="font-semibold mb-3">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Delivery Fee</div>
                    <div className="font-medium">${formatCurrencyAmount(selectedDelivery.deliveryFee, 2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Partner Commission</div>
                    <div className="font-medium">${formatCurrencyAmount(selectedDelivery.partnerCommission, 2)}</div>
                  </div>
                </div>
              </div>

              {/* Confirmation & Payout */}
              <div>
                <h3 className="font-semibold mb-3">Confirmation & Payout</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Buyer Confirmation</div>
                      {selectedDelivery.buyerConfirmedAt && (
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(selectedDelivery.buyerConfirmedAt), 'PPp')}
                        </div>
                      )}
                    </div>
                    {selectedDelivery.buyerConfirmed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Payout Released</div>
                      {selectedDelivery.payoutReleasedAt && (
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(selectedDelivery.payoutReleasedAt), 'PPp')}
                        </div>
                      )}
                    </div>
                    {selectedDelivery.payoutReleased ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Proof of Delivery */}
              {selectedDelivery.proofOfDeliveryUrl && (
                <div>
                  <h3 className="font-semibold mb-3">Proof of Delivery</h3>
                  <div className="border rounded-lg p-4">
                    <a
                      href={selectedDelivery.proofOfDeliveryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      View Proof of Delivery
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedDelivery && selectedDelivery.buyerConfirmed && !selectedDelivery.payoutReleased && (
              <Button
                onClick={() => {
                  handleReleasePayout(selectedDelivery.id);
                  setIsDetailsDialogOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Release Payout
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DeliveriesPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <DeliveriesContent />
      </AdminLayout>
    </AdminRoute>
  );
}

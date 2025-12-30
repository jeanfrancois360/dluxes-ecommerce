'use client';

/**
 * Admin Deliveries Management Page
 *
 * Manage all deliveries with buyer confirmation and payout release features
 */

import { useState, useEffect, useMemo } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Badge } from '@nextpik/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nextpik/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nextpik/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nextpik/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@nextpik/ui';
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
  X,
  Download,
  Printer,
  AlertTriangle,
  Timer,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { format, differenceInDays, subDays, isToday } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
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
  expectedDeliveryDate?: string;
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
  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [confirmedFilter, setConfirmedFilter] = useState<string>('all');
  const [payoutFilter, setPayoutFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [releasingPayout, setReleasingPayout] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  // Get unique providers from deliveries
  const providers = useMemo(() => {
    const providerSet = new Set<string>();
    allDeliveries.forEach((d) => {
      if (d.provider?.name) providerSet.add(d.provider.name);
    });
    return Array.from(providerSet);
  }, [allDeliveries]);

  // Calculate stats from all deliveries
  const stats = useMemo(() => {
    const now = new Date();
    const deliveredToday = allDeliveries.filter(
      (d) => d.deliveredAt && isToday(new Date(d.deliveredAt))
    ).length;

    const delayed = allDeliveries.filter((d) => {
      if (d.currentStatus === 'DELIVERED' || d.currentStatus === 'CANCELLED') return false;
      if (d.expectedDeliveryDate) {
        return new Date(d.expectedDeliveryDate) < now;
      }
      // If no expected date, consider delayed if created more than 7 days ago and not delivered
      return differenceInDays(now, new Date(d.createdAt)) > 7;
    }).length;

    const deliveredWithTime = allDeliveries.filter(
      (d) => d.currentStatus === 'DELIVERED' && d.deliveredAt
    );
    const avgDeliveryDays =
      deliveredWithTime.length > 0
        ? Math.round(
            deliveredWithTime.reduce((sum, d) => {
              return sum + differenceInDays(new Date(d.deliveredAt!), new Date(d.createdAt));
            }, 0) / deliveredWithTime.length
          )
        : 0;

    return {
      total: allDeliveries.length,
      inTransit: allDeliveries.filter(
        (d) => d.currentStatus === 'IN_TRANSIT' || d.currentStatus === 'OUT_FOR_DELIVERY'
      ).length,
      deliveredToday,
      delayed,
      avgDeliveryDays,
    };
  }, [allDeliveries]);

  useEffect(() => {
    fetchDeliveries();
    fetchStatistics();
    fetchAllDeliveries();
  }, [statusFilter, confirmedFilter, payoutFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, providerFilter, confirmedFilter, payoutFilter, sortBy]);

  const fetchAllDeliveries = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/admin/deliveries?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setAllDeliveries(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching all deliveries:', error);
    }
  };

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
        fetchAllDeliveries();
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

  // Filter and sort deliveries
  const filteredDeliveries = useMemo(() => {
    let filtered = [...deliveries];

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (delivery) =>
          delivery.trackingNumber.toLowerCase().includes(search) ||
          delivery.order.orderNumber.toLowerCase().includes(search) ||
          delivery.order.user.email.toLowerCase().includes(search) ||
          `${delivery.order.user.firstName} ${delivery.order.user.lastName}`
            .toLowerCase()
            .includes(search)
      );
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter((d) => d.provider.name === providerFilter);
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        filtered.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'amount_high':
        filtered.sort((a, b) => b.order.total - a.order.total);
        break;
      case 'amount_low':
        filtered.sort((a, b) => a.order.total - b.order.total);
        break;
      case 'newest':
      default:
        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return filtered;
  }, [deliveries, debouncedSearch, providerFilter, sortBy]);

  // Bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDeliveries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDeliveries.map((d) => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Active filters
  const hasActiveFilters =
    statusFilter !== 'all' ||
    providerFilter !== 'all' ||
    confirmedFilter !== 'all' ||
    payoutFilter !== 'all' ||
    debouncedSearch !== '';

  const clearAllFilters = () => {
    setStatusFilter('all');
    setProviderFilter('all');
    setConfirmedFilter('all');
    setPayoutFilter('all');
    setSearchQuery('');
  };

  // Bulk actions
  const handleBulkExport = () => {
    toast.success('Export started', `Exporting ${selectedIds.size} deliveries`);
    setSelectedIds(new Set());
  };

  const handleBulkPrintLabels = () => {
    toast.success('Print started', `Printing labels for ${selectedIds.size} deliveries`);
    setSelectedIds(new Set());
  };

  const handleBulkReleasePayout = async () => {
    if (!confirm(`Release payout for ${selectedIds.size} deliveries?`)) return;

    const eligibleDeliveries = filteredDeliveries.filter(
      (d) => selectedIds.has(d.id) && d.buyerConfirmed && !d.payoutReleased
    );

    if (eligibleDeliveries.length === 0) {
      toast.error('No eligible deliveries', 'Selected deliveries are not ready for payout release');
      return;
    }

    let success = 0;
    let failed = 0;

    for (const delivery of eligibleDeliveries) {
      try {
        const token = localStorage.getItem('auth_token');
        await axios.post(
          `${API_URL}/admin/deliveries/${delivery.id}/release-payout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        success++;
      } catch {
        failed++;
      }
    }

    toast.success('Bulk payout', `Released ${success} payouts (${failed} failed)`);
    setSelectedIds(new Set());
    fetchDeliveries();
    fetchStatistics();
    fetchAllDeliveries();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deliveries Management</h1>
        <p className="text-muted-foreground">View and manage all deliveries in the system</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">Currently shipping</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.deliveredToday}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card className={stats.delayed > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-sm font-medium ${stats.delayed > 0 ? 'text-amber-700' : ''}`}
            >
              Delayed
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${stats.delayed > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.delayed > 0 ? 'text-amber-700' : ''}`}>
              {stats.delayed}
            </div>
            <p className={`text-xs ${stats.delayed > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDeliveryDays} days</div>
            <p className="text-xs text-muted-foreground">Average duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border p-4 bg-white space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by tracking, order, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING_PICKUP">Pending Pickup</SelectItem>
              <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
              <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="FAILED_DELIVERY">Failed</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
            </SelectContent>
          </Select>

          {/* Provider Filter */}
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Confirmation Filter */}
          <Select value={confirmedFilter} onValueChange={setConfirmedFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Confirmation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="confirmed">Buyer Confirmed</SelectItem>
              <SelectItem value="pending">Pending Confirm</SelectItem>
            </SelectContent>
          </Select>

          {/* Payout Filter */}
          <Select value={payoutFilter} onValueChange={setPayoutFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Payout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payouts</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="amount_high">Amount (High)</SelectItem>
              <SelectItem value="amount_low">Amount (Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {debouncedSearch && (
              <Badge variant="secondary" className="gap-1">
                Search: {debouncedSearch}
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter.replace(/_/g, ' ')}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {providerFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Provider: {providerFilter}
                <button
                  onClick={() => setProviderFilter('all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {confirmedFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {confirmedFilter === 'confirmed' ? 'Buyer Confirmed' : 'Pending Confirm'}
                <button
                  onClick={() => setConfirmedFilter('all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {payoutFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Payout: {payoutFilter === 'released' ? 'Released' : 'Pending'}
                <button
                  onClick={() => setPayoutFilter('all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={
                    filteredDeliveries.length > 0 &&
                    selectedIds.size === filteredDeliveries.length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-neutral-300"
                />
              </TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Buyer Confirmed</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Loading deliveries...
                </TableCell>
              </TableRow>
            ) : filteredDeliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  No deliveries found
                </TableCell>
              </TableRow>
            ) : (
              filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id} className={selectedIds.has(delivery.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(delivery.id)}
                      onChange={() => toggleSelect(delivery.id)}
                      className="w-4 h-4 rounded border-neutral-300"
                    />
                  </TableCell>
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
                    <div>
                      {delivery.order.user.firstName} {delivery.order.user.lastName}
                    </div>
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
                    {delivery.expectedDeliveryDate ? (
                      <span
                        className={
                          new Date(delivery.expectedDeliveryDate) < new Date() &&
                          delivery.currentStatus !== 'DELIVERED'
                            ? 'text-amber-600 font-medium'
                            : ''
                        }
                      >
                        {format(new Date(delivery.expectedDeliveryDate), 'MMM d')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
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
                              Release
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

      {/* Fixed Bottom Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-4">
            <span className="font-medium">{selectedIds.size} selected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-white hover:text-white hover:bg-slate-800"
            >
              Clear selection
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkPrintLabels}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Labels
            </Button>
            <Button
              size="sm"
              onClick={handleBulkReleasePayout}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Release Payouts
            </Button>
          </div>
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
                      <div className="mt-1">
                        {format(new Date(selectedDelivery.deliveredAt), 'PPp')}
                      </div>
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
                    <div>
                      {selectedDelivery.order.user.firstName}{' '}
                      {selectedDelivery.order.user.lastName}
                    </div>
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
                        {selectedDelivery.deliveryPartner.firstName}{' '}
                        {selectedDelivery.deliveryPartner.lastName}
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
                    <div className="font-medium">
                      ${formatCurrencyAmount(selectedDelivery.deliveryFee, 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Partner Commission</div>
                    <div className="font-medium">
                      ${formatCurrencyAmount(selectedDelivery.partnerCommission, 2)}
                    </div>
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

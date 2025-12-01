'use client';

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
import { Label } from '@luxury/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@luxury/ui';
import { Search, Package, Truck, MapPin, Clock, CheckCircle, XCircle, Edit } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';

interface Delivery {
  id: string;
  trackingNumber: string;
  currentStatus: string;
  orderId: string;
  providerId: string;
  deliveryPartnerId?: string;
  pickupAddress: any;
  deliveryAddress: any;
  deliveryFee: number;
  partnerCommission: number;
  platformFee: number;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  createdAt: string;
  order: {
    orderNumber: string;
    total: number;
    status: string;
    user: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
  };
  provider?: {
    name: string;
  };
  deliveryPartner?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface DeliveryProvider {
  id: string;
  name: string;
}

interface DeliveryPartner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function DeliveriesContent() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [assignData, setAssignData] = useState({
    providerId: '',
    deliveryPartnerId: '',
  });
  const [statusData, setStatusData] = useState({
    status: '',
    notes: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    fetchDeliveries();
    fetchProviders();
  }, [statusFilter, providerFilter]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (providerFilter !== 'all') params.providerId = providerFilter;

      const response = await axios.get(`${API_URL}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const data = response.data.data || response.data;
      setDeliveries(data);
      calculateStats(data);
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/delivery-providers/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviders(response.data.data || response.data);
    } catch (error: any) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const calculateStats = (deliveriesData: Delivery[]) => {
    setStats({
      total: deliveriesData.length,
      pending: deliveriesData.filter((d) => d.currentStatus === 'PENDING_PICKUP').length,
      inTransit: deliveriesData.filter((d) =>
        ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(d.currentStatus)
      ).length,
      delivered: deliveriesData.filter((d) => d.currentStatus === 'DELIVERED').length,
    });
  };

  const handleAssignDelivery = async () => {
    if (!selectedDelivery) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(
        `${API_URL}/deliveries/${selectedDelivery.id}/assign`,
        assignData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Success', 'Delivery assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedDelivery(null);
      setAssignData({ providerId: '', deliveryPartnerId: '' });
      fetchDeliveries();
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to assign delivery');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDelivery) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(
        `${API_URL}/deliveries/${selectedDelivery.id}/status`,
        statusData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Success', 'Delivery status updated successfully');
      setIsStatusDialogOpen(false);
      setSelectedDelivery(null);
      setStatusData({ status: '', notes: '' });
      fetchDeliveries();
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const openAssignDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setAssignData({
      providerId: delivery.providerId || '',
      deliveryPartnerId: delivery.deliveryPartnerId || '',
    });
    setIsAssignDialogOpen(true);
  };

  const openStatusDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setStatusData({
      status: delivery.currentStatus,
      notes: '',
    });
    setIsStatusDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      PENDING_PICKUP: { label: 'Pending Pickup', variant: 'secondary', icon: Clock },
      PICKUP_SCHEDULED: { label: 'Pickup Scheduled', variant: 'secondary', icon: Clock },
      PICKED_UP: { label: 'Picked Up', variant: 'default', icon: Package },
      IN_TRANSIT: { label: 'In Transit', variant: 'default', icon: Truck },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'default', icon: MapPin },
      DELIVERED: { label: 'Delivered', variant: 'default', icon: CheckCircle },
      FAILED_DELIVERY: { label: 'Failed', variant: 'destructive', icon: XCircle },
      CANCELLED: { label: 'Cancelled', variant: 'outline', icon: XCircle },
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

  const filteredDeliveries = deliveries.filter((delivery) =>
    delivery.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delivery.order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Delivery Management</h1>
        <p className="text-muted-foreground">Manage and track all deliveries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Pickup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by tracking number or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING_PICKUP">Pending Pickup</SelectItem>
            <SelectItem value="PICKED_UP">Picked Up</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking Number</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delivery Fee</TableHead>
              <TableHead>Expected Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredDeliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No deliveries found
                </TableCell>
              </TableRow>
            ) : (
              filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-mono text-sm">{delivery.trackingNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{delivery.order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        ${delivery.order.total.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {delivery.order.user.firstName} {delivery.order.user.lastName}
                      </div>
                      {delivery.order.user.phone && (
                        <div className="text-sm text-muted-foreground">
                          {delivery.order.user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {delivery.provider ? (
                      <span>{delivery.provider.name}</span>
                    ) : (
                      <Badge variant="outline">Not Assigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {delivery.deliveryPartner ? (
                      <div>
                        <div className="font-medium">
                          {delivery.deliveryPartner.firstName} {delivery.deliveryPartner.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {delivery.deliveryPartner.email}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(delivery.currentStatus)}</TableCell>
                  <TableCell>${delivery.deliveryFee.toFixed(2)}</TableCell>
                  <TableCell>
                    {delivery.expectedDeliveryDate
                      ? format(new Date(delivery.expectedDeliveryDate), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openAssignDialog(delivery)}>
                        Assign
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openStatusDialog(delivery)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery</DialogTitle>
            <DialogDescription>
              Assign delivery provider and partner for {selectedDelivery?.trackingNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Delivery Provider</Label>
              <Select
                value={assignData.providerId}
                onValueChange={(value) => setAssignData({ ...assignData, providerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner">Delivery Partner (Optional)</Label>
              <Select
                value={assignData.deliveryPartnerId}
                onValueChange={(value) => setAssignData({ ...assignData, deliveryPartnerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select partner (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.firstName} {partner.lastName} ({partner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignDelivery}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedDelivery?.trackingNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusData.status}
                onValueChange={(value) => setStatusData({ ...statusData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING_PICKUP">Pending Pickup</SelectItem>
                  <SelectItem value="PICKUP_SCHEDULED">Pickup Scheduled</SelectItem>
                  <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="FAILED_DELIVERY">Failed Delivery</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={statusData.notes}
                onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })}
                placeholder="Add notes about this status update"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>Update Status</Button>
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

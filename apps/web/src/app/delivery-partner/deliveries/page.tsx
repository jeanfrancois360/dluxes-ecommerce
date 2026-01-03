'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Badge } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Textarea } from '@nextpik/ui';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@nextpik/ui';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  FileText,
  Phone,
  Navigation,
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
interface Delivery {
  id: string;
  trackingNumber: string;
  currentStatus: string;
  pickupAddress: any;
  deliveryAddress: any;
  deliveryFee: number;
  partnerCommission: number;
  expectedDeliveryDate?: string;
  createdAt: string;
  order: {
    orderNumber: string;
    total: number;
    user: {
      firstName: string;
      lastName: string;
      phone?: string;
      email: string;
    };
  };
}

interface AvailableDelivery extends Delivery {
  provider: {
    name: string;
  };
}

export default function DeliveryPartnerDeliveriesPage() {
  const [activeTab, setActiveTab] = useState('assigned');
  const [assignedDeliveries, setAssignedDeliveries] = useState<Delivery[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<AvailableDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [statusData, setStatusData] = useState({
    status: '',
    notes: '',
  });
  const [confirmData, setConfirmData] = useState({
    signature: '',
    photos: [] as string[],
    notes: '',
    gps: { latitude: 0, longitude: 0 },
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    if (activeTab === 'assigned') {
      fetchAssignedDeliveries();
    } else {
      fetchAvailableDeliveries();
    }
  }, [activeTab, statusFilter]);

  const fetchAssignedDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await axios.get(`${API_URL}/delivery-partner/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setAssignedDeliveries(response.data.data || []);
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/delivery-partner/available-deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableDeliveries(response.data.data || []);
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to fetch available deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_URL}/delivery-partner/deliveries/${deliveryId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Success', 'Delivery accepted successfully');
      fetchAvailableDeliveries();
      setActiveTab('assigned');
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to accept delivery');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDelivery) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(
        `${API_URL}/delivery-partner/deliveries/${selectedDelivery.id}/status`,
        statusData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Success', 'Status updated successfully');
      setIsUpdateStatusDialogOpen(false);
      setSelectedDelivery(null);
      setStatusData({ status: '', notes: '' });
      fetchAssignedDeliveries();
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedDelivery) return;

    try {
      const token = localStorage.getItem('auth_token');

      // Get current GPS location if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const dataWithGPS = {
              ...confirmData,
              gps: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            };

            await axios.post(
              `${API_URL}/delivery-partner/deliveries/${selectedDelivery.id}/confirm`,
              dataWithGPS,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            toast.success('Success', 'Delivery confirmed successfully');
            setIsConfirmDialogOpen(false);
            setSelectedDelivery(null);
            setConfirmData({ signature: '', photos: [], notes: '', gps: { latitude: 0, longitude: 0 } });
            fetchAssignedDeliveries();
          },
          async (error) => {
            // Proceed without GPS if denied
            await axios.post(
              `${API_URL}/delivery-partner/deliveries/${selectedDelivery.id}/confirm`,
              confirmData,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            toast.success('Success', 'Delivery confirmed successfully (without GPS)');
            setIsConfirmDialogOpen(false);
            setSelectedDelivery(null);
            setConfirmData({ signature: '', photos: [], notes: '', gps: { latitude: 0, longitude: 0 } });
            fetchAssignedDeliveries();
          }
        );
      } else {
        await axios.post(
          `${API_URL}/delivery-partner/deliveries/${selectedDelivery.id}/confirm`,
          confirmData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success('Success', 'Delivery confirmed successfully');
        setIsConfirmDialogOpen(false);
        setSelectedDelivery(null);
        setConfirmData({ signature: '', photos: [], notes: '', gps: { latitude: 0, longitude: 0 } });
        fetchAssignedDeliveries();
      }
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to confirm delivery');
    }
  };

  const openUpdateStatusDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setStatusData({ status: delivery.currentStatus, notes: '' });
    setIsUpdateStatusDialogOpen(true);
  };

  const openConfirmDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setConfirmData({ signature: '', photos: [], notes: '', gps: { latitude: 0, longitude: 0 } });
    setIsConfirmDialogOpen(true);
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
    <div className="min-h-screen bg-gray-50 ">
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Deliveries</h1>
          <p className="text-muted-foreground">Manage your delivery assignments</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
            <TabsTrigger value="available">Available Deliveries</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            <div className="flex gap-4">
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
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading deliveries...
                </CardContent>
              </Card>
            ) : assignedDeliveries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No assigned deliveries found
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignedDeliveries.map((delivery) => (
                  <Card key={delivery.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="font-mono text-lg">
                              {delivery.trackingNumber}
                            </CardTitle>
                            {getStatusBadge(delivery.currentStatus)}
                          </div>
                          <CardDescription>
                            Order {delivery.order.orderNumber}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            +${formatCurrencyAmount(Number(delivery.partnerCommission), 2)}
                          </div>
                          <div className="text-xs text-muted-foreground">Your commission</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Customer Information
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              {delivery.order.user.firstName} {delivery.order.user.lastName}
                            </div>
                            {delivery.order.user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {delivery.order.user.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Delivery Address
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {delivery.deliveryAddress?.street && (
                              <div>{delivery.deliveryAddress.street}</div>
                            )}
                            {delivery.deliveryAddress?.city && (
                              <div>
                                {delivery.deliveryAddress.city},{' '}
                                {delivery.deliveryAddress.state} {delivery.deliveryAddress.postalCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUpdateStatusDialog(delivery)}
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Update Status
                        </Button>
                        {delivery.currentStatus === 'OUT_FOR_DELIVERY' && (
                          <Button size="sm" onClick={() => openConfirmDialog(delivery)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm Delivery
                          </Button>
                        )}
                        {delivery.deliveryAddress?.latitude && delivery.deliveryAddress?.longitude && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${delivery.deliveryAddress.latitude},${delivery.deliveryAddress.longitude}`,
                                '_blank'
                              );
                            }}
                          >
                            <Navigation className="mr-2 h-4 w-4" />
                            Navigate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading available deliveries...
                </CardContent>
              </Card>
            ) : availableDeliveries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No available deliveries at the moment
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {availableDeliveries.map((delivery) => (
                  <Card key={delivery.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="font-mono text-lg">
                            {delivery.trackingNumber}
                          </CardTitle>
                          <CardDescription>
                            Provider: {delivery.provider.name}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            +${formatCurrencyAmount(Number(delivery.partnerCommission), 2)}
                          </div>
                          <div className="text-xs text-muted-foreground">Commission</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Pickup Address</div>
                          <div className="text-sm text-muted-foreground">
                            {delivery.pickupAddress?.city}, {delivery.pickupAddress?.state}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Delivery Address</div>
                          <div className="text-sm text-muted-foreground">
                            {delivery.deliveryAddress?.city}, {delivery.deliveryAddress?.state}
                          </div>
                        </div>
                      </div>

                      <Button onClick={() => handleAcceptDelivery(delivery.id)} className="w-full">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept Delivery
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Update Status Dialog */}
        <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Delivery Status</DialogTitle>
              <DialogDescription>
                Update status for {selectedDelivery?.trackingNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select
                  value={statusData.status}
                  onValueChange={(value) => setStatusData({ ...statusData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PICKUP_SCHEDULED">Pickup Scheduled</SelectItem>
                    <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={statusData.notes}
                  onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })}
                  placeholder="Add notes about this status update"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>Update Status</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Delivery Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delivery</DialogTitle>
              <DialogDescription>
                Provide proof of delivery for {selectedDelivery?.trackingNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="signature">Signature (Optional)</Label>
                <Input
                  id="signature"
                  value={confirmData.signature}
                  onChange={(e) => setConfirmData({ ...confirmData, signature: e.target.value })}
                  placeholder="Recipient's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                <Textarea
                  id="deliveryNotes"
                  value={confirmData.notes}
                  onChange={(e) => setConfirmData({ ...confirmData, notes: e.target.value })}
                  placeholder="Any notes about the delivery (e.g., left at door, handed to resident)"
                  rows={3}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <Camera className="inline h-4 w-4 mr-1" />
                GPS location will be automatically captured when you confirm
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmDelivery}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Delivery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

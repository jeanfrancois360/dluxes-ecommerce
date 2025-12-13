'use client';

import { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@luxury/ui';
import { toast } from 'sonner';
import { Truck, MapPin, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
interface ShippingZone {
  id: string;
  name: string;
  code: string;
  description: string | null;
  countries: string[];
  states: string[];
  cities: string[];
  postalCodes: string[];
  baseFee: number;
  perKgFee: number | null;
  freeShippingThreshold: number | null;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  rates: ShippingRate[];
}

interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  isActive: boolean;
}

function ShippingZonesContent() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    countries: '',
    baseFee: '',
    perKgFee: '',
    freeShippingThreshold: '',
    minDeliveryDays: '3',
    maxDeliveryDays: '7',
  });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/v1/shipping/zones', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setZones(data);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error('Failed to load shipping zones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        countries: formData.countries.split(',').map(c => c.trim()),
        baseFee: parseFloat(formData.baseFee),
        perKgFee: formData.perKgFee ? parseFloat(formData.perKgFee) : undefined,
        freeShippingThreshold: formData.freeShippingThreshold
          ? parseFloat(formData.freeShippingThreshold)
          : undefined,
        minDeliveryDays: parseInt(formData.minDeliveryDays),
        maxDeliveryDays: parseInt(formData.maxDeliveryDays),
      };

      const url = editingZone
        ? `/api/v1/shipping/zones/${editingZone.code}`
        : '/api/v1/shipping/zones';

      const response = await fetch(url, {
        method: editingZone ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          editingZone
            ? 'Shipping zone updated successfully'
            : 'Shipping zone created successfully'
        );
        setDialogOpen(false);
        resetForm();
        fetchZones();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save shipping zone');
      }
    } catch (error) {
      console.error('Error saving zone:', error);
      toast.error('Failed to save shipping zone');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Are you sure you want to delete this shipping zone?')) return;

    try {
      const response = await fetch(`/api/v1/shipping/zones/${code}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Shipping zone deleted successfully');
        fetchZones();
      } else {
        toast.error('Failed to delete shipping zone');
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Failed to delete shipping zone');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      countries: '',
      baseFee: '',
      perKgFee: '',
      freeShippingThreshold: '',
      minDeliveryDays: '3',
      maxDeliveryDays: '7',
    });
    setEditingZone(null);
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      code: zone.code,
      description: zone.description || '',
      countries: zone.countries.join(', '),
      baseFee: zone.baseFee.toString(),
      perKgFee: zone.perKgFee?.toString() || '',
      freeShippingThreshold: zone.freeShippingThreshold?.toString() || '',
      minDeliveryDays: zone.minDeliveryDays.toString(),
      maxDeliveryDays: zone.maxDeliveryDays.toString(),
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping Zones</h1>
          <p className="text-muted-foreground mt-2">
            Manage regional shipping rates and delivery options
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Zone
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
            <p className="text-xs text-muted-foreground">
              {zones.filter(z => z.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries Covered</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(zones.flatMap(z => z.countries)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique countries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Base Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${zones.length > 0
                ? formatCurrencyAmount(zones.reduce((sum, z) => sum + Number(z.baseFee), 0) / zones.length, 2)
                : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Across all zones</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Zones</CardTitle>
          <CardDescription>
            Configure shipping zones and rates for different regions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / Code</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead>Base Fee</TableHead>
                  <TableHead>Free Shipping</TableHead>
                  <TableHead>Delivery Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No shipping zones found
                    </TableCell>
                  </TableRow>
                ) : (
                  zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{zone.name}</div>
                          <div className="text-sm text-muted-foreground">{zone.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {zone.countries.slice(0, 3).map((country) => (
                            <Badge key={country} variant="outline">
                              {country}
                            </Badge>
                          ))}
                          {zone.countries.length > 3 && (
                            <Badge variant="secondary">+{zone.countries.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${formatCurrencyAmount(zone.baseFee, 2)}</TableCell>
                      <TableCell>
                        {zone.freeShippingThreshold ? (
                          <span className="text-sm">
                            ${formatCurrencyAmount(zone.freeShippingThreshold, 2)}+
                          </span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {zone.minDeliveryDays}-{zone.maxDeliveryDays} days
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(zone)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(zone.code)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Edit Shipping Zone' : 'Create Shipping Zone'}
            </DialogTitle>
            <DialogDescription>
              Configure shipping rates and delivery options for a region
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Zone Name *</Label>
                <Input
                  id="name"
                  placeholder="North America"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Zone Code *</Label>
                <Input
                  id="code"
                  placeholder="NA"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  disabled={!!editingZone}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="countries">Countries (comma-separated) *</Label>
                <Input
                  id="countries"
                  placeholder="US, CA, MX"
                  value={formData.countries}
                  onChange={(e) => setFormData({ ...formData, countries: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseFee">Base Fee ($) *</Label>
                <Input
                  id="baseFee"
                  type="number"
                  step="0.01"
                  placeholder="15.00"
                  value={formData.baseFee}
                  onChange={(e) => setFormData({ ...formData, baseFee: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="perKgFee">Per Kg Fee ($)</Label>
                <Input
                  id="perKgFee"
                  type="number"
                  step="0.01"
                  placeholder="5.00"
                  value={formData.perKgFee}
                  onChange={(e) => setFormData({ ...formData, perKgFee: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">Free Shipping Threshold ($)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  step="0.01"
                  placeholder="200.00"
                  value={formData.freeShippingThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, freeShippingThreshold: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minDeliveryDays">Min Delivery Days *</Label>
                <Input
                  id="minDeliveryDays"
                  type="number"
                  placeholder="3"
                  value={formData.minDeliveryDays}
                  onChange={(e) => setFormData({ ...formData, minDeliveryDays: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDeliveryDays">Max Delivery Days *</Label>
                <Input
                  id="maxDeliveryDays"
                  type="number"
                  placeholder="7"
                  value={formData.maxDeliveryDays}
                  onChange={(e) => setFormData({ ...formData, maxDeliveryDays: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Shipping to North American countries"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingZone ? 'Update Zone' : 'Create Zone'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ShippingZonesPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <ShippingZonesContent />
      </AdminLayout>
    </AdminRoute>
  );
}

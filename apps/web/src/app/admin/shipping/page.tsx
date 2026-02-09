'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
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
} from '@nextpik/ui';
import { toast } from 'sonner';
import { Truck, MapPin, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
  const t = useTranslations('adminShipping');
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
      const response = await fetch(`${API_URL}/shipping/zones`, {
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
      toast.error(t('toast.loadError'));
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
        countries: formData.countries.split(',').map((c) => c.trim()),
        baseFee: parseFloat(formData.baseFee),
        perKgFee: formData.perKgFee ? parseFloat(formData.perKgFee) : undefined,
        freeShippingThreshold: formData.freeShippingThreshold
          ? parseFloat(formData.freeShippingThreshold)
          : undefined,
        minDeliveryDays: parseInt(formData.minDeliveryDays),
        maxDeliveryDays: parseInt(formData.maxDeliveryDays),
      };

      const url = editingZone
        ? `${API_URL}/shipping/zones/${editingZone.code}`
        : `${API_URL}/shipping/zones`;

      const response = await fetch(url, {
        method: editingZone ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingZone ? t('toast.updateSuccess') : t('toast.createSuccess'));
        setDialogOpen(false);
        resetForm();
        fetchZones();
      } else {
        const error = await response.json();
        toast.error(error.message || t('toast.saveError'));
      }
    } catch (error) {
      console.error('Error saving zone:', error);
      toast.error(t('toast.saveError'));
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(t('toast.deleteConfirm'))) return;

    try {
      const response = await fetch(`${API_URL}/shipping/zones/${code}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success(t('toast.deleteSuccess'));
        fetchZones();
      } else {
        toast.error(t('toast.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error(t('toast.deleteError'));
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
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('buttons.addZone')}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalZones')}</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{zones.length}</div>
              <p className="text-xs text-muted-foreground">
                {zones.filter((z) => z.isActive).length} {t('stats.active')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.countriesCovered')}</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(zones.flatMap((z) => z.countries)).size}
              </div>
              <p className="text-xs text-muted-foreground">{t('stats.uniqueCountries')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.avgBaseFee')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {zones.length > 0
                  ? formatCurrencyAmount(
                      zones.reduce((sum, z) => sum + Number(z.baseFee), 0) / zones.length,
                      2
                    )
                  : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">{t('stats.acrossAllZones')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('table.title')}</CardTitle>
            <CardDescription>{t('table.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.headers.nameCode')}</TableHead>
                    <TableHead>{t('table.headers.countries')}</TableHead>
                    <TableHead>{t('table.headers.baseFee')}</TableHead>
                    <TableHead>{t('table.headers.freeShipping')}</TableHead>
                    <TableHead>{t('table.headers.deliveryTime')}</TableHead>
                    <TableHead>{t('table.headers.status')}</TableHead>
                    <TableHead>{t('table.headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        {t('table.noZonesFound')}
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
                        <TableCell className="font-medium">
                          ${formatCurrencyAmount(zone.baseFee, 2)}
                        </TableCell>
                        <TableCell>
                          {zone.freeShippingThreshold ? (
                            <span className="text-sm">
                              ${formatCurrencyAmount(zone.freeShippingThreshold, 2)}+
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{t('table.none')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {zone.minDeliveryDays}-{zone.maxDeliveryDays} {t('table.days')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                            {zone.isActive ? t('table.active') : t('table.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(zone)}>
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
                {editingZone ? t('dialog.editTitle') : t('dialog.createTitle')}
              </DialogTitle>
              <DialogDescription>{t('dialog.description')}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('dialog.zoneName')} {t('dialog.required')}
                  </Label>
                  <Input
                    id="name"
                    placeholder={t('placeholders.zoneName')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">
                    {t('dialog.zoneCode')} {t('dialog.required')}
                  </Label>
                  <Input
                    id="code"
                    placeholder={t('placeholders.zoneCode')}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    required
                    disabled={!!editingZone}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="countries">
                    {t('dialog.countries')} {t('dialog.required')}
                  </Label>
                  <Input
                    id="countries"
                    placeholder={t('placeholders.countries')}
                    value={formData.countries}
                    onChange={(e) => setFormData({ ...formData, countries: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseFee">
                    {t('dialog.baseFee')} {t('dialog.required')}
                  </Label>
                  <Input
                    id="baseFee"
                    type="number"
                    step="0.01"
                    placeholder={t('placeholders.baseFee')}
                    value={formData.baseFee}
                    onChange={(e) => setFormData({ ...formData, baseFee: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perKgFee">{t('dialog.perKgFee')}</Label>
                  <Input
                    id="perKgFee"
                    type="number"
                    step="0.01"
                    placeholder={t('placeholders.perKgFee')}
                    value={formData.perKgFee}
                    onChange={(e) => setFormData({ ...formData, perKgFee: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold">{t('dialog.freeShippingThreshold')}</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    step="0.01"
                    placeholder={t('placeholders.freeShippingThreshold')}
                    value={formData.freeShippingThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, freeShippingThreshold: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minDeliveryDays">
                    {t('dialog.minDeliveryDays')} {t('dialog.required')}
                  </Label>
                  <Input
                    id="minDeliveryDays"
                    type="number"
                    placeholder={t('placeholders.minDeliveryDays')}
                    value={formData.minDeliveryDays}
                    onChange={(e) => setFormData({ ...formData, minDeliveryDays: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDeliveryDays">
                    {t('dialog.maxDeliveryDays')} {t('dialog.required')}
                  </Label>
                  <Input
                    id="maxDeliveryDays"
                    type="number"
                    placeholder={t('placeholders.maxDeliveryDays')}
                    value={formData.maxDeliveryDays}
                    onChange={(e) => setFormData({ ...formData, maxDeliveryDays: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('dialog.descriptionField')}</Label>
                <Input
                  id="description"
                  placeholder={t('placeholders.description')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('buttons.cancel')}
                </Button>
                <Button type="submit">
                  {editingZone ? t('buttons.updateZone') : t('buttons.createZone')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
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

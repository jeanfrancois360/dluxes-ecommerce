'use client';

import { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Badge } from '@nextpik/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@nextpik/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nextpik/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Textarea } from '@nextpik/ui';
import { Switch } from '@nextpik/ui';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { toast, standardToasts } from '@/lib/utils/toast';
import axios from 'axios';

interface DeliveryProvider {
  id: string;
  name: string;
  slug: string;
  type: 'API_INTEGRATED' | 'PARTNER' | 'MANUAL';
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  apiEnabled: boolean;
  countries: string[];
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionRate: number;
  isActive: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';
  logo?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    deliveries: number;
    users: number;
  };
}

interface ProviderFormData {
  name: string;
  slug: string;
  type: 'API_INTEGRATED' | 'PARTNER' | 'MANUAL';
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  apiEnabled: boolean;
  apiEndpoint: string;
  countries: string[];
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionRate: number;
  isActive: boolean;
}

function DeliveryProvidersContent() {
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProvider | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    slug: '',
    type: 'PARTNER',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    apiEnabled: false,
    apiEndpoint: '',
    countries: [],
    commissionType: 'PERCENTAGE',
    commissionRate: 10,
    isActive: true,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/delivery-providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviders(response.data.data || response.data);
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to fetch delivery providers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/delivery-providers`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Delivery provider created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchProviders();
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to create provider');
    }
  };

  const handleUpdateProvider = async () => {
    if (!selectedProvider) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`${API_URL}/delivery-providers/${selectedProvider.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Delivery provider updated successfully');
      setIsEditDialogOpen(false);
      setSelectedProvider(null);
      resetForm();
      fetchProviders();
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to update provider');
    }
  };

  const handleVerifyProvider = async (providerId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_URL}/delivery-providers/${providerId}/verify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Provider verified successfully');
      fetchProviders();
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to verify provider');
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/delivery-providers/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Provider deleted successfully');
      fetchProviders();
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to delete provider');
    }
  };

  const openEditDialog = (provider: DeliveryProvider) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name,
      slug: provider.slug,
      type: provider.type,
      description: provider.description || '',
      contactEmail: provider.contactEmail,
      contactPhone: provider.contactPhone || '',
      website: provider.website || '',
      apiEnabled: provider.apiEnabled,
      apiEndpoint: '',
      countries: provider.countries,
      commissionType: provider.commissionType,
      commissionRate: Number(provider.commissionRate),
      isActive: provider.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      type: 'PARTNER',
      description: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      apiEnabled: false,
      apiEndpoint: '',
      countries: [],
      commissionType: 'PERCENTAGE',
      commissionRate: 10,
      isActive: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      VERIFIED: { label: 'Verified', variant: 'default' },
      PENDING: { label: 'Pending', variant: 'secondary' },
      SUSPENDED: { label: 'Suspended', variant: 'destructive' },
      REJECTED: { label: 'Rejected', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; variant: any }> = {
      API_INTEGRATED: { label: 'API Integrated', variant: 'default' },
      PARTNER: { label: 'Partner', variant: 'secondary' },
      MANUAL: { label: 'Manual', variant: 'outline' },
    };

    const config = typeConfig[type] || { label: type, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || provider.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || provider.verificationStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <>
      <PageHeader
        title="Delivery Providers"
        description="Manage delivery providers and their settings"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="API_INTEGRATED">API Integrated</SelectItem>
              <SelectItem value="PARTNER">Partner</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Deliveries</TableHead>
                <TableHead>Partners</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No providers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{provider.name}</div>
                        <div className="text-sm text-muted-foreground">{provider.contactEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(provider.type)}</TableCell>
                    <TableCell>{getStatusBadge(provider.verificationStatus)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{provider.countries.slice(0, 3).join(', ')}</div>
                      {provider.countries.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{provider.countries.length - 3} more
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {provider.commissionRate}% {provider.commissionType}
                    </TableCell>
                    <TableCell>{provider._count?.deliveries || 0}</TableCell>
                    <TableCell>{provider._count?.users || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {provider.verificationStatus === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyProvider(provider.id)}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Verify
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(provider)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteProvider(provider.id)}
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

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Delivery Provider</DialogTitle>
              <DialogDescription>Add a new delivery provider to the system</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Provider Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="FedEx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="fedex"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Provider Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="API_INTEGRATED">API Integrated</SelectItem>
                      <SelectItem value="PARTNER">Partner</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="support@fedex.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+1-800-463-3339"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.fedex.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Leading international courier delivery services"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commissionType">Commission Type</Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, commissionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Commission Rate</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.1"
                    value={formData.commissionRate}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="countries">Countries (comma-separated)</Label>
                <Input
                  id="countries"
                  value={formData.countries.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      countries: e.target.value.split(',').map((c) => c.trim()),
                    })
                  }
                  placeholder="US, CA, UK, FR"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="apiEnabled"
                  checked={formData.apiEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, apiEnabled: checked })}
                />
                <Label htmlFor="apiEnabled">API Integration Enabled</Label>
              </div>

              {formData.apiEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="apiEndpoint">API Endpoint</Label>
                  <Input
                    id="apiEndpoint"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                    placeholder="https://api.fedex.com"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProvider}>Create Provider</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Delivery Provider</DialogTitle>
              <DialogDescription>Update provider information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Same form fields as create dialog */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Provider Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contactEmail">Contact Email *</Label>
                  <Input
                    id="edit-contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                  <Input
                    id="edit-contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-commissionRate">Commission Rate</Label>
                  <Input
                    id="edit-commissionRate"
                    type="number"
                    step="0.1"
                    value={formData.commissionRate}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProvider}>Update Provider</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function DeliveryProvidersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <DeliveryProvidersContent />
      </AdminLayout>
    </AdminRoute>
  );
}

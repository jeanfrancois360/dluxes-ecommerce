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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nextpik/ui';
import { toast } from 'sonner';
import { Percent, Users, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
interface SellerCommissionOverride {
  id: string;
  sellerId: string;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionRate: number;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  categoryId: string | null;
  isActive: boolean;
  priority: number;
  validFrom: string | null;
  validUntil: string | null;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  seller: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  category: {
    name: string;
    slug: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function CommissionOverridesContent() {
  const [overrides, setOverrides] = useState<SellerCommissionOverride[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<SellerCommissionOverride | null>(null);
  const [formData, setFormData] = useState({
    sellerId: '',
    sellerEmail: '',
    commissionType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    commissionRate: '',
    minOrderValue: '',
    maxOrderValue: '',
    categoryId: '',
    validFrom: '',
    validUntil: '',
    notes: '',
  });

  useEffect(() => {
    fetchOverrides();
    fetchCategories();
  }, []);

  const fetchOverrides = async () => {
    try {
      const response = await fetch('/api/admin/commission/overrides', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOverrides(data);
      }
    } catch (error) {
      console.error('Error fetching overrides:', error);
      toast.error('Failed to load commission overrides');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find seller by email first
    let sellerId = formData.sellerId;
    if (!sellerId && formData.sellerEmail) {
      try {
        const response = await fetch(`/api/admin/users?email=${formData.sellerEmail}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const users = await response.json();
          if (users.length > 0) {
            sellerId = users[0].id;
          }
        }
      } catch (error) {
        toast.error('Failed to find seller');
        return;
      }
    }

    if (!sellerId) {
      toast.error('Please provide a valid seller email');
      return;
    }

    try {
      const payload = {
        sellerId,
        commissionType: formData.commissionType,
        commissionRate: parseFloat(formData.commissionRate),
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
        maxOrderValue: formData.maxOrderValue ? parseFloat(formData.maxOrderValue) : undefined,
        categoryId: formData.categoryId || undefined,
        validFrom: formData.validFrom || undefined,
        validUntil: formData.validUntil || undefined,
        notes: formData.notes || undefined,
        approvedBy: 'admin', // TODO: Get actual admin ID
      };

      const url = editingOverride
        ? `/api/admin/commission/overrides/${editingOverride.sellerId}`
        : '/api/admin/commission/overrides';

      const response = await fetch(url, {
        method: editingOverride ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          editingOverride
            ? 'Commission override updated successfully'
            : 'Commission override created successfully'
        );
        setDialogOpen(false);
        resetForm();
        fetchOverrides();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save commission override');
      }
    } catch (error) {
      console.error('Error saving override:', error);
      toast.error('Failed to save commission override');
    }
  };

  const handleDelete = async (sellerId: string) => {
    if (!confirm('Are you sure you want to delete this commission override?')) return;

    try {
      const response = await fetch(`/api/admin/commission/overrides/${sellerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Commission override deleted successfully');
        fetchOverrides();
      } else {
        toast.error('Failed to delete commission override');
      }
    } catch (error) {
      console.error('Error deleting override:', error);
      toast.error('Failed to delete commission override');
    }
  };

  const resetForm = () => {
    setFormData({
      sellerId: '',
      sellerEmail: '',
      commissionType: 'PERCENTAGE',
      commissionRate: '',
      minOrderValue: '',
      maxOrderValue: '',
      categoryId: '',
      validFrom: '',
      validUntil: '',
      notes: '',
    });
    setEditingOverride(null);
  };

  const handleEdit = (override: SellerCommissionOverride) => {
    setEditingOverride(override);
    setFormData({
      sellerId: override.sellerId,
      sellerEmail: override.seller.email,
      commissionType: override.commissionType,
      commissionRate: override.commissionRate.toString(),
      minOrderValue: override.minOrderValue?.toString() || '',
      maxOrderValue: override.maxOrderValue?.toString() || '',
      categoryId: override.categoryId || '',
      validFrom: override.validFrom || '',
      validUntil: override.validUntil || '',
      notes: override.notes || '',
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Overrides</h1>
          <p className="text-muted-foreground mt-2">
            Manage seller-specific commission rates
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Override
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overrides</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overrides.length}</div>
            <p className="text-xs text-muted-foreground">
              {overrides.filter(o => o.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overrides.length > 0
                ? formatNumber(overrides.reduce((sum, o) => sum + Number(o.commissionRate), 0) / overrides.length, 2)
                : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">Across all sellers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lowest Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overrides.length > 0
                ? formatNumber(Math.min(...overrides.map(o => Number(o.commissionRate))), 2)
                : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">Best seller rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Overrides</CardTitle>
          <CardDescription>
            Seller-specific commission rates that override default rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Order Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No commission overrides found
                    </TableCell>
                  </TableRow>
                ) : (
                  overrides.map((override) => (
                    <TableRow key={override.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {override.seller.firstName} {override.seller.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {override.seller.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {override.commissionRate}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{override.commissionType}</Badge>
                      </TableCell>
                      <TableCell>
                        {override.category?.name || <span className="text-muted-foreground">All</span>}
                      </TableCell>
                      <TableCell>
                        {override.minOrderValue || override.maxOrderValue ? (
                          <span className="text-sm">
                            ${override.minOrderValue || '0'} - ${override.maxOrderValue || '∞'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Any</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={override.isActive ? 'default' : 'secondary'}>
                          {override.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(override.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(override)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(override.sellerId)}
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
              {editingOverride ? 'Edit Commission Override' : 'Create Commission Override'}
            </DialogTitle>
            <DialogDescription>
              Set a custom commission rate for a specific seller
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellerEmail">Seller Email *</Label>
                <Input
                  id="sellerEmail"
                  type="email"
                  placeholder="seller@example.com"
                  value={formData.sellerEmail}
                  onChange={(e) => setFormData({ ...formData, sellerEmail: e.target.value })}
                  required
                  disabled={!!editingOverride}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionType">Type *</Label>
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
                <Label htmlFor="commissionRate">
                  {formData.commissionType === 'PERCENTAGE' ? 'Rate (%)' : 'Amount ($)'} *
                </Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  placeholder={formData.commissionType === 'PERCENTAGE' ? '5.00' : '10.00'}
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category (Optional)</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minOrderValue">Min Order Value ($)</Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxOrderValue">Max Order Value ($)</Label>
                <Input
                  id="maxOrderValue"
                  type="number"
                  step="0.01"
                  placeholder="Unlimited"
                  value={formData.maxOrderValue}
                  onChange={(e) => setFormData({ ...formData, maxOrderValue: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Reason for custom rate..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingOverride ? 'Update Override' : 'Create Override'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CommissionOverridesPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CommissionOverridesContent />
      </AdminLayout>
    </AdminRoute>
  );
}

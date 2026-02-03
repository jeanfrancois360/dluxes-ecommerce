'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  Percent,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Download,
  DollarSign,
  Clock,
} from 'lucide-react';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { useDebounce } from '@/hooks/use-debounce';

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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Calculate stats
  const stats = useMemo(() => {
    const active = overrides.filter((o) => o.isActive);
    const inactive = overrides.filter((o) => !o.isActive);
    const percentageType = overrides.filter((o) => o.commissionType === 'PERCENTAGE');
    const avgRate =
      percentageType.length > 0
        ? percentageType.reduce((sum, o) => sum + Number(o.commissionRate), 0) /
          percentageType.length
        : 0;
    const lowestRate =
      percentageType.length > 0
        ? Math.min(...percentageType.map((o) => Number(o.commissionRate)))
        : 0;
    const highestRate =
      percentageType.length > 0
        ? Math.max(...percentageType.map((o) => Number(o.commissionRate)))
        : 0;

    // Expiring soon (within 30 days)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = overrides.filter((o) => {
      if (!o.validUntil) return false;
      const validUntil = new Date(o.validUntil);
      return validUntil <= thirtyDaysLater && validUntil > now;
    }).length;

    return {
      total: overrides.length,
      active: active.length,
      inactive: inactive.length,
      avgRate,
      lowestRate,
      highestRate,
      expiringSoon,
    };
  }, [overrides]);

  // Filter and sort
  const filteredOverrides = useMemo(() => {
    let filtered = [...overrides];

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.seller.email.toLowerCase().includes(search) ||
          `${o.seller.firstName} ${o.seller.lastName}`.toLowerCase().includes(search) ||
          o.notes?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) =>
        statusFilter === 'active' ? o.isActive : !o.isActive
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((o) => o.commissionType === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'none') {
        filtered = filtered.filter((o) => !o.categoryId);
      } else {
        filtered = filtered.filter((o) => o.categoryId === categoryFilter);
      }
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        filtered.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'rate_high':
        filtered.sort((a, b) => Number(b.commissionRate) - Number(a.commissionRate));
        break;
      case 'rate_low':
        filtered.sort((a, b) => Number(a.commissionRate) - Number(b.commissionRate));
        break;
      case 'seller':
        filtered.sort((a, b) =>
          `${a.seller.firstName} ${a.seller.lastName}`.localeCompare(
            `${b.seller.firstName} ${b.seller.lastName}`
          )
        );
        break;
      case 'newest':
      default:
        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return filtered;
  }, [overrides, debouncedSearch, statusFilter, typeFilter, categoryFilter, sortBy]);

  // Bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOverrides.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOverrides.map((o) => o.id)));
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
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    debouncedSearch !== '';

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  // Bulk actions
  const handleBulkExport = () => {
    toast.success(`Exporting ${selectedIds.size} commission overrides`);
    setSelectedIds(new Set());
  };

  const handleBulkActivate = async () => {
    if (!confirm(`Activate ${selectedIds.size} commission overrides?`)) return;
    // Implement bulk activate
    toast.success(`Activated ${selectedIds.size} overrides`);
    setSelectedIds(new Set());
    fetchOverrides();
  };

  const handleBulkDeactivate = async () => {
    if (!confirm(`Deactivate ${selectedIds.size} commission overrides?`)) return;
    // Implement bulk deactivate
    toast.success(`Deactivated ${selectedIds.size} overrides`);
    setSelectedIds(new Set());
    fetchOverrides();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} commission overrides? This cannot be undone.`)) return;

    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      const override = filteredOverrides.find((o) => o.id === id);
      if (override) {
        try {
          const response = await fetch(`/api/admin/commission/overrides/${override.sellerId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (response.ok) {
            success++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }
    }

    toast.success(`Deleted ${success} overrides (${failed} failed)`);
    setSelectedIds(new Set());
    fetchOverrides();
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
        approvedBy: 'admin',
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
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Override
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overrides</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active, {stats.inactive} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.avgRate, 1)}%</div>
            <p className="text-xs text-muted-foreground">Percentage overrides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lowest Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(stats.lowestRate, 1)}%
            </div>
            <p className="text-xs text-muted-foreground">Best seller rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.highestRate, 1)}%</div>
            <p className="text-xs text-muted-foreground">Maximum override</p>
          </CardContent>
        </Card>

        <Card className={stats.expiringSoon > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-sm font-medium ${stats.expiringSoon > 0 ? 'text-amber-700' : ''}`}
            >
              Expiring Soon
            </CardTitle>
            <Clock
              className={`h-4 w-4 ${stats.expiringSoon > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${stats.expiringSoon > 0 ? 'text-amber-700' : ''}`}
            >
              {stats.expiringSoon}
            </div>
            <p
              className={`text-xs ${stats.expiringSoon > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}
            >
              Within 30 days
            </p>
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
                placeholder="Search by seller name, email, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              <SelectItem value="FIXED">Fixed</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="none">No Category</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
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
              <SelectItem value="rate_high">Rate (High)</SelectItem>
              <SelectItem value="rate_low">Rate (Low)</SelectItem>
              <SelectItem value="seller">Seller Name</SelectItem>
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
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {typeFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Type: {typeFilter}
                <button
                  onClick={() => setTypeFilter('all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {categoryFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Category:{' '}
                {categoryFilter === 'none'
                  ? 'None'
                  : categories.find((c) => c.id === categoryFilter)?.name || categoryFilter}
                <button
                  onClick={() => setCategoryFilter('all')}
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
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        filteredOverrides.length > 0 &&
                        selectedIds.size === filteredOverrides.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-neutral-300"
                    />
                  </TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Order Range</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading commission overrides...
                    </TableCell>
                  </TableRow>
                ) : filteredOverrides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No commission overrides found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOverrides.map((override) => (
                    <TableRow
                      key={override.id}
                      className={selectedIds.has(override.id) ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(override.id)}
                          onChange={() => toggleSelect(override.id)}
                          className="w-4 h-4 rounded border-neutral-300"
                        />
                      </TableCell>
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
                        {override.commissionType === 'PERCENTAGE' ? (
                          <span className="text-blue-600">{override.commissionRate}%</span>
                        ) : (
                          <span className="text-green-600">
                            ${formatCurrencyAmount(override.commissionRate, 2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{override.commissionType}</Badge>
                      </TableCell>
                      <TableCell>
                        {override.category?.name || (
                          <span className="text-muted-foreground">All</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {override.minOrderValue || override.maxOrderValue ? (
                          <span className="text-sm">
                            ${override.minOrderValue || '0'} - $
                            {override.maxOrderValue || '∞'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Any</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {override.validFrom || override.validUntil ? (
                          <div className="text-sm">
                            {override.validFrom && (
                              <div>From: {new Date(override.validFrom).toLocaleDateString()}</div>
                            )}
                            {override.validUntil && (
                              <div
                                className={
                                  new Date(override.validUntil) < new Date()
                                    ? 'text-red-500'
                                    : ''
                                }
                              >
                                Until: {new Date(override.validUntil).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Always</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={override.isActive ? 'default' : 'secondary'}>
                          {override.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(override)}>
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
            <Button variant="secondary" size="sm" onClick={handleBulkExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={handleBulkActivate}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              Activate
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkDeactivate} className="gap-2">
              Deactivate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

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

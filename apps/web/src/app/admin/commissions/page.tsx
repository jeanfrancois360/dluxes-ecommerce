'use client';

import { useState, useEffect, useMemo } from 'react';
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
  sellerId: string | null;
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
  } | null;
  category: {
    id: string;
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
  const t = useTranslations('adminCommissions');
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
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOverrides(data);
      }
    } catch (error) {
      console.error('Error fetching overrides:', error);
      toast.error(t('toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`);
      if (response.ok) {
        const result = await response.json();
        // Backend wraps data in {success: true, data: [...]}
        const data = result.success ? result.data : result;
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

    // Count by scope
    const sellerOnly = overrides.filter((o) => o.sellerId && !o.categoryId).length;
    const categoryOnly = overrides.filter((o) => !o.sellerId && o.categoryId).length;
    const specific = overrides.filter((o) => o.sellerId && o.categoryId).length;

    return {
      total: overrides.length,
      active: active.length,
      inactive: inactive.length,
      avgRate,
      lowestRate,
      highestRate,
      expiringSoon,
      sellerOnly,
      categoryOnly,
      specific,
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
          o.seller?.email.toLowerCase().includes(search) ||
          (o.seller &&
            `${o.seller.firstName} ${o.seller.lastName}`.toLowerCase().includes(search)) ||
          o.category?.name.toLowerCase().includes(search) ||
          o.notes?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => (statusFilter === 'active' ? o.isActive : !o.isActive));
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
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'rate_high':
        filtered.sort((a, b) => Number(b.commissionRate) - Number(a.commissionRate));
        break;
      case 'rate_low':
        filtered.sort((a, b) => Number(a.commissionRate) - Number(b.commissionRate));
        break;
      case 'seller':
        filtered.sort((a, b) => {
          const aName = a.seller ? `${a.seller.firstName} ${a.seller.lastName}` : 'ZZZ';
          const bName = b.seller ? `${b.seller.firstName} ${b.seller.lastName}` : 'ZZZ';
          return aName.localeCompare(bName);
        });
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    toast.success(t('bulkActions.exportSuccess', { count: selectedIds.size }));
    setSelectedIds(new Set());
  };

  const handleBulkActivate = async () => {
    if (!confirm(t('bulkActions.confirmActivate', { count: selectedIds.size }))) return;
    // Implement bulk activate
    toast.success(t('bulkActions.activateSuccess', { count: selectedIds.size }));
    setSelectedIds(new Set());
    fetchOverrides();
  };

  const handleBulkDeactivate = async () => {
    if (!confirm(t('bulkActions.confirmDeactivate', { count: selectedIds.size }))) return;
    // Implement bulk deactivate
    toast.success(t('bulkActions.deactivateSuccess', { count: selectedIds.size }));
    setSelectedIds(new Set());
    fetchOverrides();
  };

  const handleBulkDelete = async () => {
    if (!confirm(t('bulkActions.confirmDelete', { count: selectedIds.size }))) return;

    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/admin/commission/overrides/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
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

    toast.success(t('bulkActions.deleteSuccess', { count: success, failed }));
    setSelectedIds(new Set());
    fetchOverrides();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find seller by email if provided
    let sellerId = formData.sellerId;
    if (formData.sellerEmail) {
      try {
        const response = await fetch(`/api/admin/users?email=${formData.sellerEmail}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (response.ok) {
          const users = await response.json();
          if (users.length > 0) {
            sellerId = users[0].id;
          } else {
            toast.error(t('toast.invalidSellerEmail'));
            return;
          }
        }
      } catch (error) {
        toast.error(t('toast.findSellerError'));
        return;
      }
    }

    // Validate: At least one of seller or category must be selected
    const categoryId =
      formData.categoryId && formData.categoryId !== '' && formData.categoryId !== 'all'
        ? formData.categoryId
        : null;

    if (!sellerId && !categoryId) {
      toast.error('Please select either a seller or category (or both)');
      return;
    }

    try {
      const payload = {
        ...(sellerId && { sellerId }),
        ...(categoryId && { categoryId }),
        commissionType: formData.commissionType,
        commissionRate: parseFloat(formData.commissionRate),
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
        maxOrderValue: formData.maxOrderValue ? parseFloat(formData.maxOrderValue) : undefined,
        validFrom: formData.validFrom || undefined,
        validUntil: formData.validUntil || undefined,
        notes: formData.notes || undefined,
        approvedBy: 'admin',
      };

      const url = editingOverride
        ? `/api/admin/commission/overrides/${editingOverride.id}`
        : '/api/admin/commission/overrides';

      const response = await fetch(url, {
        method: editingOverride ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingOverride ? t('toast.updateSuccess') : t('toast.createSuccess'));
        setDialogOpen(false);
        resetForm();
        fetchOverrides();
      } else {
        const error = await response.json();
        toast.error(error.message || t('toast.saveError'));
      }
    } catch (error) {
      console.error('Error saving override:', error);
      toast.error(t('toast.saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('toast.deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/admin/commission/overrides/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        toast.success(t('toast.deleteSuccess'));
        fetchOverrides();
      } else {
        toast.error(t('toast.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting override:', error);
      toast.error(t('toast.deleteError'));
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
      sellerId: override.sellerId || '',
      sellerEmail: override.seller?.email || '',
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
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-end items-center">
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addOverride')}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalOverrides')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} {t('stats.active')}, {stats.inactive} {t('stats.inactive')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.averageRate')}</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.avgRate, 1)}%</div>
              <p className="text-xs text-muted-foreground">{t('stats.percentageOverrides')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.lowestRate')}</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(stats.lowestRate, 1)}%
              </div>
              <p className="text-xs text-muted-foreground">{t('stats.bestSellerRate')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.highestRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.highestRate, 1)}%</div>
              <p className="text-xs text-muted-foreground">{t('stats.maximumOverride')}</p>
            </CardContent>
          </Card>

          <Card className={stats.expiringSoon > 0 ? 'border-amber-200 bg-amber-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium ${stats.expiringSoon > 0 ? 'text-amber-700' : ''}`}
              >
                {t('stats.expiringSoon')}
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
                {t('stats.within30Days')}
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
                  placeholder={t('filters.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('filters.active')}</SelectItem>
                <SelectItem value="inactive">{t('filters.inactive')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('filters.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
                <SelectItem value="PERCENTAGE">{t('filters.percentage')}</SelectItem>
                <SelectItem value="FIXED">{t('filters.fixed')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('filters.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
                <SelectItem value="none">{t('filters.noCategory')}</SelectItem>
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
                <SelectValue placeholder={t('filters.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('filters.newestFirst')}</SelectItem>
                <SelectItem value="oldest">{t('filters.oldestFirst')}</SelectItem>
                <SelectItem value="rate_high">{t('filters.rateHigh')}</SelectItem>
                <SelectItem value="rate_low">{t('filters.rateLow')}</SelectItem>
                <SelectItem value="seller">{t('filters.sellerName')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">{t('filters.activeFilters')}</span>
              {debouncedSearch && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.search')}: {debouncedSearch}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.status')}: {statusFilter}
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
                  {t('filters.type')}: {typeFilter}
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
                  {t('filters.category')}:{' '}
                  {categoryFilter === 'none'
                    ? t('filters.none')
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
                {t('filters.clearAll')}
              </Button>
            </div>
          )}
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
                    <TableHead>{t('table.headers.seller')}</TableHead>
                    <TableHead>{t('table.headers.category')}</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>{t('table.headers.rate')}</TableHead>
                    <TableHead>{t('table.headers.type')}</TableHead>
                    <TableHead>{t('table.headers.orderRange')}</TableHead>
                    <TableHead>{t('table.headers.validity')}</TableHead>
                    <TableHead>{t('table.headers.status')}</TableHead>
                    <TableHead>{t('table.headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        {t('table.loading')}
                      </TableCell>
                    </TableRow>
                  ) : filteredOverrides.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        {t('table.noResults')}
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
                          {override.seller ? (
                            <div>
                              <div className="font-medium">
                                {override.seller.firstName} {override.seller.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {override.seller.email}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="secondary">All Sellers</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {override.category ? (
                            override.category.name
                          ) : override.seller ? (
                            <span className="text-muted-foreground">All Categories</span>
                          ) : (
                            <Badge variant="outline">Global</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {override.seller && override.category && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                              Specific
                            </Badge>
                          )}
                          {override.seller && !override.category && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                              Seller
                            </Badge>
                          )}
                          {!override.seller && override.category && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              Category
                            </Badge>
                          )}
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
                          {override.minOrderValue || override.maxOrderValue ? (
                            <span className="text-sm">
                              ${override.minOrderValue || '0'} - ${override.maxOrderValue || '∞'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{t('table.any')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {override.validFrom || override.validUntil ? (
                            <div className="text-sm">
                              {override.validFrom && (
                                <div>
                                  {t('table.from')}:{' '}
                                  {new Date(override.validFrom).toLocaleDateString()}
                                </div>
                              )}
                              {override.validUntil && (
                                <div
                                  className={
                                    new Date(override.validUntil) < new Date() ? 'text-red-500' : ''
                                  }
                                >
                                  {t('table.until')}:{' '}
                                  {new Date(override.validUntil).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{t('table.always')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={override.isActive ? 'default' : 'secondary'}>
                            {override.isActive ? t('table.active') : t('table.inactive')}
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
                              onClick={() => handleDelete(override.id)}
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
              <span className="font-medium">
                {selectedIds.size} {t('bulkActions.selected')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-white hover:text-white hover:bg-slate-800"
              >
                {t('bulkActions.clearSelection')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleBulkExport} className="gap-2">
                <Download className="h-4 w-4" />
                {t('bulkActions.export')}
              </Button>
              <Button
                size="sm"
                onClick={handleBulkActivate}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                {t('bulkActions.activate')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkDeactivate}
                className="gap-2"
              >
                {t('bulkActions.deactivate')}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                {t('bulkActions.delete')}
              </Button>
            </div>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOverride ? t('dialog.editTitle') : t('dialog.createTitle')}
              </DialogTitle>
              <DialogDescription>{t('dialog.description')}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Validation Message */}
              {!formData.sellerEmail && (!formData.categoryId || formData.categoryId === 'all') && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-700">
                    ⚠️ Please select at least one: Seller OR Category (or both for specific
                    combination)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sellerEmail">
                    {t('dialog.sellerEmail')}{' '}
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="sellerEmail"
                    type="email"
                    placeholder="seller@example.com (leave blank for all sellers)"
                    value={formData.sellerEmail}
                    onChange={(e) => setFormData({ ...formData, sellerEmail: e.target.value })}
                    disabled={!!editingOverride}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionType">
                    {t('dialog.type')} {t('dialog.required')}
                  </Label>
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
                      <SelectItem value="PERCENTAGE">{t('dialog.typePercentage')}</SelectItem>
                      <SelectItem value="FIXED">{t('dialog.typeFixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionRate">
                    {formData.commissionType === 'PERCENTAGE'
                      ? t('dialog.ratePercent')
                      : t('dialog.rateAmount')}{' '}
                    {t('dialog.required')}
                  </Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.01"
                    placeholder={
                      formData.commissionType === 'PERCENTAGE'
                        ? t('dialog.ratePlaceholderPercent')
                        : t('dialog.ratePlaceholderAmount')
                    }
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">
                    Category <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (or leave blank for all)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minOrderValue">{t('dialog.minOrderValue')}</Label>
                  <Input
                    id="minOrderValue"
                    type="number"
                    step="0.01"
                    placeholder={t('dialog.minOrderPlaceholder')}
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxOrderValue">{t('dialog.maxOrderValue')}</Label>
                  <Input
                    id="maxOrderValue"
                    type="number"
                    step="0.01"
                    placeholder={t('dialog.maxOrderPlaceholder')}
                    value={formData.maxOrderValue}
                    onChange={(e) => setFormData({ ...formData, maxOrderValue: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validFrom">{t('dialog.validFrom')}</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validUntil">{t('dialog.validUntil')}</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('dialog.notes')}</Label>
                <Input
                  id="notes"
                  placeholder={t('dialog.notesPlaceholder')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('dialog.cancel')}
                </Button>
                <Button type="submit">
                  {editingOverride ? t('dialog.updateOverride') : t('dialog.createOverride')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
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

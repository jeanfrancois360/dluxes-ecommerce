'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { currencyAdminApi, CurrencyRate } from '@/lib/api/currency';
import useSWR from 'swr';
import { toast, standardToasts } from '@/lib/utils/toast';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import {
  DollarSign,
  Search,
  X,
  Download,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Globe,
  TrendingUp,
  Clock,
} from 'lucide-react';

function CurrenciesContent() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyRate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch all currencies (including inactive)
  const {
    data: currencies,
    error,
    isLoading,
    mutate,
  } = useSWR('/currency/admin/all', currencyAdminApi.getAllCurrencies, {
    revalidateOnFocus: true,
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!currencies) return { total: 0, active: 0, inactive: 0, recentlyUpdated: 0 };

    const active = currencies.filter((c) => c.isActive).length;
    const inactive = currencies.filter((c) => !c.isActive).length;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyUpdated = currencies.filter(
      (c) => new Date(c.lastUpdated) > oneDayAgo
    ).length;

    return { total: currencies.length, active, inactive, recentlyUpdated };
  }, [currencies]);

  // Filter and sort
  const filteredCurrencies = useMemo(() => {
    if (!currencies) return [];

    let filtered = [...currencies];

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.currencyCode.toLowerCase().includes(search) ||
          c.currencyName.toLowerCase().includes(search) ||
          c.symbol.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) =>
        statusFilter === 'active' ? c.isActive : !c.isActive
      );
    }

    // Sort
    switch (sortBy) {
      case 'code':
        filtered.sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
        break;
      case 'rate_high':
        filtered.sort((a, b) => Number(b.rate) - Number(a.rate));
        break;
      case 'rate_low':
        filtered.sort((a, b) => Number(a.rate) - Number(b.rate));
        break;
      case 'updated':
        filtered.sort(
          (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
        break;
      case 'name':
      default:
        filtered.sort((a, b) => a.currencyName.localeCompare(b.currencyName));
    }

    return filtered;
  }, [currencies, debouncedSearch, statusFilter, sortBy]);

  // Bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCurrencies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCurrencies.map((c) => c.id)));
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
  const hasActiveFilters = statusFilter !== 'all' || debouncedSearch !== '';

  const clearAllFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  const handleToggleActive = async (currency: CurrencyRate) => {
    try {
      await currencyAdminApi.toggleActive(currency.currencyCode);
      toast.success(
        `${currency.currencyName} has been ${currency.isActive ? 'deactivated' : 'activated'}`
      );
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle currency status');
    }
  };

  const handleDelete = async (currency: CurrencyRate) => {
    if (currency.currencyCode === 'USD') {
      toast.error('USD is the base currency and cannot be deleted');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${currency.currencyName}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(currency.id);
      await currencyAdminApi.deleteRate(currency.currencyCode);
      toast.success(`${currency.currencyName} has been deleted`);
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete currency');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate();
  };

  const handleEditSuccess = () => {
    setEditingCurrency(null);
    mutate();
  };

  // Bulk actions
  const handleBulkExport = () => {
    toast.success(`Exporting ${selectedIds.size} currencies`);
    setSelectedIds(new Set());
  };

  const handleBulkActivate = async () => {
    if (!confirm(`Activate ${selectedIds.size} currencies?`)) return;

    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      const currency = filteredCurrencies.find((c) => c.id === id);
      if (currency && !currency.isActive) {
        try {
          await currencyAdminApi.toggleActive(currency.currencyCode);
          success++;
        } catch {
          failed++;
        }
      }
    }

    toast.success(`Activated ${success} currencies (${failed} failed)`);
    setSelectedIds(new Set());
    mutate();
  };

  const handleBulkDeactivate = async () => {
    if (!confirm(`Deactivate ${selectedIds.size} currencies?`)) return;

    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      const currency = filteredCurrencies.find((c) => c.id === id);
      if (currency && currency.isActive && currency.currencyCode !== 'USD') {
        try {
          await currencyAdminApi.toggleActive(currency.currencyCode);
          success++;
        } catch {
          failed++;
        }
      }
    }

    toast.success(`Deactivated ${success} currencies (${failed} failed)`);
    setSelectedIds(new Set());
    mutate();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} currencies? This cannot be undone.`)) return;

    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      const currency = filteredCurrencies.find((c) => c.id === id);
      if (currency && currency.currencyCode !== 'USD') {
        try {
          await currencyAdminApi.deleteRate(currency.currencyCode);
          success++;
        } catch {
          failed++;
        }
      }
    }

    toast.success(`Deleted ${success} currencies (${failed} failed)`);
    setSelectedIds(new Set());
    mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Currency Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage exchange rates and currency settings for the platform
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Currency
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Currencies</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All currencies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Available for use</p>
          </CardContent>
        </Card>

        <Card className={stats.inactive > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-sm font-medium ${stats.inactive > 0 ? 'text-amber-700' : ''}`}
            >
              Inactive
            </CardTitle>
            <XCircle
              className={`h-4 w-4 ${stats.inactive > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.inactive > 0 ? 'text-amber-700' : ''}`}>
              {stats.inactive}
            </div>
            <p
              className={`text-xs ${stats.inactive > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}
            >
              Disabled currencies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Updated</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.recentlyUpdated}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Currency</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">USD</div>
            <p className="text-xs text-muted-foreground">US Dollar</p>
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
                placeholder="Search by code, name, or symbol..."
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

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="code">Code (A-Z)</SelectItem>
              <SelectItem value="rate_high">Rate (High)</SelectItem>
              <SelectItem value="rate_low">Rate (Low)</SelectItem>
              <SelectItem value="updated">Last Updated</SelectItem>
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
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Currencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Currencies</CardTitle>
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
                        filteredCurrencies.length > 0 &&
                        selectedIds.size === filteredCurrencies.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-neutral-300"
                    />
                  </TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Exchange Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading currencies...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-red-500">
                      Failed to load currencies
                    </TableCell>
                  </TableRow>
                ) : filteredCurrencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No currencies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <TableRow
                      key={currency.id}
                      className={selectedIds.has(currency.id) ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(currency.id)}
                          onChange={() => toggleSelect(currency.id)}
                          className="w-4 h-4 rounded border-neutral-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                            {currency.symbol}
                          </div>
                          <div>
                            <div className="font-medium">{currency.currencyName}</div>
                            {currency.currencyCode === 'USD' && (
                              <span className="text-xs text-amber-600 font-medium">
                                Base Currency
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium">{currency.currencyCode}</span>
                      </TableCell>
                      <TableCell>{currency.symbol}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatCurrencyAmount(currency.rate, 6)}</div>
                          <div className="text-xs text-muted-foreground">
                            1 USD = {formatNumber(currency.rate, currency.decimalDigits)}{' '}
                            {currency.currencyCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={currency.isActive ? 'default' : 'secondary'}>
                          {currency.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(currency.lastUpdated).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(currency.lastUpdated).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCurrency(currency)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(currency)}
                          >
                            {currency.isActive ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          {currency.currencyCode !== 'USD' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(currency)}
                              disabled={deletingId === currency.id}
                            >
                              <Trash2 className="h-4 w-4" />
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
              <CheckCircle className="h-4 w-4" />
              Activate
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkDeactivate} className="gap-2">
              <XCircle className="h-4 w-4" />
              Deactivate
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Add Currency Modal */}
      <CurrencyFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        mode="add"
      />

      {/* Edit Currency Modal */}
      <CurrencyFormModal
        isOpen={!!editingCurrency}
        onClose={() => setEditingCurrency(null)}
        onSuccess={handleEditSuccess}
        mode="edit"
        currency={editingCurrency}
      />
    </div>
  );
}

// Currency Form Modal Component
interface CurrencyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'add' | 'edit';
  currency?: CurrencyRate | null;
}

function CurrencyFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  currency,
}: CurrencyFormModalProps) {
  const [formData, setFormData] = useState({
    currencyCode: '',
    currencyName: '',
    symbol: '',
    rate: 1,
    decimalDigits: 2,
    position: 'before' as 'before' | 'after',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when currency changes or modal opens
  useEffect(() => {
    if (currency && mode === 'edit') {
      setFormData({
        currencyCode: currency.currencyCode,
        currencyName: currency.currencyName,
        symbol: currency.symbol,
        rate: Number(currency.rate),
        decimalDigits: currency.decimalDigits,
        position: currency.position,
        isActive: currency.isActive,
      });
    } else if (mode === 'add') {
      setFormData({
        currencyCode: '',
        currencyName: '',
        symbol: '',
        rate: 1,
        decimalDigits: 2,
        position: 'before',
        isActive: true,
      });
    }
  }, [currency, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'add') {
        await currencyAdminApi.createRate(formData);
        toast.success(`${formData.currencyName} has been added successfully`);
      } else if (currency) {
        await currencyAdminApi.updateRate(currency.currencyCode, formData);
        toast.success(
          `${formData.currencyName} has been updated successfully`
        );
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} currency`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Currency' : 'Edit Currency'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Add a new currency to the platform'
              : 'Update currency settings and exchange rate'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currencyCode">Currency Code *</Label>
              <Input
                id="currencyCode"
                value={formData.currencyCode}
                onChange={(e) =>
                  setFormData({ ...formData, currencyCode: e.target.value.toUpperCase() })
                }
                placeholder="USD"
                maxLength={3}
                required
                disabled={mode === 'edit'}
              />
              <p className="text-xs text-muted-foreground">ISO 4217 code (3 letters)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyName">Currency Name *</Label>
              <Input
                id="currencyName"
                value={formData.currencyName}
                onChange={(e) => setFormData({ ...formData, currencyName: e.target.value })}
                placeholder="US Dollar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="$"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Exchange Rate (to USD) *</Label>
              <Input
                id="rate"
                type="number"
                step="0.000001"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                placeholder="1.0"
                min={0}
                required
              />
              <p className="text-xs text-muted-foreground">
                1 USD = {formData.rate} {formData.currencyCode || '...'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimalDigits">Decimal Places</Label>
              <Select
                value={formData.decimalDigits.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, decimalDigits: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Symbol Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value: 'before' | 'after') =>
                  setFormData({ ...formData, position: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before ({formData.symbol}100)</SelectItem>
                  <SelectItem value="after">After (100{formData.symbol})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 rounded border-neutral-300"
            />
            <Label htmlFor="isActive">Activate this currency immediately</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === 'add'
                  ? 'Adding...'
                  : 'Updating...'
                : mode === 'add'
                  ? 'Add Currency'
                  : 'Update Currency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCurrenciesPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CurrenciesContent />
      </AdminLayout>
    </AdminRoute>
  );
}

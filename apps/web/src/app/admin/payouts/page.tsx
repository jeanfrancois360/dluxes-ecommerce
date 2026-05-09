'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { toast } from 'sonner';
import {
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Search,
  X,
  Download,
  Printer,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { useDebounce } from '@/hooks/use-debounce';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { api } from '@/lib/api/client';

type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface Payout {
  id: string;
  sellerId: string;
  storeId: string;
  amount: number;
  currency: string;
  commissionCount: number;
  status: PayoutStatus;
  paymentMethod: string;
  periodStart: string;
  periodEnd: string;
  scheduledAt: string;
  processedAt: string | null;
  paymentReference: string | null;
  notes: string | null;
  createdAt: string;
  seller: {
    email: string;
    firstName: string;
    lastName: string;
  };
  store: {
    name: string;
  };
}

interface PayoutScheduleConfig {
  id: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  minPayoutAmount: number;
  holdPeriodDays: number;
  isAutomatic: boolean;
  isActive: boolean;
  lastProcessedAt: string | null;
  nextProcessAt: string | null;
}

interface BackendStats {
  pending: { amount: number | Decimal; count: number };
  processing: { amount: number | Decimal; count: number };
  completed: { amount: number | Decimal; count: number };
  failed: { amount: number | Decimal; count: number };
  total: { amount: number | Decimal; count: number };
}

type Decimal = { toNumber?: () => number };

function PayoutsContent() {
  const t = useTranslations('adminPayouts');
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [schedule, setSchedule] = useState<PayoutScheduleConfig | null>(null);
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [completeDialog, setCompleteDialog] = useState<{
    open: boolean;
    payout: Payout | null;
    reference: string;
    proof: string;
  }>({ open: false, payout: null, reference: '', proof: '' });

  const [scheduleDialog, setScheduleDialog] = useState<{
    open: boolean;
    frequency: string;
    minPayoutAmount: string;
    holdPeriodDays: string;
    isAutomatic: boolean;
  }>({
    open: false,
    frequency: 'WEEKLY',
    minPayoutAmount: '50',
    holdPeriodDays: '7',
    isAutomatic: true,
  });

  useEffect(() => {
    fetchPayouts();
    fetchSchedule();
    fetchBackendStats();
  }, []);

  const fetchPayouts = async () => {
    try {
      const data = await api.get('/payouts/admin/all?limit=100');
      setPayouts(data.data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error(t('toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const data = await api.get('/payouts/schedule');
      setSchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const fetchBackendStats = async () => {
    try {
      const data = await api.get('/payouts/admin/statistics');
      setBackendStats(data);
    } catch (error) {
      console.error('Error fetching payout statistics:', error);
    }
  };

  const openScheduleDialog = () => {
    setScheduleDialog({
      open: true,
      frequency: schedule?.frequency || 'WEEKLY',
      minPayoutAmount: String(schedule?.minPayoutAmount || 50),
      holdPeriodDays: String(schedule?.holdPeriodDays || 7),
      isAutomatic: schedule?.isAutomatic ?? true,
    });
  };

  const handleUpdateSchedule = async () => {
    try {
      await api.put('/payouts/admin/schedule', {
        frequency: scheduleDialog.frequency,
        minPayoutAmount: Number(scheduleDialog.minPayoutAmount),
        holdPeriodDays: Number(scheduleDialog.holdPeriodDays),
        isAutomatic: scheduleDialog.isAutomatic,
      });
      toast.success(t('schedule.updateSuccess'));
      setScheduleDialog((s) => ({ ...s, open: false }));
      fetchSchedule();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error(t('schedule.updateFailed'));
    }
  };

  // Calculate stats — prefer backend aggregate over local (which only covers loaded page)
  const stats = useMemo(() => {
    if (backendStats) {
      const toNum = (v: any) =>
        typeof v === 'object' && v?.toNumber ? v.toNumber() : Number(v || 0);
      return {
        total: toNum(backendStats.total.amount),
        pending: toNum(backendStats.pending.amount),
        pendingCount: backendStats.pending.count,
        processing: toNum(backendStats.processing.amount),
        processingCount: backendStats.processing.count,
        completed: toNum(backendStats.completed.amount),
        completedCount: backendStats.completed.count,
        failed: backendStats.failed.count,
      };
    }
    // Fallback: compute from loaded payouts
    const pending = payouts.filter((p) => p.status === 'PENDING');
    const processing = payouts.filter((p) => p.status === 'PROCESSING');
    const completed = payouts.filter((p) => p.status === 'COMPLETED');
    const failed = payouts.filter((p) => p.status === 'FAILED');
    return {
      total: payouts.reduce((sum, p) => sum + Number(p.amount), 0),
      pending: pending.reduce((sum, p) => sum + Number(p.amount), 0),
      pendingCount: pending.length,
      processing: processing.reduce((sum, p) => sum + Number(p.amount), 0),
      processingCount: processing.length,
      completed: completed.reduce((sum, p) => sum + Number(p.amount), 0),
      completedCount: completed.length,
      failed: failed.length,
    };
  }, [payouts, backendStats]);

  // Get unique payment methods
  const paymentMethods = useMemo(() => {
    const methods = new Set<string>();
    payouts.forEach((p) => {
      if (p.paymentMethod) methods.add(p.paymentMethod);
    });
    return Array.from(methods);
  }, [payouts]);

  // Filter and sort
  const filteredPayouts = useMemo(() => {
    let filtered = [...payouts];

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.seller.email.toLowerCase().includes(search) ||
          `${p.seller.firstName} ${p.seller.lastName}`.toLowerCase().includes(search) ||
          p.store.name.toLowerCase().includes(search) ||
          p.paymentReference?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter((p) => p.paymentMethod === methodFilter);
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        filtered.sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
        break;
      case 'amount_high':
        filtered.sort((a, b) => Number(b.amount) - Number(a.amount));
        break;
      case 'amount_low':
        filtered.sort((a, b) => Number(a.amount) - Number(b.amount));
        break;
      case 'newest':
      default:
        filtered.sort(
          (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        );
    }

    return filtered;
  }, [payouts, debouncedSearch, statusFilter, methodFilter, sortBy]);

  // Bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPayouts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPayouts.map((p) => p.id)));
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
    statusFilter !== 'all' || methodFilter !== 'all' || debouncedSearch !== '';

  const clearAllFilters = () => {
    setStatusFilter('all');
    setMethodFilter('all');
    setSearchQuery('');
  };

  const handleProcessAll = async () => {
    if (!confirm(t('dialog.processAllConfirm'))) return;

    setProcessing(true);
    try {
      const result = await api.post('/payouts/admin/process', {});
      toast.success(
        t('toast.processSuccess', { successful: result.successful, failed: result.failed })
      );
      fetchPayouts();
      fetchBackendStats();
    } catch (error) {
      console.error('Error processing payouts:', error);
      toast.error(t('toast.processFailed'));
    } finally {
      setProcessing(false);
    }
  };

  const handleTriggerSeller = async (sellerId: string) => {
    try {
      await api.post(`/payouts/admin/seller/${sellerId}/trigger`, {});
      toast.success(t('toast.triggerSuccess'));
      fetchPayouts();
      fetchBackendStats();
    } catch (error) {
      console.error('Error triggering payout:', error);
      toast.error(t('toast.triggerFailed'));
    }
  };

  const handleCompletePayout = async () => {
    if (!completeDialog.payout) return;

    try {
      await api.put(`/payouts/admin/${completeDialog.payout.id}/complete`, {
        paymentReference: completeDialog.reference,
        paymentProof: completeDialog.proof || undefined,
      });
      toast.success(t('toast.completeSuccess'));
      setCompleteDialog({ open: false, payout: null, reference: '', proof: '' });
      fetchPayouts();
      fetchBackendStats();
    } catch (error) {
      console.error('Error completing payout:', error);
      toast.error(t('toast.completeFailed'));
    }
  };

  const handleFailPayout = async (payoutId: string) => {
    const reason = prompt(t('dialog.failPrompt'));
    if (!reason) return;

    try {
      await api.put(`/payouts/admin/${payoutId}/fail`, { reason });
      toast.success(t('toast.failSuccess'));
      fetchPayouts();
      fetchBackendStats();
    } catch (error) {
      console.error('Error failing payout:', error);
      toast.error(t('toast.failFailed'));
    }
  };

  // Bulk actions
  const handleBulkExport = () => {
    // Build CSV from selected payouts
    const selected = filteredPayouts.filter((p) => selectedIds.has(p.id));
    const rows = [
      ['ID', 'Seller', 'Store', 'Amount', 'Currency', 'Method', 'Status', 'Scheduled', 'Reference'],
      ...selected.map((p) => [
        p.id,
        p.seller.email,
        p.store.name,
        String(p.amount),
        p.currency,
        p.paymentMethod || '',
        p.status,
        new Date(p.scheduledAt).toISOString(),
        p.paymentReference || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('bulk.exportSuccess', { count: selectedIds.size }));
    setSelectedIds(new Set());
  };

  const handleBulkComplete = async () => {
    const eligible = filteredPayouts.filter((p) => selectedIds.has(p.id) && p.status === 'PENDING');

    if (eligible.length === 0) {
      toast.error(t('bulk.notPendingError'));
      return;
    }

    if (!confirm(t('bulk.completeConfirm', { count: eligible.length }))) return;

    let success = 0;
    let failed = 0;

    for (const p of eligible) {
      try {
        await api.put(`/payouts/admin/${p.id}/complete`, { paymentReference: 'bulk-complete' });
        success++;
      } catch {
        failed++;
      }
    }

    toast.success(t('bulk.failSuccess', { success, failed }));
    setSelectedIds(new Set());
    fetchPayouts();
    fetchBackendStats();
  };

  const handleBulkFail = async () => {
    const reason = prompt(t('bulk.failPrompt', { count: selectedIds.size }));
    if (!reason) return;

    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      const payout = filteredPayouts.find((p) => p.id === id);
      if (payout && (payout.status === 'PENDING' || payout.status === 'PROCESSING')) {
        try {
          await api.put(`/payouts/admin/${id}/fail`, { reason });
          success++;
        } catch {
          failed++;
        }
      }
    }

    toast.success(t('bulk.failSuccess', { success, failed }));
    setSelectedIds(new Set());
    fetchPayouts();
    fetchBackendStats();
  };

  const getStatusBadge = (status: PayoutStatus) => {
    const variants: Record<PayoutStatus, { variant: any; icon: any }> = {
      PENDING: { variant: 'secondary', icon: Clock },
      PROCESSING: { variant: 'default', icon: TrendingUp },
      COMPLETED: { variant: 'default', icon: CheckCircle },
      FAILED: { variant: 'destructive', icon: XCircle },
      CANCELLED: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {t(`status.${status.toLowerCase()}` as any)}
      </Badge>
    );
  };

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-end items-center gap-3">
          <Link href="/admin/payout-settings">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('buttons.payoutSettings')}
            </Button>
          </Link>
          <Button onClick={handleProcessAll} disabled={processing}>
            <DollarSign className="h-4 w-4 mr-2" />
            {processing ? t('buttons.processing') : t('buttons.processAll')}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalPayouts')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatCurrencyAmount(stats.total, 2)}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.transactions', { count: payouts.length })}
              </p>
            </CardContent>
          </Card>

          <Card className={stats.pendingCount > 0 ? 'border-amber-200 bg-amber-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium ${stats.pendingCount > 0 ? 'text-amber-700' : ''}`}
              >
                {t('stats.pending')}
              </CardTitle>
              <Clock
                className={`h-4 w-4 ${stats.pendingCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${stats.pendingCount > 0 ? 'text-amber-700' : ''}`}
              >
                ${formatCurrencyAmount(stats.pending, 2)}
              </div>
              <p
                className={`text-xs ${stats.pendingCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}
              >
                {t('stats.pendingCount', { count: stats.pendingCount })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.processing')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${formatCurrencyAmount(stats.processing, 2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('stats.inProgress', { count: stats.processingCount })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.completed')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${formatCurrencyAmount(stats.completed, 2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('stats.paidOut', { count: stats.completedCount })}
              </p>
            </CardContent>
          </Card>

          <Card className={stats.failed > 0 ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium ${stats.failed > 0 ? 'text-red-700' : ''}`}
              >
                {t('stats.failed')}
              </CardTitle>
              <AlertTriangle
                className={`h-4 w-4 ${stats.failed > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
              />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.failed > 0 ? 'text-red-700' : ''}`}>
                {stats.failed}
              </div>
              <p
                className={`text-xs ${stats.failed > 0 ? 'text-red-600' : 'text-muted-foreground'}`}
              >
                {t('stats.needsAttention')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Configuration */}
        {schedule && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{t('schedule.title')}</CardTitle>
                <CardDescription>{t('schedule.description')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={openScheduleDialog} className="gap-2">
                <Calendar className="h-4 w-4" />
                {t('schedule.edit')}
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">{t('schedule.frequency')}</div>
                <div className="font-medium">{schedule.frequency}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('schedule.minAmount')}</div>
                <div className="font-medium">${schedule.minPayoutAmount}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('schedule.holdPeriod')}</div>
                <div className="font-medium">
                  {t('schedule.days', { count: schedule.holdPeriodDays })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('schedule.nextRun')}</div>
                <div className="font-medium">
                  {schedule.nextProcessAt
                    ? new Date(schedule.nextProcessAt).toLocaleDateString()
                    : t('schedule.notScheduled')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filters.statusLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="PENDING">{t('filters.pending')}</SelectItem>
                <SelectItem value="PROCESSING">{t('filters.processing')}</SelectItem>
                <SelectItem value="COMPLETED">{t('filters.completed')}</SelectItem>
                <SelectItem value="FAILED">{t('filters.failed')}</SelectItem>
                <SelectItem value="CANCELLED">{t('filters.cancelled')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Method Filter */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('filters.paymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allMethods')}</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
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
                <SelectItem value="amount_high">{t('filters.amountHigh')}</SelectItem>
                <SelectItem value="amount_low">{t('filters.amountLow')}</SelectItem>
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
              {methodFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.method')}: {methodFilter}
                  <button
                    onClick={() => setMethodFilter('all')}
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

        {/* Payouts Table */}
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
                          filteredPayouts.length > 0 && selectedIds.size === filteredPayouts.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300"
                      />
                    </TableHead>
                    <TableHead>{t('table.headers.sellerStore')}</TableHead>
                    <TableHead>{t('table.headers.amount')}</TableHead>
                    <TableHead>{t('table.headers.period')}</TableHead>
                    <TableHead>{t('table.headers.commissions')}</TableHead>
                    <TableHead>{t('table.headers.method')}</TableHead>
                    <TableHead>{t('table.headers.status')}</TableHead>
                    <TableHead>{t('table.headers.scheduled')}</TableHead>
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
                  ) : filteredPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        {t('table.noResults')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayouts.map((payout) => (
                      <TableRow
                        key={payout.id}
                        className={selectedIds.has(payout.id) ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(payout.id)}
                            onChange={() => toggleSelect(payout.id)}
                            className="w-4 h-4 rounded border-neutral-300"
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/sellers/${payout.sellerId}`}
                            className="hover:underline"
                          >
                            <div className="font-medium">{payout.store.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {payout.seller.email}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${formatCurrencyAmount(payout.amount, 2)} {payout.currency}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(payout.periodStart).toLocaleDateString()} -{' '}
                          {new Date(payout.periodEnd).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{payout.commissionCount}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payout.paymentMethod || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>{getStatusBadge(payout.status)}</div>
                          {payout.paymentReference && (
                            <div
                              className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-[120px]"
                              title={payout.paymentReference}
                            >
                              {payout.paymentReference}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{new Date(payout.scheduledAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payout.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  setCompleteDialog({
                                    open: true,
                                    payout,
                                    reference: '',
                                    proof: '',
                                  })
                                }
                              >
                                {t('actions.complete')}
                              </Button>
                            )}
                            {(payout.status === 'PENDING' || payout.status === 'PROCESSING') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleFailPayout(payout.id)}
                              >
                                {t('actions.fail')}
                              </Button>
                            )}
                            {payout.status === 'FAILED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTriggerSeller(payout.sellerId)}
                              >
                                {t('actions.retry')}
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
              <span className="font-medium">
                {t('table.selected', { count: selectedIds.size })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-white hover:text-white hover:bg-slate-800"
              >
                {t('actions.clearSelection')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleBulkExport} className="gap-2">
                <Download className="h-4 w-4" />
                {t('actions.export')}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleBulkComplete} className="gap-2">
                <Printer className="h-4 w-4" />
                {t('actions.printReport')}
              </Button>
              <Button
                size="sm"
                onClick={handleBulkComplete}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {t('actions.complete')}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkFail} className="gap-2">
                <XCircle className="h-4 w-4" />
                {t('actions.fail')}
              </Button>
            </div>
          </div>
        )}

        {/* Complete Payout Dialog */}
        <Dialog
          open={completeDialog.open}
          onOpenChange={(open) => setCompleteDialog({ ...completeDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialog.complete.title')}</DialogTitle>
              <DialogDescription>{t('dialog.complete.description')}</DialogDescription>
            </DialogHeader>

            {completeDialog.payout && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('dialog.complete.seller')}
                    </span>
                    <span className="font-medium">{completeDialog.payout.seller.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('dialog.complete.amount')}
                    </span>
                    <span className="font-medium">
                      ${formatCurrencyAmount(completeDialog.payout.amount, 2)}{' '}
                      {completeDialog.payout.currency}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">{t('dialog.complete.referenceLabel')}</Label>
                  <Input
                    id="reference"
                    placeholder={t('dialog.complete.referencePlaceholder')}
                    value={completeDialog.reference}
                    onChange={(e) =>
                      setCompleteDialog({ ...completeDialog, reference: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof">{t('dialog.complete.proofLabel')}</Label>
                  <Input
                    id="proof"
                    placeholder={t('dialog.complete.proofPlaceholder')}
                    value={completeDialog.proof}
                    onChange={(e) =>
                      setCompleteDialog({ ...completeDialog, proof: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setCompleteDialog({ open: false, payout: null, reference: '', proof: '' })
                }
              >
                {t('dialog.complete.cancel')}
              </Button>
              <Button onClick={handleCompletePayout} disabled={!completeDialog.reference}>
                {t('dialog.complete.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Edit Dialog */}
        <Dialog
          open={scheduleDialog.open}
          onOpenChange={(open) => setScheduleDialog((s) => ({ ...s, open }))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('schedule.editTitle')}</DialogTitle>
              <DialogDescription>{t('schedule.editDescription')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">{t('schedule.frequency')}</Label>
                <Select
                  value={scheduleDialog.frequency}
                  onValueChange={(v) => setScheduleDialog((s) => ({ ...s, frequency: v }))}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">{t('schedule.frequencies.daily')}</SelectItem>
                    <SelectItem value="WEEKLY">{t('schedule.frequencies.weekly')}</SelectItem>
                    <SelectItem value="BIWEEKLY">{t('schedule.frequencies.biweekly')}</SelectItem>
                    <SelectItem value="MONTHLY">{t('schedule.frequencies.monthly')}</SelectItem>
                    <SelectItem value="ON_DEMAND">{t('schedule.frequencies.onDemand')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minAmount">{t('schedule.minAmount')}</Label>
                <Input
                  id="minAmount"
                  type="number"
                  min="1"
                  value={scheduleDialog.minPayoutAmount}
                  onChange={(e) =>
                    setScheduleDialog((s) => ({ ...s, minPayoutAmount: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="holdDays">{t('schedule.holdPeriod')}</Label>
                <Input
                  id="holdDays"
                  type="number"
                  min="0"
                  value={scheduleDialog.holdPeriodDays}
                  onChange={(e) =>
                    setScheduleDialog((s) => ({ ...s, holdPeriodDays: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAutomatic"
                  checked={scheduleDialog.isAutomatic}
                  onChange={(e) =>
                    setScheduleDialog((s) => ({ ...s, isAutomatic: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-neutral-300"
                />
                <Label htmlFor="isAutomatic">{t('schedule.automatic')}</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setScheduleDialog((s) => ({ ...s, open: false }))}
              >
                {t('dialog.complete.cancel')}
              </Button>
              <Button onClick={handleUpdateSchedule}>{t('schedule.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function PayoutsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <PayoutsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

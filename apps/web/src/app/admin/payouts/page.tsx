'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@nextpik/ui';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
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
  AlertTriangle,
  Settings,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  MoreHorizontal,
  Zap,
} from 'lucide-react';

// ─── Lightweight DropdownMenu wrappers (not yet in @nextpik/ui) ─────────────
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className = '', sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={`z-50 min-w-[160px] overflow-hidden rounded-md border bg-white p-1 shadow-md animate-in fade-in-0 zoom-in-95 ${className}`}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { destructive?: boolean }
>(({ className = '', destructive, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={`relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${destructive ? 'text-red-600 focus:bg-red-50' : 'text-neutral-700'} ${className}`}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className = '', ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={`-mx-1 my-1 h-px bg-neutral-100 ${className}`}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
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

// ─── Skeleton loading row ──────────────────────────────────────────────────
function TableRowSkeleton() {
  const pulse = 'bg-neutral-200 rounded animate-pulse';
  return (
    <TableRow>
      <TableCell>
        <div className={`w-4 h-4 ${pulse}`} />
      </TableCell>
      <TableCell>
        <div className="space-y-1.5">
          <div className={`h-4 w-32 ${pulse}`} />
          <div className="h-3 w-24 bg-neutral-100 rounded animate-pulse" />
        </div>
      </TableCell>
      <TableCell>
        <div className={`h-4 w-20 ${pulse}`} />
      </TableCell>
      <TableCell>
        <div className={`h-4 w-28 ${pulse}`} />
      </TableCell>
      <TableCell>
        <div className={`h-4 w-8 ${pulse}`} />
      </TableCell>
      <TableCell>
        <div className={`h-5 w-16 ${pulse}`} />
      </TableCell>
      <TableCell>
        <div className={`h-5 w-20 ${pulse}`} />
      </TableCell>
      <TableCell>
        <div className={`h-4 w-20 ${pulse}`} />
      </TableCell>
      <TableCell>
        <div className="flex gap-1.5">
          <div className={`h-8 w-8 ${pulse}`} />
          <div className={`h-8 w-16 ${pulse}`} />
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Payout Detail Flyout ──────────────────────────────────────────────────
function PayoutDetailFlyout({ payout, onClose }: { payout: Payout; onClose: () => void }) {
  const sellerName =
    `${payout.seller.firstName || ''} ${payout.seller.lastName || ''}`.trim() ||
    payout.seller.email;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Payout Details</h2>
            <p className="text-xs text-muted-foreground font-mono">{payout.id.slice(0, 16)}…</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          {/* Status + Amount */}
          <div className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={payout.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-bold">
                {formatCurrencyAmount(payout.amount)} {payout.currency}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Commissions</span>
              <span className="font-medium">{payout.commissionCount}</span>
            </div>
          </div>

          {/* Seller & Store */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Seller
            </p>
            <div className="rounded-xl border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{sellerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{payout.seller.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Store</span>
                <span className="font-medium">{payout.store.name}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payment
            </p>
            <div className="rounded-xl border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">
                  {formatPaymentMethod(payout.paymentMethod) || '—'}
                </span>
              </div>
              {payout.paymentMethod === 'bank_transfer' && payout.status === 'PROCESSING' && (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    This payout requires a manual bank transfer. Use the Complete action once the
                    transfer is sent.
                  </span>
                </div>
              )}
              {payout.paymentReference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs bg-neutral-100 px-2 py-0.5 rounded max-w-[180px] truncate">
                    {payout.paymentReference}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled</span>
                <span>{new Date(payout.scheduledAt).toLocaleString()}</span>
              </div>
              {payout.processedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processed</span>
                  <span>{new Date(payout.processedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period</span>
                <span>
                  {new Date(payout.periodStart).toLocaleDateString()} –{' '}
                  {new Date(payout.periodEnd).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payout.notes && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notes
              </p>
              <div className="rounded-xl border p-4 text-sm text-neutral-700 leading-relaxed bg-neutral-50">
                {payout.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge (extracted for reuse) ────────────────────────────────────
function StatusBadge({ status }: { status: PayoutStatus }) {
  const config: Record<
    PayoutStatus,
    { className: string; icon: React.ElementType; label: string }
  > = {
    PENDING: {
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
      label: 'Pending',
    },
    PROCESSING: {
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: TrendingUp,
      label: 'Processing',
    },
    COMPLETED: {
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
      label: 'Completed',
    },
    FAILED: {
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
      label: 'Failed',
    },
    CANCELLED: {
      className: 'bg-neutral-100 text-neutral-500 border-neutral-200',
      icon: XCircle,
      label: 'Cancelled',
    },
  };
  const { className, icon: Icon, label } = config[status] ?? config.PENDING;
  return (
    <Badge variant="outline" className={`gap-1 font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ─── Payment method formatter ───────────────────────────────────────────────
function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return 'N/A';
  const map: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    STRIPE_CONNECT: 'Stripe Connect',
    PAYPAL: 'PayPal',
    paypal: 'PayPal',
    stripe_connect: 'Stripe Connect',
    stripe: 'Stripe',
    manual: 'Manual',
  };
  return map[method] ?? method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Main page ─────────────────────────────────────────────────────────────
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

  // Detail flyout
  const [detailPayout, setDetailPayout] = useState<Payout | null>(null);

  // Expanded notes (inline row expansion)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Date range filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Last-updated timestamp (set after every successful fetch)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Execute transfers + sync statuses
  const [executingTransfers, setExecutingTransfers] = useState(false);
  const [syncingStatuses, setSyncingStatuses] = useState(false);
  const [executeDialog, setExecuteDialog] = useState(false);
  const [syncDialog, setSyncDialog] = useState(false);

  // Complete dialog
  const [completeDialog, setCompleteDialog] = useState<{
    open: boolean;
    payout: Payout | null;
    reference: string;
    proof: string;
  }>({ open: false, payout: null, reference: '', proof: '' });

  // Fail dialog — replaces browser prompt()
  const [failDialog, setFailDialog] = useState<{
    open: boolean;
    payoutId: string | null;
    reason: string;
    isBulk: boolean;
    bulkIds: string[];
  }>({ open: false, payoutId: null, reason: '', isBulk: false, bulkIds: [] });

  // Process-all confirmation dialog — replaces browser confirm()
  const [processAllDialog, setProcessAllDialog] = useState(false);

  // Schedule dialog
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
      setPayouts(Array.isArray(data) ? data : data?.data || []);
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
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching payout statistics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    await Promise.all([fetchPayouts(), fetchSchedule(), fetchBackendStats()]);
    setRefreshing(false);
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
        totalCount: backendStats.total.count,
        pending: toNum(backendStats.pending.amount),
        pendingCount: backendStats.pending.count,
        processing: toNum(backendStats.processing.amount),
        processingCount: backendStats.processing.count,
        completed: toNum(backendStats.completed.amount),
        completedCount: backendStats.completed.count,
        failed: backendStats.failed.count,
        failedAmount: toNum(backendStats.failed.amount),
      };
    }
    const pending = payouts.filter((p) => p.status === 'PENDING');
    const processing = payouts.filter((p) => p.status === 'PROCESSING');
    const completed = payouts.filter((p) => p.status === 'COMPLETED');
    const failed = payouts.filter((p) => p.status === 'FAILED');
    return {
      total: payouts.reduce((sum, p) => sum + Number(p.amount), 0),
      totalCount: payouts.length,
      pending: pending.reduce((sum, p) => sum + Number(p.amount), 0),
      pendingCount: pending.length,
      processing: processing.reduce((sum, p) => sum + Number(p.amount), 0),
      processingCount: processing.length,
      completed: completed.reduce((sum, p) => sum + Number(p.amount), 0),
      completedCount: completed.length,
      failed: failed.length,
      failedAmount: failed.reduce((sum, p) => sum + Number(p.amount), 0),
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

    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((p) => new Date(p.scheduledAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      filtered = filtered.filter((p) => new Date(p.scheduledAt) <= to);
    }

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

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter((p) => p.paymentMethod === methodFilter);
    }

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

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    methodFilter !== 'all' ||
    debouncedSearch !== '' ||
    dateFrom !== '' ||
    dateTo !== '';

  const clearAllFilters = () => {
    setStatusFilter('all');
    setMethodFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  // ── Actions ────────────────────────────────────────────────────────────

  const handleProcessAll = async () => {
    setProcessAllDialog(false);
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

  const handleExecuteTransfers = async () => {
    setExecuteDialog(false);
    setExecutingTransfers(true);
    try {
      const result = await api.post('/payouts/admin/process-pending', {});
      const succeeded = result.processed ?? result.succeeded ?? 0;
      const failed = result.failed ?? 0;
      toast.success(
        `Transfers executed: ${succeeded} processed${failed > 0 ? `, ${failed} failed` : ''}`
      );
      fetchPayouts();
      fetchBackendStats();
    } catch (error) {
      console.error('Error executing transfers:', error);
      toast.error('Failed to execute transfers. Check the console for details.');
    } finally {
      setExecutingTransfers(false);
    }
  };

  const handleSyncStatuses = async () => {
    setSyncDialog(false);
    setSyncingStatuses(true);
    try {
      const result = await api.post('/payouts/admin/update-statuses', {});
      const updated = result.updated ?? result.synced ?? 0;
      toast.success(`Statuses synced: ${updated} payout${updated !== 1 ? 's' : ''} updated`);
      fetchPayouts();
      fetchBackendStats();
    } catch (error) {
      console.error('Error syncing statuses:', error);
      toast.error('Failed to sync statuses. Check the console for details.');
    } finally {
      setSyncingStatuses(false);
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

  const openFailDialog = (payoutId: string) => {
    setFailDialog({ open: true, payoutId, reason: '', isBulk: false, bulkIds: [] });
  };

  const openBulkFailDialog = () => {
    const eligible = filteredPayouts.filter(
      (p) => selectedIds.has(p.id) && (p.status === 'PENDING' || p.status === 'PROCESSING')
    );
    if (eligible.length === 0) {
      toast.error(t('bulk.notPendingError'));
      return;
    }
    setFailDialog({
      open: true,
      payoutId: null,
      reason: '',
      isBulk: true,
      bulkIds: eligible.map((p) => p.id),
    });
  };

  const handleConfirmFail = async () => {
    if (!failDialog.reason.trim()) return;

    if (failDialog.isBulk) {
      let success = 0;
      let failed = 0;
      for (const id of failDialog.bulkIds) {
        try {
          await api.put(`/payouts/admin/${id}/fail`, { reason: failDialog.reason });
          success++;
        } catch {
          failed++;
        }
      }
      toast.success(t('bulk.failSuccess', { success, failed }));
      setSelectedIds(new Set());
    } else {
      try {
        await api.put(`/payouts/admin/${failDialog.payoutId}/fail`, {
          reason: failDialog.reason,
        });
        toast.success(t('toast.failSuccess'));
      } catch (error) {
        console.error('Error failing payout:', error);
        toast.error(t('toast.failFailed'));
      }
    }

    setFailDialog({ open: false, payoutId: null, reason: '', isBulk: false, bulkIds: [] });
    fetchPayouts();
    fetchBackendStats();
  };

  // Bulk export (CSV download)
  const handleBulkExport = () => {
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

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <TooltipProvider>
          <div className="flex justify-end items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}

            {/* Refresh */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>

            {/* Payout Settings */}
            <Link href="/admin/payout-settings">
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <Settings className="h-3.5 w-3.5" />
                {t('buttons.payoutSettings')}
              </Button>
            </Link>

            {/* Sync Statuses */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSyncDialog(true)}
                  disabled={syncingStatuses}
                  className="gap-1.5 h-8 text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncingStatuses ? 'animate-spin' : ''}`} />
                  {syncingStatuses ? 'Syncing…' : 'Sync'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Poll Stripe & PayPal for PROCESSING payout updates</TooltipContent>
            </Tooltip>

            {/* Execute Transfers */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExecuteDialog(true)}
                  disabled={executingTransfers}
                  className="gap-1.5 h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Zap className={`h-3.5 w-3.5 ${executingTransfers ? 'animate-pulse' : ''}`} />
                  {executingTransfers ? 'Executing…' : 'Execute'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send funds for all PENDING payouts</TooltipContent>
            </Tooltip>

            {/* Process All */}
            <Button
              size="sm"
              onClick={() => setProcessAllDialog(true)}
              disabled={processing}
              className="h-8 text-xs gap-1.5"
            >
              <DollarSign className="h-3.5 w-3.5" />
              {processing ? t('buttons.processing') : t('buttons.processAll')}
            </Button>
          </div>
        </TooltipProvider>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalPayouts')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrencyAmount(stats.total)}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.transactions', { count: stats.totalCount })}
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
                {formatCurrencyAmount(stats.pending)}
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
                {formatCurrencyAmount(stats.processing)}
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
                {formatCurrencyAmount(stats.completed)}
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
                <div className="font-medium">{formatCurrencyAmount(schedule.minPayoutAmount)}</div>
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
        <div className="rounded-lg border bg-white">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('filters.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="Status" />
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

            {/* Method */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allMethods')}</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {formatPaymentMethod(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('filters.newestFirst')}</SelectItem>
                <SelectItem value="oldest">{t('filters.oldestFirst')}</SelectItem>
                <SelectItem value="amount_high">{t('filters.amountHigh')}</SelectItem>
                <SelectItem value="amount_low">{t('filters.amountLow')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[130px] h-8 text-sm"
                title="From date"
              />
              <span className="text-muted-foreground text-xs">–</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[130px] h-8 text-sm"
                title="To date"
              />
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs text-muted-foreground gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2.5 border-t pt-2">
              {debouncedSearch && (
                <Badge variant="secondary" className="gap-1 text-xs font-normal">
                  &ldquo;{debouncedSearch}&rdquo;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-xs font-normal">
                  {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              )}
              {methodFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-xs font-normal">
                  {formatPaymentMethod(methodFilter)}
                  <button
                    onClick={() => setMethodFilter('all')}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              )}
              {dateFrom && (
                <Badge variant="secondary" className="gap-1 text-xs font-normal">
                  From {dateFrom}
                  <button onClick={() => setDateFrom('')} className="ml-0.5 hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              )}
              {dateTo && (
                <Badge variant="secondary" className="gap-1 text-xs font-normal">
                  To {dateTo}
                  <button onClick={() => setDateTo('')} className="ml-0.5 hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('table.title')}</CardTitle>
            <CardDescription>
              {formatNumber(filteredPayouts.length)} payout
              {filteredPayouts.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' (filtered)' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 py-2.5">
                      <input
                        type="checkbox"
                        checked={
                          filteredPayouts.length > 0 && selectedIds.size === filteredPayouts.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300"
                      />
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {t('table.headers.sellerStore')}
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {t('table.headers.amount')}
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {t('table.headers.period')}
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide w-10 text-center">
                      {t('table.headers.commissions')}
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {t('table.headers.method')}
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {t('table.headers.status')}
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {t('table.headers.scheduled')}
                    </TableHead>
                    <TableHead className="py-2.5 w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : filteredPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-16">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-neutral-400" />
                          </div>
                          <p className="text-sm font-medium text-neutral-700">
                            {hasActiveFilters ? 'No payouts match your filters' : 'No payouts yet'}
                          </p>
                          {hasActiveFilters && (
                            <button
                              onClick={clearAllFilters}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Clear all filters
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayouts.map((payout) => (
                      <React.Fragment key={payout.id}>
                        <TableRow
                          className={`${selectedIds.has(payout.id) ? 'bg-blue-50/50' : ''} group`}
                        >
                          <TableCell className="py-2.5 w-10">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(payout.id)}
                              onChange={() => toggleSelect(payout.id)}
                              className="w-4 h-4 rounded border-neutral-300"
                            />
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Link
                              href={`/admin/sellers/${payout.sellerId}`}
                              className="hover:underline"
                            >
                              <div className="text-sm font-medium text-neutral-900">
                                {payout.store.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {payout.seller.email}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="py-2.5 font-semibold text-sm tabular-nums">
                            {formatCurrencyAmount(payout.amount)}{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                              {payout.currency}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(payout.periodStart).toLocaleDateString()} –{' '}
                            {new Date(payout.periodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-2.5 text-center text-sm">
                            {payout.commissionCount}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-xs font-normal">
                                  {formatPaymentMethod(payout.paymentMethod)}
                                </Badge>
                                {payout.paymentMethod === 'bank_transfer' &&
                                  payout.status === 'PROCESSING' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0 cursor-default" />
                                      </TooltipTrigger>
                                      <TooltipContent>Manual bank transfer required</TooltipContent>
                                    </Tooltip>
                                  )}
                              </div>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <StatusBadge status={payout.status} />
                            {payout.paymentReference && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-[100px] cursor-default">
                                      {payout.paymentReference}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{payout.paymentReference}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(payout.scheduledAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <div className="flex items-center gap-0.5">
                                {/* View details — always visible */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => setDetailPayout(payout)}
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View details</TooltipContent>
                                </Tooltip>

                                {/* Notes toggle */}
                                {payout.notes && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => toggleNotes(payout.id)}
                                      >
                                        {expandedNotes.has(payout.id) ? (
                                          <ChevronUp className="h-3.5 w-3.5" />
                                        ) : (
                                          <ChevronDown className="h-3.5 w-3.5 text-amber-500" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {expandedNotes.has(payout.id) ? 'Hide notes' : 'Show notes'}
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Action dropdown — only for actionable statuses */}
                                {(payout.status === 'PENDING' ||
                                  payout.status === 'PROCESSING' ||
                                  payout.status === 'FAILED') && (
                                  <DropdownMenu>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>Actions</TooltipContent>
                                    </Tooltip>
                                    <DropdownMenuContent align="end">
                                      {(payout.status === 'PENDING' ||
                                        payout.status === 'PROCESSING') && (
                                        <DropdownMenuItem
                                          onSelect={() =>
                                            setCompleteDialog({
                                              open: true,
                                              payout,
                                              reference: '',
                                              proof: '',
                                            })
                                          }
                                        >
                                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                          {t('actions.complete')}
                                        </DropdownMenuItem>
                                      )}
                                      {(payout.status === 'FAILED' ||
                                        payout.status === 'PROCESSING') && (
                                        <DropdownMenuItem
                                          onSelect={() => handleTriggerSeller(payout.sellerId)}
                                        >
                                          <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                                          {t('actions.retry')}
                                        </DropdownMenuItem>
                                      )}
                                      {(payout.status === 'PENDING' ||
                                        payout.status === 'PROCESSING') && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            destructive
                                            onSelect={() => openFailDialog(payout.id)}
                                          >
                                            <XCircle className="h-3.5 w-3.5" />
                                            {t('actions.fail')}
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>

                        {/* Inline notes expansion row */}
                        {expandedNotes.has(payout.id) && payout.notes && (
                          <TableRow key={`${payout.id}-notes`} className="bg-amber-50">
                            <TableCell />
                            <TableCell colSpan={8} className="py-2">
                              <div className="flex items-start gap-2 text-sm text-amber-800">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                                <span className="leading-relaxed">{payout.notes}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
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
              <span className="text-slate-400 text-sm hidden sm:inline">
                {formatCurrencyAmount(
                  filteredPayouts
                    .filter((p) => selectedIds.has(p.id))
                    .reduce((sum, p) => sum + Number(p.amount), 0)
                )}
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
              <Button
                size="sm"
                onClick={handleBulkComplete}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {t('actions.complete')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={openBulkFailDialog}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                {t('actions.fail')}
              </Button>
            </div>
          </div>
        )}

        {/* ── Process All Confirmation Dialog ─────────────────────────────── */}
        <Dialog open={processAllDialog} onOpenChange={setProcessAllDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process All Pending Payouts</DialogTitle>
              <DialogDescription>
                This will attempt to process all{' '}
                <span className="font-semibold text-foreground">{stats.pendingCount} pending</span>{' '}
                payout{stats.pendingCount !== 1 ? 's' : ''} totalling{' '}
                <span className="font-semibold text-foreground">
                  {formatCurrencyAmount(stats.pending)}
                </span>
                . Stripe and PayPal payouts will be submitted automatically. Bank transfers will be
                moved to <em>Processing</em> for manual completion.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProcessAllDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessAll}>Confirm — Process All</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Execute Transfers Confirmation Dialog ───────────────────────── */}
        <Dialog open={executeDialog} onOpenChange={setExecuteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Execute Transfers</DialogTitle>
              <DialogDescription>
                This will send funds for all{' '}
                <span className="font-semibold text-foreground">{stats.pendingCount} pending</span>{' '}
                payout{stats.pendingCount !== 1 ? 's' : ''} (
                <span className="font-semibold text-foreground">
                  {formatCurrencyAmount(stats.pending)}
                </span>
                ) via Stripe Connect or PayPal. Bank transfers will be moved to <em>Processing</em>{' '}
                for manual completion.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExecuteDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleExecuteTransfers}
                disabled={stats.pendingCount === 0}
              >
                Confirm — Execute Transfers
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Sync Statuses Confirmation Dialog ───────────────────────────── */}
        <Dialog open={syncDialog} onOpenChange={setSyncDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sync Payout Statuses</DialogTitle>
              <DialogDescription>
                This will poll Stripe Connect and PayPal for the latest status of all{' '}
                <span className="font-semibold text-foreground">
                  {stats.processingCount} processing
                </span>{' '}
                payout{stats.processingCount !== 1 ? 's' : ''} and mark them <em>Completed</em> or{' '}
                <em>Failed</em> accordingly.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSyncDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSyncStatuses} disabled={stats.processingCount === 0}>
                Confirm — Sync Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Fail Payout Dialog ───────────────────────────────────────────── */}
        <Dialog
          open={failDialog.open}
          onOpenChange={(open) =>
            setFailDialog((d) => ({ ...d, open, reason: open ? d.reason : '' }))
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {failDialog.isBulk
                  ? `Fail ${failDialog.bulkIds.length} Payout${failDialog.bulkIds.length !== 1 ? 's' : ''}`
                  : 'Mark Payout as Failed'}
              </DialogTitle>
              <DialogDescription>
                Provide a reason. The seller will be notified and their commissions will be unlinked
                so they are included in the next payout cycle.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="fail-reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="fail-reason"
                placeholder="e.g. Invalid bank account number, PayPal email not verified…"
                value={failDialog.reason}
                onChange={(e) => setFailDialog((d) => ({ ...d, reason: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setFailDialog({
                    open: false,
                    payoutId: null,
                    reason: '',
                    isBulk: false,
                    bulkIds: [],
                  })
                }
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmFail}
                disabled={!failDialog.reason.trim()}
              >
                {failDialog.isBulk ? 'Fail All Selected' : 'Mark as Failed'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Complete Payout Dialog ───────────────────────────────────────── */}
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
                      {formatCurrencyAmount(completeDialog.payout.amount)}{' '}
                      {completeDialog.payout.currency}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">
                    {t('dialog.complete.referenceLabel')}{' '}
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="reference"
                    placeholder={
                      completeDialog.payout?.paymentMethod === 'bank_transfer'
                        ? 'Wire transfer ref / SWIFT ID / confirmation #'
                        : t('dialog.complete.referencePlaceholder')
                    }
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
              <Button onClick={handleCompletePayout}>{t('dialog.complete.confirm')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Schedule Edit Dialog ─────────────────────────────────────────── */}
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

      {/* ── Payout Detail Flyout ──────────────────────────────────────────── */}
      {detailPayout && (
        <PayoutDetailFlyout payout={detailPayout} onClose={() => setDetailPayout(null)} />
      )}
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

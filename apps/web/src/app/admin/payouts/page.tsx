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
} from 'lucide-react';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { useDebounce } from '@/hooks/use-debounce';

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

function PayoutsContent() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [schedule, setSchedule] = useState<PayoutScheduleConfig | null>(null);
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

  useEffect(() => {
    fetchPayouts();
    fetchSchedule();
  }, []);

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/v1/payouts/admin/all?limit=50', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/v1/payouts/schedule');
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
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
  }, [payouts]);

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
    if (!confirm('Process all pending payouts now?')) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/v1/payouts/admin/process', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `Processed ${result.successful} payouts successfully (${result.failed} failed)`
        );
        fetchPayouts();
      } else {
        toast.error('Failed to process payouts');
      }
    } catch (error) {
      console.error('Error processing payouts:', error);
      toast.error('Failed to process payouts');
    } finally {
      setProcessing(false);
    }
  };

  const handleTriggerSeller = async (sellerId: string) => {
    try {
      const response = await fetch(`/api/v1/payouts/admin/seller/${sellerId}/trigger`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Payout triggered successfully');
        fetchPayouts();
      } else {
        toast.error('Failed to trigger payout');
      }
    } catch (error) {
      console.error('Error triggering payout:', error);
      toast.error('Failed to trigger payout');
    }
  };

  const handleCompletePayout = async () => {
    if (!completeDialog.payout) return;

    try {
      const response = await fetch(`/api/v1/payouts/admin/${completeDialog.payout.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          paymentReference: completeDialog.reference,
          paymentProof: completeDialog.proof || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Payout marked as completed');
        setCompleteDialog({ open: false, payout: null, reference: '', proof: '' });
        fetchPayouts();
      } else {
        toast.error('Failed to complete payout');
      }
    } catch (error) {
      console.error('Error completing payout:', error);
      toast.error('Failed to complete payout');
    }
  };

  const handleFailPayout = async (payoutId: string) => {
    const reason = prompt('Enter reason for failure:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/v1/payouts/admin/${payoutId}/fail`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast.success('Payout marked as failed');
        fetchPayouts();
      } else {
        toast.error('Failed to update payout');
      }
    } catch (error) {
      console.error('Error failing payout:', error);
      toast.error('Failed to update payout');
    }
  };

  // Bulk actions
  const handleBulkExport = () => {
    toast.success(`Exporting ${selectedIds.size} payouts`);
    setSelectedIds(new Set());
  };

  const handleBulkComplete = async () => {
    if (!confirm(`Mark ${selectedIds.size} payouts as completed?`)) return;

    const eligiblePayouts = filteredPayouts.filter(
      (p) => selectedIds.has(p.id) && p.status === 'PENDING'
    );

    if (eligiblePayouts.length === 0) {
      toast.error('Selected payouts are not pending');
      return;
    }

    toast.success('Please complete payouts individually with payment references');
    setSelectedIds(new Set());
  };

  const handleBulkFail = async () => {
    const reason = prompt(`Enter reason for failing ${selectedIds.size} payouts:`);
    if (!reason) return;

    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      const payout = filteredPayouts.find((p) => p.id === id);
      if (payout && (payout.status === 'PENDING' || payout.status === 'PROCESSING')) {
        try {
          const response = await fetch(`/api/v1/payouts/admin/${id}/fail`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ reason }),
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

    toast.success(`Failed ${success} payouts (${failed} errors)`);
    setSelectedIds(new Set());
    fetchPayouts();
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
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage seller payouts and schedule automated payments
          </p>
        </div>
        <Button onClick={handleProcessAll} disabled={processing}>
          <DollarSign className="h-4 w-4 mr-2" />
          {processing ? 'Processing...' : 'Process All Payouts'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCurrencyAmount(stats.total, 2)}</div>
            <p className="text-xs text-muted-foreground">{payouts.length} transactions</p>
          </CardContent>
        </Card>

        <Card className={stats.pendingCount > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-sm font-medium ${stats.pendingCount > 0 ? 'text-amber-700' : ''}`}
            >
              Pending
            </CardTitle>
            <Clock
              className={`h-4 w-4 ${stats.pendingCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.pendingCount > 0 ? 'text-amber-700' : ''}`}>
              ${formatCurrencyAmount(stats.pending, 2)}
            </div>
            <p
              className={`text-xs ${stats.pendingCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}
            >
              {stats.pendingCount} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${formatCurrencyAmount(stats.processing, 2)}
            </div>
            <p className="text-xs text-muted-foreground">{stats.processingCount} in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${formatCurrencyAmount(stats.completed, 2)}
            </div>
            <p className="text-xs text-muted-foreground">{stats.completedCount} paid out</p>
          </CardContent>
        </Card>

        <Card className={stats.failed > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-sm font-medium ${stats.failed > 0 ? 'text-red-700' : ''}`}
            >
              Failed
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
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Configuration */}
      {schedule && (
        <Card>
          <CardHeader>
            <CardTitle>Payout Schedule</CardTitle>
            <CardDescription>Current automated payout configuration</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Frequency</div>
              <div className="font-medium">{schedule.frequency}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Min Amount</div>
              <div className="font-medium">${schedule.minPayoutAmount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Hold Period</div>
              <div className="font-medium">{schedule.holdPeriodDays} days</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Next Run</div>
              <div className="font-medium">
                {schedule.nextProcessAt
                  ? new Date(schedule.nextProcessAt).toLocaleDateString()
                  : 'Not scheduled'}
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
                placeholder="Search by seller, store, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Method Filter */}
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
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
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="amount_high">Amount (High)</SelectItem>
              <SelectItem value="amount_low">Amount (Low)</SelectItem>
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
            {methodFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Method: {methodFilter}
                <button
                  onClick={() => setMethodFilter('all')}
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

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>All seller payouts and their status</CardDescription>
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
                  <TableHead>Seller/Store</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Commissions</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading payouts...
                    </TableCell>
                  </TableRow>
                ) : filteredPayouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No payouts found
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
                        <div>
                          <div className="font-medium">{payout.store.name}</div>
                          <div className="text-sm text-muted-foreground">{payout.seller.email}</div>
                        </div>
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
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
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
                              Complete
                            </Button>
                          )}
                          {(payout.status === 'PENDING' || payout.status === 'PROCESSING') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleFailPayout(payout.id)}
                            >
                              Fail
                            </Button>
                          )}
                          {payout.status === 'FAILED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTriggerSeller(payout.sellerId)}
                            >
                              Retry
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
            <Button variant="secondary" size="sm" onClick={handleBulkComplete} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
            <Button
              size="sm"
              onClick={handleBulkComplete}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkFail} className="gap-2">
              <XCircle className="h-4 w-4" />
              Fail
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
            <DialogTitle>Complete Payout</DialogTitle>
            <DialogDescription>
              Mark this payout as completed after transferring funds to the seller
            </DialogDescription>
          </DialogHeader>

          {completeDialog.payout && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Seller:</span>
                  <span className="font-medium">{completeDialog.payout.seller.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    ${formatCurrencyAmount(completeDialog.payout.amount, 2)}{' '}
                    {completeDialog.payout.currency}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Payment Reference *</Label>
                <Input
                  id="reference"
                  placeholder="BANK-TXN-12345"
                  value={completeDialog.reference}
                  onChange={(e) =>
                    setCompleteDialog({ ...completeDialog, reference: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof">Payment Proof (URL)</Label>
                <Input
                  id="proof"
                  placeholder="https://..."
                  value={completeDialog.proof}
                  onChange={(e) => setCompleteDialog({ ...completeDialog, proof: e.target.value })}
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
              Cancel
            </Button>
            <Button onClick={handleCompletePayout} disabled={!completeDialog.reference}>
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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

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
import { ShieldCheck, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
type EscrowStatus = 'HELD' | 'PENDING_RELEASE' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';

interface EscrowTransaction {
  id: string;
  orderId: string;
  sellerId: string;
  storeId: string;
  totalAmount: number;
  platformFee: number;
  sellerAmount: number;
  currency: string;
  status: EscrowStatus;
  deliveryConfirmed: boolean;
  deliveryConfirmedAt: string | null;
  holdPeriodDays: number;
  autoReleaseAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    status: string;
  };
  seller: {
    email: string;
    firstName: string;
    lastName: string;
  };
  store: {
    name: string;
    slug: string;
  };
}

interface EscrowStatistics {
  held: {
    amount: number;
    sellerAmount: number;
    platformFee: number;
    count: number;
  };
  pendingRelease: {
    amount: number;
    sellerAmount: number;
    platformFee: number;
    count: number;
  };
  released: {
    amount: number;
    sellerAmount: number;
    platformFee: number;
    count: number;
  };
  refunded: {
    amount: number;
    sellerAmount: number;
    platformFee: number;
    count: number;
  };
  disputed: {
    amount: number;
    sellerAmount: number;
    platformFee: number;
    count: number;
  };
}

function EscrowManagementContent() {
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [statistics, setStatistics] = useState<EscrowStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransaction | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'release' | 'refund' | null;
    reason?: string;
  }>({ open: false, action: null });

  useEffect(() => {
    fetchEscrows();
    fetchStatistics();
  }, [statusFilter]);

  const fetchEscrows = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/escrow?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEscrows(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching escrows:', error);
      toast.error('Failed to load escrow transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/escrow/statistics', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!selectedEscrow) return;

    try {
      const response = await fetch(`/api/admin/escrow/${selectedEscrow.id}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          releasedBy: 'admin', // TODO: Get actual admin ID
        }),
      });

      if (response.ok) {
        toast.success('Escrow funds released to seller');
        setActionDialog({ open: false, action: null });
        fetchEscrows();
        fetchStatistics();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to release escrow');
      }
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast.error('Failed to release escrow');
    }
  };

  const handleRefundEscrow = async () => {
    if (!selectedEscrow || !actionDialog.reason) return;

    try {
      const response = await fetch(`/api/admin/escrow/${selectedEscrow.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          refundReason: actionDialog.reason,
        }),
      });

      if (response.ok) {
        toast.success('Escrow funds refunded to buyer');
        setActionDialog({ open: false, action: null, reason: '' });
        fetchEscrows();
        fetchStatistics();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to refund escrow');
      }
    } catch (error) {
      console.error('Error refunding escrow:', error);
      toast.error('Failed to refund escrow');
    }
  };

  const getStatusBadge = (status: EscrowStatus) => {
    const variants: Record<EscrowStatus, { variant: any; icon: any }> = {
      HELD: { variant: 'secondary', icon: Clock },
      PENDING_RELEASE: { variant: 'default', icon: AlertCircle },
      RELEASED: { variant: 'default', icon: CheckCircle },
      REFUNDED: { variant: 'destructive', icon: XCircle },
      DISPUTED: { variant: 'destructive', icon: AlertCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredEscrows = escrows.filter((escrow) => {
    const matchesSearch =
      escrow.order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.seller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.store.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Escrow Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage escrow transactions and release funds to sellers
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Held</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${statistics.held.amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.held.count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Release</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${statistics.pendingRelease.amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.pendingRelease.count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Released</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${statistics.released.amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.released.count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refunded</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${statistics.refunded.amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.refunded.count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fee</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(
                  statistics.held.platformFee +
                  statistics.pendingRelease.platformFee +
                  statistics.released.platformFee
                ).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total commission</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Escrow Transactions</CardTitle>
          <CardDescription>
            View and manage all escrow transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search by order number, seller, or store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="HELD">Held</SelectItem>
                <SelectItem value="PENDING_RELEASE">Pending Release</SelectItem>
                <SelectItem value="RELEASED">Released</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="DISPUTED">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Seller/Store</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Platform Fee</TableHead>
                  <TableHead>Seller Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEscrows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No escrow transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEscrows.map((escrow) => (
                    <TableRow key={escrow.id}>
                      <TableCell className="font-medium">
                        {escrow.order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{escrow.store.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {escrow.seller.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ${formatCurrencyAmount(escrow.totalAmount, 2)} {escrow.currency}
                      </TableCell>
                      <TableCell>
                        ${formatCurrencyAmount(escrow.platformFee, 2)}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${formatCurrencyAmount(escrow.sellerAmount, 2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(escrow.status)}</TableCell>
                      <TableCell>
                        {new Date(escrow.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {(escrow.status === 'HELD' || escrow.status === 'PENDING_RELEASE') && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedEscrow(escrow);
                                  setActionDialog({ open: true, action: 'release' });
                                }}
                              >
                                Release
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedEscrow(escrow);
                                  setActionDialog({ open: true, action: 'refund', reason: '' });
                                }}
                              >
                                Refund
                              </Button>
                            </>
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

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ open, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'release' ? 'Release Escrow' : 'Refund Escrow'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'release'
                ? 'This will release the funds to the seller. This action cannot be undone.'
                : 'This will refund the funds to the buyer. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {selectedEscrow && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Order:</span>
                  <span className="font-medium">{selectedEscrow.order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Seller:</span>
                  <span className="font-medium">{selectedEscrow.seller.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    ${actionDialog.action === 'release'
                      ? formatCurrencyAmount(selectedEscrow.sellerAmount, 2)
                      : formatCurrencyAmount(selectedEscrow.totalAmount, 2)} {selectedEscrow.currency}
                  </span>
                </div>
              </div>

              {actionDialog.action === 'refund' && (
                <div>
                  <label className="text-sm font-medium">Refund Reason</label>
                  <Input
                    placeholder="Enter reason for refund..."
                    value={actionDialog.reason || ''}
                    onChange={(e) =>
                      setActionDialog({ ...actionDialog, reason: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: null })}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.action === 'release' ? 'default' : 'destructive'}
              onClick={actionDialog.action === 'release' ? handleReleaseEscrow : handleRefundEscrow}
              disabled={actionDialog.action === 'refund' && !actionDialog.reason}
            >
              {actionDialog.action === 'release' ? 'Release Funds' : 'Refund to Buyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EscrowManagementPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <EscrowManagementContent />
      </AdminLayout>
    </AdminRoute>
  );
}

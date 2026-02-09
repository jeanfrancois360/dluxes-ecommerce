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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Search, DollarSign, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast, standardToasts } from '@/lib/utils/toast';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
interface DeliveryPayout {
  id: string;
  providerId: string;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  deliveryCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentMethod?: string;
  paymentReference?: string;
  processedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  provider: {
    name: string;
    contactEmail: string;
  };
}

interface ProcessPayoutData {
  paymentMethod: string;
  paymentReference: string;
  notes: string;
}

function DeliveryPayoutsContent() {
  const [payouts, setPayouts] = useState<DeliveryPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayout, setSelectedPayout] = useState<DeliveryPayout | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processData, setProcessData] = useState<ProcessPayoutData>({
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: '',
    notes: '',
  });
  const [stats, setStats] = useState({
    totalPending: 0,
    totalProcessing: 0,
    totalCompleted: 0,
    pendingAmount: 0,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await axios.get(`${API_URL}/delivery-payouts`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const data = response.data.data || response.data;
      setPayouts(data);
      calculateStats(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (payoutsData: DeliveryPayout[]) => {
    setStats({
      totalPending: payoutsData.filter((p) => p.status === 'PENDING').length,
      totalProcessing: payoutsData.filter((p) => p.status === 'PROCESSING').length,
      totalCompleted: payoutsData.filter((p) => p.status === 'COMPLETED').length,
      pendingAmount: payoutsData
        .filter((p) => p.status === 'PENDING')
        .reduce((sum, p) => sum + Number(p.amount), 0),
    });
  };

  const handleProcessPayout = async () => {
    if (!selectedPayout) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/delivery-payouts/${selectedPayout.id}/process`, processData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Payout processed successfully');
      setIsProcessDialogOpen(false);
      setSelectedPayout(null);
      setProcessData({
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: '',
        notes: '',
      });
      fetchPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process payout');
    }
  };

  const handleCompletePayout = async (payoutId: string) => {
    if (!confirm('Mark this payout as completed?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_URL}/delivery-payouts/${payoutId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Payout marked as completed');
      fetchPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete payout');
    }
  };

  const handleCancelPayout = async (payoutId: string) => {
    if (!confirm('Are you sure you want to cancel this payout?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_URL}/delivery-payouts/${payoutId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Payout cancelled');
      fetchPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel payout');
    }
  };

  const openProcessDialog = (payout: DeliveryPayout) => {
    setSelectedPayout(payout);
    setProcessData({
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: '',
      notes: '',
    });
    setIsProcessDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      PENDING: { label: 'Pending', variant: 'secondary' },
      PROCESSING: { label: 'Processing', variant: 'default' },
      COMPLETED: { label: 'Completed', variant: 'default' },
      FAILED: { label: 'Failed', variant: 'destructive' },
      CANCELLED: { label: 'Cancelled', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredPayouts = payouts.filter(
    (payout) =>
      payout.provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.provider.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.paymentReference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Delivery Provider Payouts"
        description="Manage and process delivery partner payouts"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPending}</div>
              <p className="text-xs text-muted-foreground">
                ${formatCurrencyAmount(stats.pendingAmount, 2)} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProcessing}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompleted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatCurrencyAmount(stats.pendingAmount, 2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by provider name or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
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
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Deliveries</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No payouts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payout.provider.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {payout.provider.contactEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(payout.periodStart), 'MMM dd, yyyy')}</div>
                        <div className="text-muted-foreground">
                          to {format(new Date(payout.periodEnd), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{payout.deliveryCount}</TableCell>
                    <TableCell className="font-medium">
                      ${formatCurrencyAmount(Number(payout.amount), 2)}
                      <div className="text-xs text-muted-foreground">{payout.currency}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell>{payout.paymentMethod || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {payout.paymentReference || '-'}
                    </TableCell>
                    <TableCell>
                      {payout.completedAt
                        ? format(new Date(payout.completedAt), 'MMM dd, yyyy HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {payout.status === 'PENDING' && (
                          <Button size="sm" onClick={() => openProcessDialog(payout)}>
                            Process
                          </Button>
                        )}
                        {payout.status === 'PROCESSING' && (
                          <Button size="sm" onClick={() => handleCompletePayout(payout.id)}>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Complete
                          </Button>
                        )}
                        {(payout.status === 'PENDING' || payout.status === 'PROCESSING') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelPayout(payout.id)}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Cancel
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

        {/* Process Payout Dialog */}
        <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payout</DialogTitle>
              <DialogDescription>
                Process payout for {selectedPayout?.provider.name} - $
                {formatCurrencyAmount(Number(selectedPayout?.amount || 0), 2)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={processData.paymentMethod}
                  onValueChange={(value) =>
                    setProcessData({ ...processData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="PAYPAL">PayPal</SelectItem>
                    <SelectItem value="STRIPE">Stripe</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentReference">Payment Reference</Label>
                <Input
                  id="paymentReference"
                  value={processData.paymentReference}
                  onChange={(e) =>
                    setProcessData({ ...processData, paymentReference: e.target.value })
                  }
                  placeholder="Transaction ID or reference number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={processData.notes}
                  onChange={(e) => setProcessData({ ...processData, notes: e.target.value })}
                  placeholder="Add any additional notes about this payout"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessPayout}>Process Payout</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function DeliveryPayoutsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <DeliveryPayoutsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

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
} from '@luxury/ui';
import { toast } from 'sonner';
import { DollarSign, Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
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

  const stats = {
    total: payouts.reduce((sum, p) => sum + Number(p.amount), 0),
    pending: payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.amount), 0),
    completed: payouts.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + Number(p.amount), 0),
    failed: payouts.filter(p => p.status === 'FAILED').length,
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{payouts.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {payouts.filter(p => p.status === 'PENDING').length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.completed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {payouts.filter(p => p.status === 'COMPLETED').length} paid out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
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
                  <TableHead>Seller/Store</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Commissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No payouts found
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.store.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {payout.seller.email}
                          </div>
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
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        {new Date(payout.scheduledAt).toLocaleDateString()}
                      </TableCell>
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

      {/* Complete Payout Dialog */}
      <Dialog open={completeDialog.open} onOpenChange={(open) => setCompleteDialog({ ...completeDialog, open })}>
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
                    ${formatCurrencyAmount(completeDialog.payout.amount, 2)} {completeDialog.payout.currency}
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
              onClick={() => setCompleteDialog({ open: false, payout: null, reference: '', proof: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompletePayout}
              disabled={!completeDialog.reference}
            >
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

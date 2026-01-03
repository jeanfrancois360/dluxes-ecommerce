'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Badge } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nextpik/ui';
import {  DollarSign, TrendingUp, Package, Calendar as CalendarIcon, Download } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

interface EarningsSummary {
  totalEarnings: number;
  totalDeliveries: number;
}

interface Delivery {
  id: string;
  trackingNumber: string;
  deliveredAt: string;
  partnerCommission: number;
  order: {
    orderNumber: string;
  };
}

export default function DeliveryPartnerEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    totalDeliveries: 0,
  });
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    fetchEarnings();
  }, [startDate, endDate]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params: any = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await axios.get(`${API_URL}/delivery-partner/earnings`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setSummary(response.data.summary);
      setDeliveries(response.data.recentDeliveries || []);
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  };

  const exportEarnings = () => {
    // Create CSV content
    const headers = ['Date', 'Tracking Number', 'Order Number', 'Commission'];
    const rows = deliveries.map((d) => [
      format(new Date(d.deliveredAt), 'yyyy-MM-dd'),
      d.trackingNumber,
      d.order.orderNumber,
      `$${formatCurrencyAmount(Number(d.partnerCommission), 2)}`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      `Total Deliveries,${summary.totalDeliveries}`,
      `Total Earnings,$${formatCurrencyAmount(summary.totalEarnings, 2)}`,
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Success', 'Earnings exported successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Earnings</h1>
            <p className="text-muted-foreground">Track your delivery commissions and payments</p>
          </div>
          <Button onClick={exportEarnings} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${formatCurrencyAmount(summary.totalEarnings, 2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {summary.totalDeliveries} deliveries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalDeliveries}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed deliveries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average per Delivery</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${summary.totalDeliveries > 0
                  ? formatCurrencyAmount(summary.totalEarnings / summary.totalDeliveries, 2)
                  : formatCurrencyAmount(0, 2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Commission per delivery</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by Date Range</CardTitle>
            <CardDescription>Select a custom date range to view earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-[240px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-[240px]"
                />
              </div>

              {(startDate || endDate) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Earnings History */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
            <CardDescription>Detailed breakdown of your completed deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading earnings...</div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No earnings data found for the selected period
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Order Number</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          {format(new Date(delivery.deliveredAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {delivery.trackingNumber}
                        </TableCell>
                        <TableCell>{delivery.order.orderNumber}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          +${formatCurrencyAmount(Number(delivery.partnerCommission), 2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>How and when you receive your earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Payment Schedule</h4>
                  <p className="text-sm text-muted-foreground">
                    Earnings are calculated after each completed delivery and paid out weekly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Commission Structure</h4>
                  <p className="text-sm text-muted-foreground">
                    You earn a percentage of the delivery fee based on your provider's commission rate.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Next Payout</h4>
                  <p className="text-sm text-muted-foreground">
                    Your next scheduled payout will be processed at the end of this week.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

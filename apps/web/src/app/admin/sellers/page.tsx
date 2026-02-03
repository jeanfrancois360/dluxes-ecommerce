'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Textarea } from '@nextpik/ui';
import { AdminLayout } from '@/components/admin/admin-layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch');
  }

  const data = await res.json();
  return data.data || data;
};

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${color} rounded-lg shadow-lg p-6 border border-gray-100`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="p-3 bg-white rounded-lg shadow">
          <Icon className="w-8 h-8" style={{ color: '#CBB57B' }} />
        </div>
      </div>
    </motion.div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    ACTIVE: 'bg-green-100 text-green-800 border-green-300',
    SUSPENDED: 'bg-red-100 text-red-800 border-red-300',
    REJECTED: 'bg-gray-100 text-gray-800 border-gray-300',
    INACTIVE: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status}
    </span>
  );
}

export default function AdminSellersPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [suspensionNote, setSuspensionNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch stats
  const { data: stats, error: statsError } = useSWR(
    `${API_URL}/admin/sellers/stats`,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch sellers based on active tab
  const statusFilter = activeTab === 'all' ? '' : `&status=${activeTab.toUpperCase()}`;
  const searchFilter = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';

  const { data: sellersData, error: sellersError } = useSWR(
    `${API_URL}/admin/sellers?page=1&limit=50${statusFilter}${searchFilter}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const sellers = sellersData?.sellers || [];

  // Refresh data
  const refreshData = () => {
    mutate(`${API_URL}/admin/sellers/stats`);
    mutate(`${API_URL}/admin/sellers?page=1&limit=50${statusFilter}${searchFilter}`);
    toast.success('Data refreshed');
  };

  // Approve seller
  const handleApprove = async () => {
    if (!selectedSeller) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/sellers/${selectedSeller.storeId}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to approve seller');
      }

      toast.success(`${selectedSeller.storeName} approved successfully!`);
      setShowApproveModal(false);
      setSelectedSeller(null);
      refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve seller');
    } finally {
      setIsLoading(false);
    }
  };

  // Reject seller
  const handleReject = async () => {
    if (!selectedSeller || !rejectionNote.trim()) {
      toast.error('Rejection note is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/sellers/${selectedSeller.storeId}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rejectionNote }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject seller');
      }

      toast.success(`${selectedSeller.storeName} rejected`);
      setShowRejectModal(false);
      setSelectedSeller(null);
      setRejectionNote('');
      refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject seller');
    } finally {
      setIsLoading(false);
    }
  };

  // Suspend seller
  const handleSuspend = async () => {
    if (!selectedSeller || !suspensionNote.trim()) {
      toast.error('Suspension note is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/sellers/${selectedSeller.storeId}/suspend`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ suspensionNote }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to suspend seller');
      }

      toast.success(`${selectedSeller.storeName} suspended`);
      setShowSuspendModal(false);
      setSelectedSeller(null);
      setSuspensionNote('');
      refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to suspend seller');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
            <p className="text-gray-600 mt-1">
              Manage seller applications and accounts
            </p>
          </div>
          <Button
            onClick={refreshData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Sellers"
              value={stats.total || 0}
              icon={Users}
              color="from-blue-50 to-white"
            />
            <StatsCard
              title="Pending Approval"
              value={stats.pending || 0}
              icon={Clock}
              color="from-yellow-50 to-white"
            />
            <StatsCard
              title="Active Sellers"
              value={stats.active || 0}
              icon={CheckCircle}
              color="from-green-50 to-white"
            />
            <StatsCard
              title="Active with Credits"
              value={stats.activeWithCredits || 0}
              icon={AlertTriangle}
              color="from-purple-50 to-white"
            />
          </div>
        )}

        {/* Filters & Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between p-4 gap-4">
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'pending', label: 'Pending', count: stats?.pending },
                  { key: 'active', label: 'Active' },
                  { key: 'suspended', label: 'Suspended' },
                  { key: 'rejected', label: 'Rejected' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-gray-900 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search sellers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          {/* Sellers Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sellers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No sellers found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm
                            ? 'Try adjusting your search'
                            : 'Applications will appear here'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sellers.map((seller: any) => (
                    <motion.tr
                      key={seller.storeId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {seller.storeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {seller.storeEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {seller.owner.firstName} {seller.owner.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {seller.owner.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={seller.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">
                            {seller.creditsBalance}
                          </span>
                          <span className="text-gray-500"> months</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(seller.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {seller.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSeller(seller);
                                setShowApproveModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSeller(seller);
                                setShowRejectModal(true);
                              }}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {seller.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSeller(seller);
                              setShowSuspendModal(true);
                            }}
                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          >
                            Suspend
                          </Button>
                        )}
                        {seller.status === 'SUSPENDED' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  `${API_URL}/admin/sellers/${seller.storeId}/reactivate`,
                                  {
                                    method: 'POST',
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                                    },
                                  }
                                );

                                if (!res.ok) throw new Error('Failed to reactivate');

                                toast.success('Seller reactivated');
                                refreshData();
                              } catch (error) {
                                toast.error('Failed to reactivate seller');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Reactivate
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Seller Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve <strong>{selectedSeller?.storeName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-gray-600">This will automatically:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Approve the seller account</li>
              <li>Approve their store</li>
              <li>Allow product creation (with credits)</li>
              <li>Send approval email notification</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800">
                ⚠️ They'll need to purchase credits before publishing products.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Seller Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject <strong>{selectedSeller?.storeName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="rejectionNote">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectionNote"
                placeholder="Provide a clear reason for rejection..."
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                This action will prevent the seller from creating products. They can reapply later.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionNote('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isLoading || !rejectionNote.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Seller</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend <strong>{selectedSeller?.storeName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="suspensionNote">
                Suspension Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="suspensionNote"
                placeholder="Provide a reason for suspension..."
                value={suspensionNote}
                onChange={(e) => setSuspensionNote(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                This will immediately suspend the store and archive all active products.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendModal(false);
                setSuspensionNote('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={isLoading || !suspensionNote.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isLoading ? 'Suspending...' : 'Confirm Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import {
  Store,
  User,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Globe,
  Building,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    ACTIVE: 'bg-green-50 text-green-700 border-green-200',
    SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
    REJECTED: 'bg-gray-50 text-gray-700 border-gray-200',
    INACTIVE: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const dotColors: Record<string, string> = {
    PENDING: 'bg-yellow-600',
    ACTIVE: 'bg-green-600',
    SUSPENDED: 'bg-red-600',
    REJECTED: 'bg-gray-600',
    INACTIVE: 'bg-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${colors[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-gray-600'}`}></div>
      {status}
    </span>
  );
}

// Helper function to map API response to component structure
function mapSellerData(apiData: any) {
  return {
    // Store info
    id: apiData.store?.id || apiData.id,
    name: apiData.store?.name || apiData.name,
    slug: apiData.store?.slug || apiData.slug,
    email: apiData.store?.email || apiData.email,
    phone: apiData.store?.phone || apiData.phone,
    description: apiData.store?.description || apiData.description,
    status: apiData.store?.status || apiData.status,
    verified: apiData.store?.verified || apiData.verified,
    verifiedAt: apiData.store?.verifiedAt || apiData.verifiedAt,
    creditsBalance: apiData.store?.creditsBalance ?? apiData.creditsBalance ?? 0,
    creditsExpiresAt: apiData.store?.creditsExpiresAt || apiData.creditsExpiresAt,
    creditsGraceEndsAt: apiData.store?.creditsGraceEndsAt || apiData.creditsGraceEndsAt,
    website: apiData.store?.website || apiData.website,
    address: apiData.store?.address || apiData.address,
    city: apiData.store?.city || apiData.city,
    state: apiData.store?.state || apiData.state,
    zipCode: apiData.store?.zipCode || apiData.zipCode,
    country: apiData.store?.country || apiData.country,
    businessType: apiData.store?.businessType || apiData.businessType,
    businessName: apiData.store?.businessName || apiData.businessName,
    productCategories: apiData.store?.productCategories || apiData.productCategories,
    appliedAt: apiData.store?.createdAt || apiData.createdAt,
    createdAt: apiData.store?.createdAt || apiData.createdAt,

    // Owner info
    owner: apiData.owner || apiData.user,

    // Approval/rejection/suspension info from owner
    approvedAt: apiData.owner?.sellerApprovedAt || apiData.approvedAt,
    rejectionNote: apiData.owner?.sellerRejectionNote || apiData.rejectionNote,
    suspensionNote: apiData.owner?.sellerSuspensionNote || apiData.suspensionNote,

    // Counts
    _count: {
      products: apiData.store?.totalProducts || apiData._count?.products || 0,
    },
  };
}

function SellerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);

  useEffect(() => {
    async function fetchSeller() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/admin/sellers/${params.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch seller');
        }

        const response = await res.json();
        const apiData = response.data || response;
        setSeller(mapSellerData(apiData));
      } catch (error) {
        toast.error('Failed to load seller');
        router.push('/admin/sellers');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchSeller();
    }
  }, [params.id, router]);

  // Fetch credit history
  useEffect(() => {
    async function fetchCreditHistory() {
      try {
        setLoadingCredits(true);
        const res = await fetch(`${API_URL}/admin/sellers/${params.id}/credits/history?limit=10`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCreditHistory(data.data?.transactions || data.transactions || []);
        }
      } catch (error) {
        console.error('Failed to load credit history');
      } finally {
        setLoadingCredits(false);
      }
    }

    if (params.id) {
      fetchCreditHistory();
    }
  }, [params.id]);

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this seller?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/sellers/${params.id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!res.ok) throw new Error('Failed to approve seller');

      toast.success('Seller approved successfully');
      // Refresh seller data
      const updatedRes = await fetch(`${API_URL}/admin/sellers/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const response = await updatedRes.json();
      setSeller(mapSellerData(response.data || response));
    } catch (error) {
      toast.error('Failed to approve seller');
    }
  };

  const handleSuspend = async () => {
    const note = prompt('Please provide a reason for suspension:');
    if (!note) return;

    try {
      const res = await fetch(`${API_URL}/admin/sellers/${params.id}/suspend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suspensionNote: note }),
      });

      if (!res.ok) throw new Error('Failed to suspend seller');

      toast.success('Seller suspended successfully');
      // Refresh seller data
      const updatedRes = await fetch(`${API_URL}/admin/sellers/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const response = await updatedRes.json();
      setSeller(mapSellerData(response.data || response));
    } catch (error) {
      toast.error('Failed to suspend seller');
    }
  };

  const handleReactivate = async () => {
    if (!confirm('Are you sure you want to reactivate this seller?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/sellers/${params.id}/reactivate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!res.ok) throw new Error('Failed to reactivate seller');

      toast.success('Seller reactivated successfully');
      // Refresh seller data
      const updatedRes = await fetch(`${API_URL}/admin/sellers/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const response = await updatedRes.json();
      setSeller(mapSellerData(response.data || response));
    } catch (error) {
      toast.error('Failed to reactivate seller');
    }
  };

  const handleReject = async () => {
    const note = prompt('Please provide a reason for rejection:');
    if (!note) return;

    try {
      const res = await fetch(`${API_URL}/admin/sellers/${params.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionNote: note }),
      });

      if (!res.ok) throw new Error('Failed to reject seller');

      toast.success('Seller rejected successfully');
      // Refresh seller data
      const updatedRes = await fetch(`${API_URL}/admin/sellers/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const response = await updatedRes.json();
      setSeller(mapSellerData(response.data || response));
    } catch (error) {
      toast.error('Failed to reject seller');
    }
  };

  const handleAdjustCredits = async () => {
    const amount = prompt('Enter months to add/subtract (e.g., 3 or -2):');
    if (!amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      toast.error('Invalid amount');
      return;
    }

    const notes = prompt('Please provide a reason for this adjustment:');
    if (!notes) return;

    try {
      const res = await fetch(`${API_URL}/admin/sellers/${params.id}/credits/adjust`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amountNum, notes, type: 'ADJUSTMENT' }),
      });

      if (!res.ok) throw new Error('Failed to adjust subscription');

      toast.success('Subscription adjusted successfully');
      // Refresh seller and credit history
      const updatedRes = await fetch(`${API_URL}/admin/sellers/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const response = await updatedRes.json();
      setSeller(mapSellerData(response.data || response));

      // Refresh credit history
      const creditRes = await fetch(
        `${API_URL}/admin/sellers/${params.id}/credits/history?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      const creditData = await creditRes.json();
      setCreditHistory(creditData.data?.transactions || creditData.transactions || []);
    } catch (error) {
      toast.error('Failed to adjust credits');
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Seller Details" description="Loading seller information" />
        <div className="p-16 text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-neutral-600 font-medium">Loading seller...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Seller Not Found"
          description="The seller you're looking for doesn't exist"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-neutral-600">Seller not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title={seller.name}
        description={seller.email}
        actions={
          <div className="flex items-center gap-2">
            {seller.status === 'PENDING' && (
              <>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-100 border border-green-200 text-green-700 rounded-lg hover:bg-green-200 transition-all font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-100 border border-red-200 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium"
                >
                  Reject
                </button>
              </>
            )}
            {seller.status === 'ACTIVE' && (
              <button
                onClick={handleSuspend}
                className="px-4 py-2 bg-orange-100 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-200 transition-all font-medium"
              >
                Suspend
              </button>
            )}
            {seller.status === 'SUSPENDED' && (
              <button
                onClick={handleReactivate}
                className="px-4 py-2 bg-blue-100 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-medium"
              >
                Reactivate
              </button>
            )}
            <button
              onClick={handleAdjustCredits}
              className="px-4 py-2 bg-[#CBB57B]/20 border border-[#CBB57B]/30 text-[#CBB57B] rounded-lg hover:bg-[#CBB57B]/30 transition-all font-medium"
            >
              Adjust Subscription
            </button>
          </div>
        }
      >
        <div className="mt-2">
          <StatusBadge status={seller.status} />
        </div>
      </PageHeader>

      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-neutral-600">Total Products</p>
            </div>
            <p className="text-2xl font-bold text-black">{seller._count?.products || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-neutral-600">Subscription</p>
            </div>
            <p className="text-2xl font-bold text-black">
              {seller.creditsBalance || 0} {seller.creditsBalance === 1 ? 'month' : 'months'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {seller.creditsBalance > 0 ? 'Active' : 'Expired'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-neutral-600">Applied On</p>
            </div>
            <p className="text-lg font-bold text-black">
              {seller.appliedAt || seller.createdAt
                ? format(new Date(seller.appliedAt || seller.createdAt), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm text-neutral-600">Approved On</p>
            </div>
            <p className="text-lg font-bold text-black">
              {seller.approvedAt ? format(new Date(seller.approvedAt), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Store & Owner Info */}
          <div className="space-y-6 md:col-span-2">
            {/* Store Information */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Store className="w-5 h-5" />
                Store Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Store Name</p>
                    <p className="text-sm font-medium text-black">{seller.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Store Email</p>
                    <p className="text-sm font-medium text-black flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {seller.email}
                    </p>
                  </div>
                </div>

                {seller.description && (
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Description</p>
                    <p className="text-sm text-black">{seller.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {seller.phone && (
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">Phone</p>
                      <p className="text-sm font-medium text-black flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {seller.phone}
                      </p>
                    </div>
                  )}
                  {seller.website && (
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">Website</p>
                      <a
                        href={seller.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#CBB57B] hover:underline flex items-center gap-2"
                      >
                        <Globe className="w-4 h-4" />
                        {seller.website}
                      </a>
                    </div>
                  )}
                </div>

                {(seller.address || seller.city || seller.state) && (
                  <div>
                    <p className="text-sm text-neutral-600 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </p>
                    <p className="text-sm text-black">
                      {[seller.address, seller.city, seller.state, seller.zipCode, seller.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}

                {seller.businessType && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-600 mb-1 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Business Type
                      </p>
                      <p className="text-sm font-medium text-black">{seller.businessType}</p>
                    </div>
                    {seller.businessName && (
                      <div>
                        <p className="text-sm text-neutral-600 mb-1">Business Name</p>
                        <p className="text-sm font-medium text-black">{seller.businessName}</p>
                      </div>
                    )}
                  </div>
                )}

                {seller.productCategories && seller.productCategories.length > 0 && (
                  <div>
                    <p className="text-sm text-neutral-600 mb-2">Product Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {seller.productCategories.map((cat: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Owner Information */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Owner Information
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Name</p>
                    <p className="text-sm font-medium text-black">
                      {seller.owner?.firstName} {seller.owner?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Email</p>
                    <p className="text-sm font-medium text-black">{seller.owner?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Role</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                      {seller.owner?.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Member Since</p>
                    <p className="text-sm font-medium text-black">
                      {seller.owner?.createdAt
                        ? format(new Date(seller.owner.createdAt), 'MMM d, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            {(seller.rejectionNote || seller.suspensionNote) && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-bold text-black mb-4">Admin Notes</h2>
                <div className="space-y-3">
                  {seller.rejectionNote && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-semibold text-red-800 mb-1">Rejection Note</p>
                      <p className="text-sm text-red-700">{seller.rejectionNote}</p>
                    </div>
                  )}
                  {seller.suspensionNote && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm font-semibold text-orange-800 mb-1">Suspension Note</p>
                      <p className="text-sm text-orange-700">{seller.suspensionNote}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Activity & Credits */}
          <div className="space-y-6">
            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-black mb-4">Activity Timeline</h2>
              <div className="space-y-4">
                {/* Applied */}
                {(seller.appliedAt || seller.createdAt) && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="w-px h-full bg-neutral-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-black">Applied</p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {format(
                          new Date(seller.appliedAt || seller.createdAt),
                          'MMM d, yyyy h:mm a'
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved */}
                {seller.approvedAt && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="w-px h-full bg-neutral-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-black">Approved</p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {format(new Date(seller.approvedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Suspended */}
                {seller.status === 'SUSPENDED' && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">Suspended</p>
                      <p className="text-xs text-neutral-600 mt-1">
                        Account is currently suspended
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejected */}
                {seller.status === 'REJECTED' && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">Rejected</p>
                      <p className="text-xs text-neutral-600 mt-1">Application was rejected</p>
                    </div>
                  </div>
                )}

                {/* Pending */}
                {seller.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">Pending Approval</p>
                      <p className="text-xs text-neutral-600 mt-1">Awaiting admin review</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription History */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-black mb-4">Subscription History</h2>
              {loadingCredits ? (
                <div className="text-center py-4">
                  <p className="text-sm text-neutral-600">Loading...</p>
                </div>
              ) : creditHistory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-neutral-600">No subscription history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {creditHistory.map((transaction: any) => (
                    <div key={transaction.id} className="p-3 border border-neutral-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-semibold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount}{' '}
                          {Math.abs(transaction.amount) === 1 ? 'month' : 'months'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {transaction.createdAt
                            ? format(new Date(transaction.createdAt), 'MMM d, yyyy')
                            : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600">{transaction.type}</p>
                      {transaction.notes && (
                        <p className="text-xs text-neutral-500 mt-1">{transaction.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SellerDetailPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <SellerDetailContent />
      </AdminLayout>
    </AdminRoute>
  );
}

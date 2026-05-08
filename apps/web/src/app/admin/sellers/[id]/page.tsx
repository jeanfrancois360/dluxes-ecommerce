'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Store,
  User,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Globe,
  Building,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Tag,
  ShieldCheck,
  ShieldX,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Textarea } from '@nextpik/ui';
import { Input } from '@nextpik/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const REJECTION_REASONS = [
  'Insufficient store information provided',
  'Prohibited product categories',
  'Business details could not be verified',
  'Incomplete or inaccurate contact information',
  'Duplicate or fraudulent account detected',
  'Does not meet platform requirements',
  'Other (specify below)',
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PENDING: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-700',
      dot: 'bg-yellow-500',
      label: 'Pending Review',
    },
    ACTIVE: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-700',
      dot: 'bg-green-500',
      label: 'Active',
    },
    SUSPENDED: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-700',
      dot: 'bg-red-500',
      label: 'Suspended',
    },
    REJECTED: {
      bg: 'bg-gray-50 border-gray-200',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
      label: 'Rejected',
    },
    INACTIVE: {
      bg: 'bg-gray-50 border-gray-200',
      text: 'text-gray-500',
      dot: 'bg-gray-400',
      label: 'Inactive',
    },
  };
  const s = map[status] || map.INACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-black">{value}</p>
    </div>
  );
}

function mapSellerData(apiData: any) {
  return {
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
    owner: apiData.owner || apiData.user,
    approvedAt: apiData.owner?.sellerApprovedAt || apiData.approvedAt,
    approvedBy: apiData.owner?.sellerApprovedBy || apiData.approvedBy,
    rejectedAt: apiData.owner?.sellerRejectedAt || apiData.rejectedAt,
    rejectionNote: apiData.owner?.sellerRejectionNote || apiData.rejectionNote,
    suspendedAt: apiData.owner?.sellerSuspendedAt || apiData.suspendedAt,
    suspensionNote: apiData.owner?.sellerSuspensionNote || apiData.suspensionNote,
    _count: { products: apiData.store?.totalProducts || apiData._count?.products || 0 },
  };
}

function SellerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [modal, setModal] = useState<
    'approve' | 'reject' | 'suspend' | 'reactivate' | 'credits' | null
  >(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [suspensionNote, setSuspensionNote] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNotes, setCreditNotes] = useState('');
  const [creditType, setCreditType] = useState<'ADJUSTMENT' | 'BONUS' | 'REFUND'>('ADJUSTMENT');

  const authHeaders = {
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
    'Content-Type': 'application/json',
  };

  async function fetchSeller() {
    try {
      const res = await fetch(`${API_URL}/admin/sellers/${storeId}`, { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to fetch seller');
      const response = await res.json();
      setSeller(mapSellerData(response.data || response));
    } catch {
      toast.error('Failed to load seller');
      router.push('/admin/sellers');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCreditHistory() {
    try {
      const res = await fetch(`${API_URL}/admin/sellers/${storeId}/credits/history?limit=10`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setCreditHistory(data.data?.transactions || data.transactions || []);
      }
    } catch {
      /* non-critical */
    }
  }

  useEffect(() => {
    if (storeId) {
      fetchSeller();
      fetchCreditHistory();
    }
  }, [storeId]);

  async function callAction(path: string, body?: object) {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/sellers/${storeId}/${path}`, {
        method: 'POST',
        headers: authHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Action failed');
      }
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
      return false;
    } finally {
      setActionLoading(false);
    }
  }

  async function refresh() {
    await Promise.all([fetchSeller(), fetchCreditHistory()]);
  }

  async function handleApprove() {
    if (await callAction('approve')) {
      toast.success(`${seller.name} has been approved`);
      setModal(null);
      refresh();
    }
  }

  async function handleReject() {
    const note =
      selectedReason === 'Other (specify below)' ? rejectionNote : selectedReason || rejectionNote;
    if (!note.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    if (await callAction('reject', { rejectionNote: note })) {
      toast.success('Application rejected');
      setModal(null);
      setRejectionNote('');
      setSelectedReason('');
      refresh();
    }
  }

  async function handleSuspend() {
    if (!suspensionNote.trim()) {
      toast.error('Suspension reason is required');
      return;
    }
    if (await callAction('suspend', { suspensionNote })) {
      toast.success('Seller suspended');
      setModal(null);
      setSuspensionNote('');
      refresh();
    }
  }

  async function handleReactivate() {
    if (await callAction('reactivate')) {
      toast.success('Seller reactivated');
      setModal(null);
      refresh();
    }
  }

  async function handleAdjustCredits() {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!creditNotes.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    if (await callAction('credits/adjust', { amount, notes: creditNotes, type: creditType })) {
      toast.success('Subscription adjusted');
      setModal(null);
      setCreditAmount('');
      setCreditNotes('');
      refresh();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#CBB57B]" />
      </div>
    );
  }

  if (!seller) return null;

  const waitingDays = seller.appliedAt
    ? Math.floor((Date.now() - new Date(seller.appliedAt).getTime()) / 86400000)
    : null;

  const fullRejectionNote =
    selectedReason === 'Other (specify below)' || !selectedReason
      ? rejectionNote
      : selectedReason + (rejectionNote ? ` — ${rejectionNote}` : '');

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/admin/sellers"
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Sellers
        </Link>
      </div>

      <PageHeader
        title={seller.name}
        description={`${seller.email}${seller.phone ? ` · ${seller.phone}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            {seller.status === 'PENDING' && (
              <>
                <Button
                  onClick={() => setModal('approve')}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setModal('reject')}
                  className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                >
                  <ShieldX className="w-4 h-4" /> Reject
                </Button>
              </>
            )}
            {seller.status === 'ACTIVE' && (
              <Button
                variant="outline"
                onClick={() => setModal('suspend')}
                className="border-orange-200 text-orange-600 hover:bg-orange-50 gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" /> Suspend
              </Button>
            )}
            {seller.status === 'SUSPENDED' && (
              <Button
                variant="outline"
                onClick={() => setModal('reactivate')}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Reactivate
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setModal('credits')}
              className="border-[#CBB57B]/40 text-[#CBB57B] hover:bg-[#CBB57B]/10 gap-1.5"
            >
              <CreditCard className="w-4 h-4" /> Adjust Subscription
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-3 mt-2">
          <StatusBadge status={seller.status} />
          {seller.status === 'PENDING' && waitingDays !== null && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                waitingDays >= 2 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              <Clock className="w-3 h-3" />
              Waiting {waitingDays === 0 ? 'today' : `${waitingDays}d`}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Rejection / Suspension notice */}
      {seller.rejectionNote && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Rejection Reason</p>
            <p className="text-sm text-red-700 mt-0.5">{seller.rejectionNote}</p>
          </div>
        </div>
      )}
      {seller.suspensionNote && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Suspension Reason</p>
            <p className="text-sm text-orange-700 mt-0.5">{seller.suspensionNote}</p>
          </div>
        </div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Package,
            bg: 'bg-blue-100',
            color: 'text-blue-600',
            label: 'Products',
            value: String(seller._count?.products || 0),
          },
          {
            icon: CreditCard,
            bg: 'bg-purple-100',
            color: 'text-purple-600',
            label: 'Subscription',
            value: seller.creditsBalance > 0 ? `${seller.creditsBalance} mo` : 'No credits',
            sub: seller.creditsBalance > 0 ? 'Active' : 'Expired',
            subColor: seller.creditsBalance > 0 ? 'text-green-600' : 'text-red-500',
          },
          {
            icon: Calendar,
            bg: 'bg-amber-100',
            color: 'text-amber-600',
            label: 'Applied',
            value: seller.appliedAt ? format(new Date(seller.appliedAt), 'MMM d, yyyy') : '—',
            sub: seller.appliedAt
              ? formatDistanceToNow(new Date(seller.appliedAt), { addSuffix: true })
              : '',
          },
          {
            icon: CheckCircle,
            bg: 'bg-green-100',
            color: 'text-green-600',
            label: 'Approved',
            value: seller.approvedAt ? format(new Date(seller.approvedAt), 'MMM d, yyyy') : '—',
          },
        ].map(({ icon: Icon, bg, color, label, value, sub, subColor }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xs text-neutral-500 font-medium">{label}</p>
            </div>
            <p className="text-xl font-bold text-black">{value}</p>
            {sub && <p className={`text-xs mt-0.5 ${subColor || 'text-neutral-400'}`}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Store + Owner info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Info */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <Store className="w-4 h-4" /> Store Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Store Name" value={seller.name} />
              <InfoRow label="Store Email" value={seller.email} />
              <InfoRow label="Phone" value={seller.phone} />
              <InfoRow label="Website" value={seller.website} />
              <InfoRow label="Business Type" value={seller.businessType} />
              <InfoRow label="Business Name" value={seller.businessName} />
            </div>
            {seller.description && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">Description</p>
                <p className="text-sm text-black">{seller.description}</p>
              </div>
            )}
            {(seller.address || seller.city) && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </p>
                <p className="text-sm text-black">
                  {[seller.address, seller.city, seller.state, seller.zipCode, seller.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}
            {seller.productCategories?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Product Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {seller.productCategories.map((cat: string) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Owner Info */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Owner Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Full Name"
                value={`${seller.owner?.firstName || ''} ${seller.owner?.lastName || ''}`.trim()}
              />
              <InfoRow label="Email" value={seller.owner?.email} />
              <InfoRow label="Phone" value={seller.owner?.phone} />
              <div>
                <p className="text-xs text-neutral-500 mb-0.5">Role</p>
                <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                  {seller.owner?.role || 'SELLER'}
                </span>
              </div>
              <InfoRow
                label="Member Since"
                value={
                  seller.owner?.createdAt
                    ? format(new Date(seller.owner.createdAt), 'MMM d, yyyy')
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Right: Timeline + Credit history */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-base font-bold text-black mb-4">Activity Timeline</h2>
            <ol className="relative border-l border-neutral-200 space-y-6 ml-3">
              {[
                seller.appliedAt && {
                  icon: Calendar,
                  bg: 'bg-blue-100',
                  color: 'text-blue-600',
                  label: 'Application submitted',
                  date: seller.appliedAt,
                },
                seller.approvedAt && {
                  icon: CheckCircle,
                  bg: 'bg-green-100',
                  color: 'text-green-600',
                  label: 'Approved by admin',
                  date: seller.approvedAt,
                },
                seller.rejectedAt && {
                  icon: XCircle,
                  bg: 'bg-red-100',
                  color: 'text-red-600',
                  label: 'Application rejected',
                  date: seller.rejectedAt,
                },
                seller.suspendedAt && {
                  icon: AlertTriangle,
                  bg: 'bg-orange-100',
                  color: 'text-orange-600',
                  label: 'Account suspended',
                  date: seller.suspendedAt,
                },
                seller.status === 'PENDING' && {
                  icon: Clock,
                  bg: 'bg-yellow-100',
                  color: 'text-yellow-600',
                  label: 'Awaiting admin review',
                  date: null,
                },
              ]
                .filter(Boolean)
                .map((event: any, i) => (
                  <li key={i} className="ml-4">
                    <div
                      className={`absolute -left-3 w-6 h-6 rounded-full ${event.bg} flex items-center justify-center`}
                    >
                      <event.icon className={`w-3 h-3 ${event.color}`} />
                    </div>
                    <p className="text-sm font-medium text-black">{event.label}</p>
                    {event.date && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {format(new Date(event.date), 'MMM d, yyyy · h:mm a')}
                      </p>
                    )}
                  </li>
                ))}
            </ol>
          </div>

          {/* Credit history */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-base font-bold text-black mb-4">Subscription History</h2>
            {creditHistory.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {creditHistory.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 border border-neutral-100 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500">{tx.type}</p>
                      {tx.notes && <p className="text-xs text-neutral-400 truncate">{tx.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p
                        className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount} mo
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}

      {/* Approve */}
      <Dialog open={modal === 'approve'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Seller Application</DialogTitle>
            <DialogDescription>
              You are about to approve <strong>{seller.name}</strong>. This will grant the seller
              full access to list products.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <ul className="text-sm text-neutral-600 list-disc list-inside space-y-1">
              <li>
                Store status set to <strong>Active</strong>
              </li>
              <li>
                User role upgraded to <strong>Seller</strong>
              </li>
              <li>Approval confirmation email sent to {seller.owner?.email}</li>
            </ul>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">
                This action takes effect immediately.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-1" /> Approve Seller
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject */}
      <Dialog open={modal === 'reject'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Select a reason and optionally add details. The seller will be notified by email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <div>
              <Label className="mb-2 block">
                Reason <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-1.5">
                {REJECTION_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                      selectedReason === r
                        ? 'border-red-400 bg-red-50 text-red-800 font-medium'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="rejectNote" className="mb-1 block">
                {selectedReason === 'Other (specify below)'
                  ? 'Details (required)'
                  : 'Additional details (optional)'}
              </Label>
              <Textarea
                id="rejectNote"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Provide more context for the seller…"
                rows={3}
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                The seller will receive an email with this reason and cannot reapply until they
                contact support.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModal(null);
                setSelectedReason('');
                setRejectionNote('');
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading || (!selectedReason && !rejectionNote.trim())}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldX className="w-4 h-4 mr-1" /> Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend */}
      <Dialog open={modal === 'suspend'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Seller</DialogTitle>
            <DialogDescription>
              Suspending <strong>{seller.name}</strong> will archive all their active products
              immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div>
              <Label htmlFor="suspendNote" className="mb-1 block">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="suspendNote"
                value={suspensionNote}
                onChange={(e) => setSuspensionNote(e.target.value)}
                placeholder="Explain why this seller is being suspended…"
                rows={4}
              />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                All active products will be archived. The seller will receive a suspension email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModal(null);
                setSuspensionNote('');
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={actionLoading || !suspensionNote.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-1" /> Suspend Seller
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate */}
      <Dialog open={modal === 'reactivate'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Seller</DialogTitle>
            <DialogDescription>
              This will restore <strong>{seller.name}</strong>'s account to Active status.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                The seller must have available credits to be reactivated. Their products will remain
                archived until they republish them.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleReactivate}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" /> Reactivate Seller
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Credits */}
      <Dialog open={modal === 'credits'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Subscription Credits</DialogTitle>
            <DialogDescription>
              Current balance:{' '}
              <strong>
                {seller.creditsBalance} {seller.creditsBalance === 1 ? 'month' : 'months'}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="creditAmt" className="mb-1 block">
                  Amount (months) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="creditAmt"
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="e.g. 3 or -1"
                />
                <p className="text-xs text-neutral-400 mt-1">Negative to deduct</p>
              </div>
              <div>
                <Label className="mb-1 block">Type</Label>
                <select
                  value={creditType}
                  onChange={(e) => setCreditType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                >
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="BONUS">Bonus</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="creditNote" className="mb-1 block">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="creditNote"
                value={creditNotes}
                onChange={(e) => setCreditNotes(e.target.value)}
                placeholder="Reason for this adjustment…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModal(null);
                setCreditAmount('');
                setCreditNotes('');
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustCredits}
              disabled={actionLoading || !creditAmount || !creditNotes.trim()}
              className="bg-[#CBB57B] hover:bg-[#b9a369] text-black"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import Image from 'next/image';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BadgeCheck,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  ExternalLink,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { adminPayoutAPI, VerifyPayoutSettingsDto } from '@/lib/api/admin-payout-settings';
import { SellerPayoutSettings } from '@/lib/api/seller-payout';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

const METHOD_LOGOS: Record<string, { src: string; size: number }> = {
  STRIPE_CONNECT: { src: '/logos/stripe-4.svg', size: 28 },
  PAYPAL: { src: '/logos/paypal-4.svg', size: 18 },
  WISE: { src: '/logos/wise-1.svg', size: 28 },
};

function MethodBadge({ method }: { method: string }) {
  const logo = METHOD_LOGOS[method];
  if (logo) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white border border-neutral-100 shadow-sm flex items-center justify-center">
          <Image
            src={logo.src}
            alt={method}
            width={logo.size}
            height={logo.size}
            className="object-contain"
          />
        </div>
        <span className="text-sm font-medium text-neutral-700">
          {method === 'STRIPE_CONNECT' ? 'Stripe Connect' : method === 'PAYPAL' ? 'PayPal' : 'Wise'}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
        <Building2 className="w-4 h-4 text-neutral-500" />
      </div>
      <span className="text-sm font-medium text-neutral-700">Bank Transfer</span>
    </div>
  );
}

function VerificationBadge({ settings }: { settings: SellerPayoutSettings }) {
  if (settings.verified) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        <BadgeCheck className="w-3.5 h-3.5" /> Verified
      </span>
    );
  }
  if (settings.rejectionNotes) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <XCircle className="w-3.5 h-3.5" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="w-3.5 h-3.5" /> Pending
    </span>
  );
}

function StripeStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-xs text-neutral-400">—</span>;
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    restricted: 'bg-red-100 text-red-700',
    incomplete: 'bg-neutral-100 text-neutral-600',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-neutral-100 text-neutral-600'}`}
    >
      {status}
    </span>
  );
}

interface VerifyModalProps {
  settings: SellerPayoutSettings;
  onClose: () => void;
  onSaved: () => void;
}

function VerifyModal({ settings, onClose, onSaved }: VerifyModalProps) {
  const [action, setAction] = useState<'verify' | 'reject'>('verify');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const sellerName = settings.seller
    ? `${settings.seller.firstName || ''} ${settings.seller.lastName || ''}`.trim() ||
      settings.seller.email
    : 'Unknown Seller';

  const handleSubmit = async () => {
    if (!settings.id) return;
    setSaving(true);
    try {
      const dto: VerifyPayoutSettingsDto = {
        verified: action === 'verify',
        rejectionNotes: action === 'reject' ? notes : undefined,
      };
      await adminPayoutAPI.verify(settings.id, dto);
      toast.success(action === 'verify' ? 'Settings verified successfully' : 'Settings rejected');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update verification status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <h2 className="text-lg font-bold text-neutral-900 mb-1">Review Payout Settings</h2>
        <p className="text-sm text-neutral-500 mb-5">
          {sellerName} · {settings.store?.name}
        </p>

        {/* Settings summary */}
        <div className="bg-neutral-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Method</span>
            <MethodBadge method={settings.paymentMethod} />
          </div>
          {settings.paymentMethod === 'bank_transfer' && (
            <>
              <div className="flex justify-between">
                <span className="text-neutral-500">Bank</span>
                <span className="font-medium text-neutral-800">{settings.bankName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Account</span>
                <span className="font-medium text-neutral-800">
                  {settings.accountNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Country</span>
                <span className="font-medium text-neutral-800">{settings.bankCountry || '—'}</span>
              </div>
            </>
          )}
          {settings.paymentMethod === 'STRIPE_CONNECT' && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Stripe Status</span>
              <StripeStatusBadge status={settings.stripeAccountStatus} />
            </div>
          )}
          {settings.paymentMethod === 'PAYPAL' && (
            <div className="flex justify-between">
              <span className="text-neutral-500">PayPal Email</span>
              <span className="font-medium text-neutral-800">{settings.paypalEmail || '—'}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Currency</span>
            <span className="font-medium text-neutral-800">{settings.payoutCurrency}</span>
          </div>
          {settings.taxId && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Tax ID</span>
              <span className="font-medium text-neutral-800">{settings.taxId}</span>
            </div>
          )}
        </div>

        {/* Action tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setAction('verify')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              action === 'verify'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-1.5" />
            Verify
          </button>
          <button
            onClick={() => setAction('reject')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              action === 'reject'
                ? 'bg-red-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <XCircle className="w-4 h-4 inline mr-1.5" />
            Reject
          </button>
        </div>

        {action === 'reject' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Rejection reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Explain why the payout settings are being rejected…"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black resize-none"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || (action === 'reject' && !notes.trim())}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              action === 'verify'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : action === 'verify' ? (
              'Confirm Verify'
            ) : (
              'Confirm Reject'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface StripePayoutModalProps {
  settings: SellerPayoutSettings;
  onClose: () => void;
}

function StripePayoutModal({ settings, onClose }: StripePayoutModalProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(settings.payoutCurrency || 'USD');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await adminPayoutAPI.triggerStripePayout(
        settings.sellerId,
        Math.round(amt * 100),
        currency,
        description || undefined
      );
      toast.success('Stripe payout triggered successfully');
      onClose();
    } catch {
      toast.error('Failed to trigger payout');
    } finally {
      setSaving(false);
    }
  };

  const sellerName = settings.seller
    ? `${settings.seller.firstName || ''} ${settings.seller.lastName || ''}`.trim() ||
      settings.seller.email
    : 'Unknown Seller';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 flex items-center justify-center">
            <Image
              src="/logos/stripe-4.svg"
              alt="Stripe"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Manual Stripe Payout</h2>
            <p className="text-xs text-neutral-500">
              {sellerName} · {settings.stripeAccountId}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
            >
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'CHF'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Manual payout for…"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !amount}
            className="flex-1 py-2.5 bg-[#635BFF] text-white rounded-xl text-sm font-semibold hover:bg-[#5246CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Payout'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AdminPayoutSettingsContent() {
  const [settings, setSettings] = useState<SellerPayoutSettings[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>(
    'all'
  );
  const [filterMethod, setFilterMethod] = useState('');
  const [verifyTarget, setVerifyTarget] = useState<SellerPayoutSettings | null>(null);
  const [stripePayoutTarget, setStripePayoutTarget] = useState<SellerPayoutSettings | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchSettings = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const filters: Record<string, unknown> = { page, limit: 20 };
        if (filterStatus === 'verified') filters.verified = true;
        if (filterStatus === 'pending' || filterStatus === 'rejected') filters.verified = false;
        if (filterMethod) filters.paymentMethod = filterMethod;
        const res = await adminPayoutAPI.getAll(
          filters as Parameters<typeof adminPayoutAPI.getAll>[0]
        );
        let data = res.data || [];
        // Client-side rejection filter (backend only has verified boolean)
        if (filterStatus === 'rejected')
          data = data.filter((s) => !s.verified && !!s.rejectionNotes);
        if (filterStatus === 'pending') data = data.filter((s) => !s.verified && !s.rejectionNotes);
        // Search filter
        if (search) {
          const q = search.toLowerCase();
          data = data.filter(
            (s) =>
              s.seller?.email?.toLowerCase().includes(q) ||
              s.seller?.firstName?.toLowerCase().includes(q) ||
              s.seller?.lastName?.toLowerCase().includes(q) ||
              s.store?.name?.toLowerCase().includes(q)
          );
        }
        setSettings(data);
        setPagination(res.pagination || { page: 1, limit: 20, total: data.length, totalPages: 1 });
      } catch {
        toast.error('Failed to load payout settings');
      } finally {
        setIsLoading(false);
      }
    },
    [filterStatus, filterMethod, search]
  );

  useEffect(() => {
    fetchSettings(1);
  }, [fetchSettings]);

  const handleSyncStripe = async (s: SellerPayoutSettings) => {
    if (!s.stripeAccountId) return;
    setSyncingId(s.id!);
    try {
      await adminPayoutAPI.syncStripe(s.stripeAccountId);
      toast.success('Stripe status synced');
      fetchSettings(pagination.page);
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleStripeDashboard = async (s: SellerPayoutSettings) => {
    if (!s.stripeAccountId) return;
    try {
      const { url } = await adminPayoutAPI.stripeDashboard(s.stripeAccountId);
      window.open(url, '_blank');
    } catch {
      toast.error('Could not get Stripe dashboard link');
    }
  };

  // Stats
  const total = settings.length;
  const verified = settings.filter((s) => s.verified).length;
  const pending = settings.filter((s) => !s.verified && !s.rejectionNotes).length;
  const rejected = settings.filter((s) => !s.verified && !!s.rejectionNotes).length;
  const byStripe = settings.filter((s) => s.paymentMethod === 'STRIPE_CONNECT').length;
  const byPaypal = settings.filter((s) => s.paymentMethod === 'PAYPAL').length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title="Payout Settings"
        description="Review and verify seller payout configurations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Payout Settings' },
        ]}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            {
              label: 'Total',
              value: total,
              icon: <ShieldCheck className="w-5 h-5 text-neutral-500" />,
              color: 'bg-neutral-100',
            },
            {
              label: 'Pending',
              value: pending,
              icon: <Clock className="w-5 h-5 text-amber-500" />,
              color: 'bg-amber-50',
            },
            {
              label: 'Verified',
              value: verified,
              icon: <BadgeCheck className="w-5 h-5 text-emerald-500" />,
              color: 'bg-emerald-50',
            },
            {
              label: 'Rejected',
              value: rejected,
              icon: <XCircle className="w-5 h-5 text-red-500" />,
              color: 'bg-red-50',
            },
            {
              label: 'Stripe Connect',
              value: byStripe,
              icon: (
                <Image
                  src="/logos/stripe-4.svg"
                  alt="Stripe"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              ),
              color: 'bg-[#635BFF]/10',
            },
            {
              label: 'PayPal',
              value: byPaypal,
              icon: (
                <Image
                  src="/logos/paypal-4.svg"
                  alt="PayPal"
                  width={14}
                  height={14}
                  className="object-contain"
                />
              ),
              color: 'bg-[#003087]/10',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search seller or store…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm focus:outline-none w-full text-neutral-800 placeholder:text-neutral-400"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  filterStatus === s
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3.5 py-2 bg-neutral-100 rounded-xl text-xs font-medium text-neutral-700 focus:outline-none"
          >
            <option value="">All methods</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="STRIPE_CONNECT">Stripe Connect</option>
            <option value="PAYPAL">PayPal</option>
            <option value="WISE">Wise</option>
          </select>

          <button
            onClick={() => fetchSettings(pagination.page)}
            className="p-2.5 bg-neutral-100 rounded-xl text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
          ) : settings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <ShieldCheck className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No payout settings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5">
                      Seller
                    </th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5">
                      Store
                    </th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5">
                      Method
                    </th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5">
                      Integration
                    </th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5">
                      Currency
                    </th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5">
                      Updated
                    </th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {settings.map((s) => {
                    const sellerName = s.seller
                      ? `${s.seller.firstName || ''} ${s.seller.lastName || ''}`.trim() ||
                        s.seller.email
                      : '—';
                    return (
                      <tr
                        key={s.id || s.sellerId}
                        className="hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-neutral-900">{sellerName}</p>
                            <p className="text-xs text-neutral-400">{s.seller?.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-neutral-600">{s.store?.name || '—'}</td>
                        <td className="px-5 py-4">
                          <MethodBadge method={s.paymentMethod} />
                        </td>
                        <td className="px-5 py-4">
                          <VerificationBadge settings={s} />
                        </td>
                        <td className="px-5 py-4">
                          {s.paymentMethod === 'STRIPE_CONNECT' && (
                            <div className="flex items-center gap-2">
                              <StripeStatusBadge status={s.stripeAccountStatus} />
                              {s.stripeAccountId && (
                                <button
                                  onClick={() => handleSyncStripe(s)}
                                  disabled={syncingId === s.id}
                                  className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
                                  title="Sync Stripe status"
                                >
                                  <RefreshCw
                                    className={`w-3.5 h-3.5 ${syncingId === s.id ? 'animate-spin' : ''}`}
                                  />
                                </button>
                              )}
                            </div>
                          )}
                          {s.paymentMethod === 'PAYPAL' && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.paypalVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}
                              >
                                {s.paypalVerified ? 'Verified' : 'Unverified'}
                              </span>
                            </div>
                          )}
                          {(s.paymentMethod === 'bank_transfer' || s.paymentMethod === 'WISE') && (
                            <span className="text-xs text-neutral-400">
                              {s.paymentMethod === 'bank_transfer'
                                ? s.bankName || '—'
                                : s.wiseEmail || '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-neutral-600 text-xs font-medium">
                          {s.payoutCurrency}
                        </td>
                        <td className="px-5 py-4 text-neutral-400 text-xs">
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {!s.verified && s.id && (
                              <button
                                onClick={() => setVerifyTarget(s)}
                                className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
                              >
                                Review
                              </button>
                            )}
                            {s.verified && s.id && (
                              <button
                                onClick={() => setVerifyTarget(s)}
                                className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-semibold hover:bg-neutral-200 transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                            {s.paymentMethod === 'STRIPE_CONNECT' && s.stripeAccountId && (
                              <>
                                <button
                                  onClick={() => handleStripeDashboard(s)}
                                  className="p-1.5 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors"
                                  title="Open Stripe Dashboard"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                {s.verified && s.stripeAccountStatus === 'active' && (
                                  <button
                                    onClick={() => setStripePayoutTarget(s)}
                                    className="p-1.5 bg-[#635BFF]/10 text-[#635BFF] rounded-lg hover:bg-[#635BFF]/20 transition-colors"
                                    title="Trigger manual payout"
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-500">
                Showing {settings.length} of {pagination.total} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchSettings(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg bg-neutral-100 text-neutral-600 disabled:opacity-40 hover:bg-neutral-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-neutral-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchSettings(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg bg-neutral-100 text-neutral-600 disabled:opacity-40 hover:bg-neutral-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {verifyTarget && (
          <VerifyModal
            settings={verifyTarget}
            onClose={() => setVerifyTarget(null)}
            onSaved={() => fetchSettings(pagination.page)}
          />
        )}
        {stripePayoutTarget && (
          <StripePayoutModal
            settings={stripePayoutTarget}
            onClose={() => setStripePayoutTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminPayoutSettingsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminPayoutSettingsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import Image from 'next/image';
import Link from 'next/link';
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
  ShieldCheck,
  Zap,
  Info,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  adminPayoutAPI,
  VerifyPayoutSettingsDto,
  AdminPayoutSettingsStats,
} from '@/lib/api/admin-payout-settings';
import { SellerPayoutSettings } from '@/lib/api/seller-payout';
import { useDebounce } from '@/hooks/use-debounce';

// ─── Method helpers ─────────────────────────────────────────────────────────

const METHOD_CONFIG: Record<
  string,
  { label: string; logo?: string; logoSize?: number; color: string; bg: string }
> = {
  STRIPE_CONNECT: {
    label: 'Stripe Connect',
    logo: '/logos/stripe-4.svg',
    logoSize: 26,
    color: 'text-[#635BFF]',
    bg: 'bg-[#635BFF]/10',
  },
  PAYPAL: {
    label: 'PayPal',
    logo: '/logos/paypal-4.svg',
    logoSize: 16,
    color: 'text-[#003087]',
    bg: 'bg-[#003087]/8',
  },
  WISE: {
    label: 'Wise',
    logo: '/logos/wise-1.svg',
    logoSize: 26,
    color: 'text-[#9FE870]',
    bg: 'bg-[#9FE870]/20',
  },
  bank_transfer: {
    label: 'Bank Transfer',
    color: 'text-neutral-600',
    bg: 'bg-neutral-100',
  },
};

function MethodBadge({ method }: { method: string }) {
  const cfg = METHOD_CONFIG[method] ?? METHOD_CONFIG.bank_transfer;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}
      >
        {cfg.logo ? (
          <Image
            src={cfg.logo}
            alt={cfg.label}
            width={cfg.logoSize}
            height={cfg.logoSize}
            className="object-contain"
          />
        ) : (
          <Building2 className="w-3.5 h-3.5 text-neutral-500" />
        )}
      </div>
      <span className="text-sm font-medium text-neutral-700">{cfg.label}</span>
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Integration detail cell ─────────────────────────────────────────────────

function IntegrationDetail({
  s,
  syncingId,
  onSync,
  onDashboard,
}: {
  s: SellerPayoutSettings;
  syncingId: string | null;
  onSync: () => void;
  onDashboard: () => void;
}) {
  if (s.paymentMethod === 'STRIPE_CONNECT') {
    return (
      <div className="flex items-center gap-2">
        <StripeStatusBadge status={s.stripeAccountStatus} />
        {s.stripeAccountId && (
          <>
            <button
              onClick={onSync}
              disabled={syncingId === s.id}
              className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
              title="Sync Stripe status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingId === s.id ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onDashboard}
              className="p-1 text-neutral-400 hover:text-[#635BFF] transition-colors"
              title="Open Stripe Dashboard"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        {!s.stripeAccountId && <span className="text-xs text-neutral-400">Not connected</span>}
      </div>
    );
  }
  if (s.paymentMethod === 'PAYPAL') {
    return (
      <div className="space-y-0.5">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            s.paypalVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          {s.paypalVerified ? 'Email verified' : 'Unverified'}
        </span>
        {s.paypalEmail && (
          <p className="text-xs text-neutral-400 truncate max-w-[160px]">{s.paypalEmail}</p>
        )}
      </div>
    );
  }
  if (s.paymentMethod === 'WISE') {
    return (
      <div className="space-y-0.5">
        {s.wiseEmail && (
          <p className="text-xs text-neutral-600 truncate max-w-[160px]">{s.wiseEmail}</p>
        )}
        {s.wiseRecipientId && <p className="text-xs text-neutral-400">ID: {s.wiseRecipientId}</p>}
        {!s.wiseEmail && <span className="text-xs text-neutral-400">—</span>}
      </div>
    );
  }
  // Bank transfer
  return (
    <div className="space-y-0.5">
      {s.bankName && <p className="text-xs text-neutral-600 font-medium">{s.bankName}</p>}
      {s.bankCountry && <p className="text-xs text-neutral-400">{s.bankCountry}</p>}
      {s.accountNumber && <p className="text-xs text-neutral-400 font-mono">{s.accountNumber}</p>}
      {!s.bankName && !s.accountNumber && (
        <span className="text-xs text-neutral-400">Details not provided</span>
      )}
    </div>
  );
}

// ─── Verify / Revoke Modal ───────────────────────────────────────────────────

interface VerifyModalProps {
  settings: SellerPayoutSettings;
  mode: 'review' | 'revoke';
  onClose: () => void;
  onSaved: () => void;
}

function VerifyModal({ settings, mode, onClose, onSaved }: VerifyModalProps) {
  const [action, setAction] = useState<'verify' | 'reject'>(
    mode === 'revoke' ? 'reject' : 'verify'
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const sellerName = settings.seller
    ? `${settings.seller.firstName || ''} ${settings.seller.lastName || ''}`.trim() ||
      settings.seller.email
    : 'Unknown Seller';

  const handleSubmit = async () => {
    if (!settings.id) return;
    if (action === 'reject' && !notes.trim()) return;
    setSaving(true);
    try {
      const dto: VerifyPayoutSettingsDto = {
        verified: action === 'verify',
        rejectionNotes: action === 'reject' ? notes : undefined,
      };
      await adminPayoutAPI.verify(settings.id, dto);
      toast.success(action === 'verify' ? 'Settings verified' : 'Settings rejected');
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
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-neutral-900">
            {mode === 'revoke' ? 'Revoke Verification' : 'Review Payout Settings'}
          </h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-neutral-500 mb-5">
          {sellerName} · {settings.store?.name}
        </p>

        {/* Settings summary */}
        <div className="bg-neutral-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Method</span>
            <MethodBadge method={settings.paymentMethod} />
          </div>
          {settings.paymentMethod === 'bank_transfer' && settings.bankName && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Bank</span>
              <span className="font-medium text-neutral-800">{settings.bankName}</span>
            </div>
          )}
          {settings.paymentMethod === 'bank_transfer' && settings.accountNumber && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Account</span>
              <span className="font-medium text-neutral-800 font-mono">
                {settings.accountNumber}
              </span>
            </div>
          )}
          {settings.paymentMethod === 'bank_transfer' && settings.bankCountry && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Country</span>
              <span className="font-medium text-neutral-800">{settings.bankCountry}</span>
            </div>
          )}
          {settings.paymentMethod === 'STRIPE_CONNECT' && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Stripe Status</span>
              <StripeStatusBadge status={settings.stripeAccountStatus} />
            </div>
          )}
          {settings.paymentMethod === 'PAYPAL' && (
            <>
              <div className="flex justify-between">
                <span className="text-neutral-500">PayPal Email</span>
                <span className="font-medium text-neutral-800">{settings.paypalEmail || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Verified</span>
                <span
                  className={`font-medium ${settings.paypalVerified ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {settings.paypalVerified ? 'Yes' : 'No'}
                </span>
              </div>
            </>
          )}
          {settings.paymentMethod === 'WISE' && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Wise Email</span>
              <span className="font-medium text-neutral-800">{settings.wiseEmail || '—'}</span>
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

        {/* Action tabs — only show for review mode; revoke always rejects */}
        {mode === 'review' && (
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
        )}

        {(action === 'reject' || mode === 'revoke') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              {mode === 'revoke' ? 'Reason for revocation' : 'Rejection reason'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={
                mode === 'revoke'
                  ? 'e.g. Bank account details changed, re-verification required…'
                  : 'Explain why these payout settings are being rejected…'
              }
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
            disabled={saving || ((action === 'reject' || mode === 'revoke') && !notes.trim())}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              action === 'verify' && mode !== 'revoke'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : mode === 'revoke' ? (
              'Revoke Verification'
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

// ─── Manual Stripe Payout Modal ───────────────────────────────────────────────

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
          <button onClick={onClose} className="ml-auto p-1 text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
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

// ─── Empty state with guidance ───────────────────────────────────────────────

function EmptyStateGuide() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
        <ShieldCheck className="w-7 h-7 text-neutral-400" />
      </div>
      <h3 className="text-base font-semibold text-neutral-800 mb-1">No payout settings found</h3>
      <p className="text-sm text-neutral-500 max-w-md mb-8">
        Sellers configure their payout method from their seller dashboard. Once submitted, their
        settings appear here for admin verification before payouts can be sent.
      </p>

      <div className="w-full max-w-xl bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-left">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
          How payout settings flow
        </p>
        <div className="space-y-3">
          {[
            {
              step: '1',
              title: 'Seller configures payout method',
              desc: 'Via /seller/payout-settings — chooses Bank Transfer, Stripe Connect, PayPal, or Wise',
              color: 'bg-neutral-900 text-white',
            },
            {
              step: '2',
              title: 'Admin reviews & verifies',
              desc: 'Settings appear here. Click Review → Verify to approve or Reject with a reason',
              color: 'bg-amber-500 text-white',
            },
            {
              step: '3',
              title: 'Payouts execute automatically',
              desc: 'Once verified, the payout scheduler includes this seller in the next cycle',
              color: 'bg-emerald-600 text-white',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}
              >
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">{title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-neutral-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <p className="text-xs text-neutral-500">
            Bank Transfer and Wise payouts require manual wire transfers after creating payout
            records. Stripe Connect and PayPal are executed automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Row skeleton ────────────────────────────────────────────────────────────

function RowSkeleton() {
  const p = 'bg-neutral-200 rounded animate-pulse';
  return (
    <tr>
      {[40, 32, 24, 20, 32, 16, 20].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} ${p}`} />
        </td>
      ))}
      <td className="px-5 py-4">
        <div className={`h-7 w-16 ${p}`} />
      </td>
    </tr>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

function AdminPayoutSettingsContent() {
  const [settings, setSettings] = useState<SellerPayoutSettings[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [stats, setStats] = useState<AdminPayoutSettingsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>(
    'all'
  );
  const [filterMethod, setFilterMethod] = useState('');
  const [verifyTarget, setVerifyTarget] = useState<{
    settings: SellerPayoutSettings;
    mode: 'review' | 'revoke';
  } | null>(null);
  const [stripePayoutTarget, setStripePayoutTarget] = useState<SellerPayoutSettings | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const currentPage = useRef(1);

  const fetchSettings = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      currentPage.current = page;
      try {
        const filters: Parameters<typeof adminPayoutAPI.getAll>[0] = {
          page,
          limit: 20,
          search: debouncedSearch || undefined,
        };
        if (filterStatus === 'verified') filters.verified = true;
        if (filterStatus === 'pending') filters.verified = false;
        if (filterStatus === 'rejected') filters.verified = false;
        if (filterMethod) filters.paymentMethod = filterMethod;

        const res = await adminPayoutAPI.getAll(filters);

        // api.get unwraps { success, data: { data, pagination, stats } }
        // so res = { data: [...], pagination: {...}, stats: {...} }
        let data = res?.data || [];

        // Client-side sub-filter for rejected vs pending (backend only has verified boolean)
        if (filterStatus === 'rejected')
          data = data.filter((s: SellerPayoutSettings) => !s.verified && !!s.rejectionNotes);
        if (filterStatus === 'pending')
          data = data.filter((s: SellerPayoutSettings) => !s.verified && !s.rejectionNotes);

        setSettings(data);
        setPagination(res?.pagination || { page: 1, limit: 20, total: data.length, totalPages: 1 });
        if (res?.stats) setStats(res.stats);
      } catch {
        toast.error('Failed to load payout settings');
      } finally {
        setIsLoading(false);
      }
    },
    [filterStatus, filterMethod, debouncedSearch]
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
      fetchSettings(currentPage.current);
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

  const pendingCount = stats?.pending ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title="Payout Settings"
        description="Review and verify seller payout configurations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Payout Settings' },
        ]}
        actions={
          <Link
            href="/admin/payouts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors"
          >
            Payout History <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Pending attention banner */}
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              {pendingCount} seller payout setting{pendingCount !== 1 ? 's' : ''} awaiting your
              review. Sellers cannot receive payouts until verified.
            </p>
            <button
              onClick={() => setFilterStatus('pending')}
              className="ml-auto px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors flex-shrink-0"
            >
              Review Pending
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
          {[
            {
              label: 'Total Sellers',
              value: stats?.total ?? 0,
              icon: <ShieldCheck className="w-4 h-4 text-neutral-500" />,
              bg: 'bg-neutral-100',
              onClick: () => setFilterStatus('all'),
              active: filterStatus === 'all',
            },
            {
              label: 'Pending',
              value: stats?.pending ?? 0,
              icon: <Clock className="w-4 h-4 text-amber-500" />,
              bg: 'bg-amber-50',
              onClick: () => setFilterStatus('pending'),
              active: filterStatus === 'pending',
            },
            {
              label: 'Verified',
              value: stats?.verified ?? 0,
              icon: <BadgeCheck className="w-4 h-4 text-emerald-500" />,
              bg: 'bg-emerald-50',
              onClick: () => setFilterStatus('verified'),
              active: filterStatus === 'verified',
            },
            {
              label: 'Rejected',
              value: stats?.rejected ?? 0,
              icon: <XCircle className="w-4 h-4 text-red-500" />,
              bg: 'bg-red-50',
              onClick: () => setFilterStatus('rejected'),
              active: filterStatus === 'rejected',
            },
            {
              label: 'Stripe Connect',
              value: stats?.byMethod?.STRIPE_CONNECT ?? 0,
              icon: (
                <Image
                  src="/logos/stripe-4.svg"
                  alt="Stripe"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              ),
              bg: 'bg-[#635BFF]/10',
              onClick: () =>
                setFilterMethod(filterMethod === 'STRIPE_CONNECT' ? '' : 'STRIPE_CONNECT'),
              active: filterMethod === 'STRIPE_CONNECT',
            },
            {
              label: 'PayPal',
              value: stats?.byMethod?.PAYPAL ?? 0,
              icon: (
                <Image
                  src="/logos/paypal-4.svg"
                  alt="PayPal"
                  width={12}
                  height={12}
                  className="object-contain"
                />
              ),
              bg: 'bg-[#003087]/8',
              onClick: () => setFilterMethod(filterMethod === 'PAYPAL' ? '' : 'PAYPAL'),
              active: filterMethod === 'PAYPAL',
            },
            {
              label: 'Bank Transfer',
              value: stats?.byMethod?.bank_transfer ?? 0,
              icon: <Building2 className="w-4 h-4 text-neutral-500" />,
              bg: 'bg-neutral-100',
              onClick: () =>
                setFilterMethod(filterMethod === 'bank_transfer' ? '' : 'bank_transfer'),
              active: filterMethod === 'bank_transfer',
            },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className={`bg-white rounded-2xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-sm ${
                stat.active ? 'border-black shadow-sm' : 'border-neutral-200'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900 leading-none">{stat.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by seller, store, email, bank…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm focus:outline-none w-full text-neutral-800 placeholder:text-neutral-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
            onClick={() => fetchSettings(currentPage.current)}
            className="p-2.5 bg-neutral-100 rounded-xl text-neutral-600 hover:bg-neutral-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Active filter chips */}
        {(filterStatus !== 'all' || filterMethod || search) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-neutral-500">Filtering by:</span>
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                Status: {filterStatus}
                <button
                  onClick={() => setFilterStatus('all')}
                  className="hover:text-red-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterMethod && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                Method: {METHOD_CONFIG[filterMethod]?.label ?? filterMethod}
                <button onClick={() => setFilterMethod('')} className="hover:text-red-500 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                Search: {search}
                <button onClick={() => setSearch('')} className="hover:text-red-500 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterMethod('');
                setSearch('');
              }}
              className="text-xs text-neutral-500 hover:text-neutral-800 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          {isLoading ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {[
                    'Seller',
                    'Store',
                    'Method',
                    'Status',
                    'Details',
                    'Currency',
                    'Updated',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <RowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          ) : settings.length === 0 ? (
            <EmptyStateGuide />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    {[
                      'Seller',
                      'Store',
                      'Method',
                      'Status',
                      'Details',
                      'Currency',
                      'Updated',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3.5"
                      >
                        {h}
                      </th>
                    ))}
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
                        className="hover:bg-neutral-50/70 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-neutral-900 leading-tight">{sellerName}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{s.seller?.email}</p>
                        </td>
                        <td className="px-5 py-4 text-neutral-600 text-sm">
                          {s.store?.name || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <MethodBadge method={s.paymentMethod} />
                        </td>
                        <td className="px-5 py-4">
                          <VerificationBadge settings={s} />
                          {s.rejectionNotes && (
                            <p
                              className="text-xs text-red-500 mt-1 max-w-[140px] truncate"
                              title={s.rejectionNotes}
                            >
                              {s.rejectionNotes}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <IntegrationDetail
                            s={s}
                            syncingId={syncingId}
                            onSync={() => handleSyncStripe(s)}
                            onDashboard={() => handleStripeDashboard(s)}
                          />
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
                                onClick={() => setVerifyTarget({ settings: s, mode: 'review' })}
                                className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
                              >
                                Review
                              </button>
                            )}
                            {s.verified && s.id && (
                              <button
                                onClick={() => setVerifyTarget({ settings: s, mode: 'revoke' })}
                                className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                            {s.paymentMethod === 'STRIPE_CONNECT' &&
                              s.verified &&
                              s.stripeAccountStatus === 'active' && (
                                <button
                                  onClick={() => setStripePayoutTarget(s)}
                                  className="p-1.5 bg-[#635BFF]/10 text-[#635BFF] rounded-lg hover:bg-[#635BFF]/20 transition-colors"
                                  title="Trigger manual Stripe payout"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                </button>
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
          {!isLoading && pagination.totalPages > 1 && (
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
            settings={verifyTarget.settings}
            mode={verifyTarget.mode}
            onClose={() => setVerifyTarget(null)}
            onSaved={() => fetchSettings(currentPage.current)}
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

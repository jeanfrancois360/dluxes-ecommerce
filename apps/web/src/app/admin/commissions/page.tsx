'use client';
import { safeJson } from '@/lib/safe-fetch';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nextpik/ui';
import { toast } from 'sonner';
import {
  Percent,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Download,
  DollarSign,
  Clock,
  ChevronDown,
  Check,
  Loader2,
  Tag,
} from 'lucide-react';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { useDebounce } from '@/hooks/use-debounce';

interface SellerCommissionOverride {
  id: string;
  sellerId: string | null;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionRate: number;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  categoryId: string | null;
  isActive: boolean;
  priority: number;
  validFrom: string | null;
  validUntil: string | null;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  seller: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// ─── Seller searchable combobox ───────────────────────────────────────────────
function SellerCombobox({
  value,
  displayValue,
  onChange,
  disabled,
}: {
  value: string;
  displayValue: string;
  onChange: (id: string, email: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [sellers, setSellers] = useState<
    Array<{ id: string; email: string; firstName: string; lastName: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Fetch sellers: load 5 by default on open, filter when query is provided
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const param = debouncedQuery.trim()
      ? `search=${encodeURIComponent(debouncedQuery)}`
      : 'pageSize=5';
    fetch(`/api/admin/users?${param}&role=SELLER`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    })
      .then((r) => r.json())
      .then((data) =>
        setSellers((Array.isArray(data) ? data : []).slice(0, debouncedQuery.trim() ? 10 : 5))
      )
      .catch(() => setSellers([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery, isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = value ? displayValue || 'Selected seller' : '';

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        className={`flex items-center gap-2 w-full px-3 py-2.5 border-2 rounded-lg cursor-text transition-all text-sm font-medium ${
          isOpen
            ? 'border-blue-500 ring-3 ring-blue-500/15 bg-white shadow-sm'
            : 'border-gray-300 bg-white hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none bg-gray-50' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={isOpen ? query : displayName}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setQuery('');
            }
          }}
          placeholder={value ? displayName : 'Search by name or email…'}
          className="flex-1 outline-none bg-transparent placeholder:text-gray-400 text-gray-900 min-w-0 disabled:cursor-not-allowed"
          autoComplete="off"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('', '');
              setQuery('');
            }}
            className="text-gray-400 hover:text-gray-600 flex-none p-0.5 rounded hover:bg-gray-100 transition-colors"
            tabIndex={-1}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-none transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500">
              {query ? `Searching for "${query}"` : 'Recent sellers — type to filter'}
            </span>
            {loading && <Loader2 className="w-3 h-3 text-gray-400 animate-spin ml-auto" />}
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading && sellers.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading sellers…
              </div>
            )}
            {!loading && sellers.length === 0 && (
              <div className="py-6 text-sm text-gray-400 text-center">
                {query ? `No sellers found for "${query}"` : 'No sellers available'}
              </div>
            )}
            {sellers.map((s) => {
              const initials =
                ((s.firstName?.[0] ?? '') + (s.lastName?.[0] ?? '')).toUpperCase() || '?';
              const isSelected = value === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                  }`}
                  onClick={() => {
                    onChange(s.id, s.email);
                    setIsOpen(false);
                    setQuery('');
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}
                    >
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          {!query && sellers.length > 0 && (
            <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
              Showing first {sellers.length} sellers · type to search all
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category searchable combobox ─────────────────────────────────────────────
function CategoryComboboxField({
  categories,
  value,
  onChange,
}: {
  categories: Array<{ id: string; name: string; slug: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = categories.find((c) => c.id === value);
  // Show first 5 by default; filter when query is provided
  const filtered = query.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : categories.slice(0, 5);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        className={`flex items-center gap-2 w-full px-3 py-2.5 border-2 rounded-lg cursor-text transition-all text-sm font-medium ${
          isOpen
            ? 'border-blue-500 ring-3 ring-blue-500/15 bg-white shadow-sm'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : (selected?.name ?? '')}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setQuery('');
            }
          }}
          placeholder={selected ? selected.name : 'All categories (or search…)'}
          className="flex-1 outline-none bg-transparent placeholder:text-gray-400 text-gray-900 min-w-0 text-sm"
          autoComplete="off"
        />
        {selected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setQuery('');
            }}
            className="text-gray-400 hover:text-gray-600 flex-none p-0.5 rounded hover:bg-gray-100 transition-colors"
            tabIndex={-1}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-none transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500">
              {query
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`
                : `${Math.min(categories.length, 5)} of ${categories.length} categories · type to search`}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {/* All categories option */}
            <button
              type="button"
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                !value
                  ? 'bg-blue-50 border-l-2 border-l-blue-500 font-semibold text-blue-700'
                  : 'hover:bg-gray-50 border-l-2 border-l-transparent text-gray-600'
              }`}
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setQuery('');
              }}
            >
              <span className="flex-1">All categories</span>
              {!value && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            </button>

            {filtered.map((c) => {
              const isSelected = value === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-l-2 border-l-blue-500 font-semibold text-blue-700'
                      : 'hover:bg-gray-50 border-l-2 border-l-transparent text-gray-900'
                  }`}
                  onClick={() => {
                    onChange(c.id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                >
                  <span className="flex-1 truncate">{c.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>

          {!query && categories.length > 5 && (
            <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
              Showing first 5 · type to search all {categories.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommissionOverridesContent() {
  const t = useTranslations('adminCommissions');
  const [overrides, setOverrides] = useState<SellerCommissionOverride[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<SellerCommissionOverride | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    sellerId: '',
    sellerEmail: '',
    commissionType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    commissionRate: '',
    minOrderValue: '',
    maxOrderValue: '',
    categoryId: '',
    validFrom: '',
    validUntil: '',
    notes: '',
  });

  useEffect(() => {
    fetchOverrides();
    fetchCategories();
  }, []);

  const fetchOverrides = async () => {
    try {
      const response = await fetch('/api/admin/commission/overrides', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await safeJson(response);
        setOverrides(data);
      }
    } catch (error) {
      console.error('Error fetching overrides:', error);
      toast.error(t('toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`);
      if (response.ok) {
        const result = await safeJson(response);
        // Backend wraps data in {success: true, data: [...]}
        const data = result.success ? result.data : result;
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const active = overrides.filter((o) => o.isActive);
    const inactive = overrides.filter((o) => !o.isActive);
    const percentageType = overrides.filter((o) => o.commissionType === 'PERCENTAGE');
    const avgRate =
      percentageType.length > 0
        ? percentageType.reduce((sum, o) => sum + Number(o.commissionRate), 0) /
          percentageType.length
        : 0;
    const lowestRate =
      percentageType.length > 0
        ? Math.min(...percentageType.map((o) => Number(o.commissionRate)))
        : 0;
    const highestRate =
      percentageType.length > 0
        ? Math.max(...percentageType.map((o) => Number(o.commissionRate)))
        : 0;

    // Expiring soon (within 30 days)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = overrides.filter((o) => {
      if (!o.validUntil) return false;
      const validUntil = new Date(o.validUntil);
      return validUntil <= thirtyDaysLater && validUntil > now;
    }).length;

    // Count by scope
    const sellerOnly = overrides.filter((o) => o.sellerId && !o.categoryId).length;
    const categoryOnly = overrides.filter((o) => !o.sellerId && o.categoryId).length;
    const specific = overrides.filter((o) => o.sellerId && o.categoryId).length;

    return {
      total: overrides.length,
      active: active.length,
      inactive: inactive.length,
      avgRate,
      lowestRate,
      highestRate,
      expiringSoon,
      sellerOnly,
      categoryOnly,
      specific,
    };
  }, [overrides]);

  // Filter and sort
  const filteredOverrides = useMemo(() => {
    let filtered = [...overrides];

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.seller?.email.toLowerCase().includes(search) ||
          (o.seller &&
            `${o.seller.firstName} ${o.seller.lastName}`.toLowerCase().includes(search)) ||
          o.category?.name.toLowerCase().includes(search) ||
          o.notes?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => (statusFilter === 'active' ? o.isActive : !o.isActive));
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((o) => o.commissionType === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'none') {
        filtered = filtered.filter((o) => !o.categoryId);
      } else {
        filtered = filtered.filter((o) => o.categoryId === categoryFilter);
      }
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'rate_high':
        filtered.sort((a, b) => Number(b.commissionRate) - Number(a.commissionRate));
        break;
      case 'rate_low':
        filtered.sort((a, b) => Number(a.commissionRate) - Number(b.commissionRate));
        break;
      case 'seller':
        filtered.sort((a, b) => {
          const aName = a.seller ? `${a.seller.firstName} ${a.seller.lastName}` : 'ZZZ';
          const bName = b.seller ? `${b.seller.firstName} ${b.seller.lastName}` : 'ZZZ';
          return aName.localeCompare(bName);
        });
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [overrides, debouncedSearch, statusFilter, typeFilter, categoryFilter, sortBy]);

  // Bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOverrides.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOverrides.map((o) => o.id)));
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
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    debouncedSearch !== '';

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  // Bulk actions
  const handleBulkExport = () => {
    toast.success(t('bulkActions.exportSuccess', { count: selectedIds.size }));
    setSelectedIds(new Set());
  };

  const handleBulkActivate = async () => {
    if (!confirm(t('bulkActions.confirmActivate', { count: selectedIds.size }))) return;
    let success = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/commission/overrides/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({ isActive: true }),
        });
        if (res.ok) success++;
      } catch {}
    }
    toast.success(t('bulkActions.activateSuccess', { count: success }));
    setSelectedIds(new Set());
    fetchOverrides();
  };

  const handleBulkDeactivate = async () => {
    if (!confirm(t('bulkActions.confirmDeactivate', { count: selectedIds.size }))) return;
    let success = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/commission/overrides/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({ isActive: false }),
        });
        if (res.ok) success++;
      } catch {}
    }
    toast.success(t('bulkActions.deactivateSuccess', { count: success }));
    setSelectedIds(new Set());
    fetchOverrides();
  };

  const handleBulkDelete = async () => {
    if (!confirm(t('bulkActions.confirmDelete', { count: selectedIds.size }))) return;

    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/admin/commission/overrides/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
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

    toast.success(t('bulkActions.deleteSuccess', { count: success, failed }));
    setSelectedIds(new Set());
    fetchOverrides();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // sellerId is set directly by SellerCombobox — no runtime email lookup needed
    const sellerId = formData.sellerId || null;

    // Validate: At least one of seller or category must be selected
    const categoryId =
      formData.categoryId && formData.categoryId !== '' && formData.categoryId !== 'all'
        ? formData.categoryId
        : null;

    if (!sellerId && !categoryId) {
      toast.error('Please select either a seller or category (or both)');
      return;
    }

    try {
      const payload = {
        ...(sellerId && { sellerId }),
        ...(categoryId && { categoryId }),
        commissionType: formData.commissionType,
        commissionRate: parseFloat(formData.commissionRate),
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
        maxOrderValue: formData.maxOrderValue ? parseFloat(formData.maxOrderValue) : undefined,
        validFrom: formData.validFrom || undefined,
        validUntil: formData.validUntil || undefined,
        notes: formData.notes || undefined,
        approvedBy: 'admin',
      };

      const url = editingOverride
        ? `/api/admin/commission/overrides/${editingOverride.id}`
        : '/api/admin/commission/overrides';

      const response = await fetch(url, {
        method: editingOverride ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingOverride ? t('toast.updateSuccess') : t('toast.createSuccess'));
        setDialogOpen(false);
        resetForm();
        fetchOverrides();
      } else {
        const error = await safeJson(response);
        toast.error(error.message || t('toast.saveError'));
      }
    } catch (error) {
      console.error('Error saving override:', error);
      toast.error(t('toast.saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('toast.deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/admin/commission/overrides/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        toast.success(t('toast.deleteSuccess'));
        fetchOverrides();
      } else {
        toast.error(t('toast.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting override:', error);
      toast.error(t('toast.deleteError'));
    }
  };

  const resetForm = () => {
    setFormData({
      sellerId: '',
      sellerEmail: '',
      commissionType: 'PERCENTAGE',
      commissionRate: '',
      minOrderValue: '',
      maxOrderValue: '',
      categoryId: '',
      validFrom: '',
      validUntil: '',
      notes: '',
    });
    setEditingOverride(null);
  };

  const handleEdit = (override: SellerCommissionOverride) => {
    setEditingOverride(override);
    setFormData({
      sellerId: override.sellerId || '',
      sellerEmail: override.seller?.email || '',
      commissionType: override.commissionType,
      commissionRate: override.commissionRate.toString(),
      minOrderValue: override.minOrderValue?.toString() || '',
      maxOrderValue: override.maxOrderValue?.toString() || '',
      categoryId: override.categoryId || '',
      validFrom: override.validFrom || '',
      validUntil: override.validUntil || '',
      notes: override.notes || '',
    });
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-end items-center">
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addOverride')}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalOverrides')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} {t('stats.active')}, {stats.inactive} {t('stats.inactive')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.averageRate')}</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.avgRate, 1)}%</div>
              <p className="text-xs text-muted-foreground">{t('stats.percentageOverrides')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.lowestRate')}</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(stats.lowestRate, 1)}%
              </div>
              <p className="text-xs text-muted-foreground">{t('stats.bestSellerRate')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.highestRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.highestRate, 1)}%</div>
              <p className="text-xs text-muted-foreground">{t('stats.maximumOverride')}</p>
            </CardContent>
          </Card>

          <Card className={stats.expiringSoon > 0 ? 'border-amber-200 bg-amber-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium ${stats.expiringSoon > 0 ? 'text-amber-700' : ''}`}
              >
                {t('stats.expiringSoon')}
              </CardTitle>
              <Clock
                className={`h-4 w-4 ${stats.expiringSoon > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${stats.expiringSoon > 0 ? 'text-amber-700' : ''}`}
              >
                {stats.expiringSoon}
              </div>
              <p
                className={`text-xs ${stats.expiringSoon > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}
              >
                {t('stats.within30Days')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="rounded-lg border p-4 bg-white space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('filters.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('filters.active')}</SelectItem>
                <SelectItem value="inactive">{t('filters.inactive')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('filters.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
                <SelectItem value="PERCENTAGE">{t('filters.percentage')}</SelectItem>
                <SelectItem value="FIXED">{t('filters.fixed')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('filters.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
                <SelectItem value="none">{t('filters.noCategory')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('filters.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('filters.newestFirst')}</SelectItem>
                <SelectItem value="oldest">{t('filters.oldestFirst')}</SelectItem>
                <SelectItem value="rate_high">{t('filters.rateHigh')}</SelectItem>
                <SelectItem value="rate_low">{t('filters.rateLow')}</SelectItem>
                <SelectItem value="seller">{t('filters.sellerName')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">{t('filters.activeFilters')}</span>
              {debouncedSearch && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.search')}: {debouncedSearch}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.status')}: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.type')}: {typeFilter}
                  <button
                    onClick={() => setTypeFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {categoryFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.category')}:{' '}
                  {categoryFilter === 'none'
                    ? t('filters.none')
                    : categories.find((c) => c.id === categoryFilter)?.name || categoryFilter}
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                {t('filters.clearAll')}
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('table.title')}</CardTitle>
            <CardDescription>{t('table.description')}</CardDescription>
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
                          filteredOverrides.length > 0 &&
                          selectedIds.size === filteredOverrides.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300"
                      />
                    </TableHead>
                    <TableHead>{t('table.headers.seller')}</TableHead>
                    <TableHead>{t('table.headers.category')}</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>{t('table.headers.rate')}</TableHead>
                    <TableHead>{t('table.headers.type')}</TableHead>
                    <TableHead>{t('table.headers.orderRange')}</TableHead>
                    <TableHead>{t('table.headers.validity')}</TableHead>
                    <TableHead>{t('table.headers.status')}</TableHead>
                    <TableHead>{t('table.headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        {t('table.loading')}
                      </TableCell>
                    </TableRow>
                  ) : filteredOverrides.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        {t('table.noResults')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOverrides.map((override) => (
                      <TableRow
                        key={override.id}
                        className={selectedIds.has(override.id) ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(override.id)}
                            onChange={() => toggleSelect(override.id)}
                            className="w-4 h-4 rounded border-neutral-300"
                          />
                        </TableCell>
                        <TableCell>
                          {override.seller ? (
                            <div>
                              <div className="font-medium">
                                {override.seller.firstName} {override.seller.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {override.seller.email}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="secondary">All Sellers</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {override.category ? (
                            override.category.name
                          ) : override.seller ? (
                            <span className="text-muted-foreground">All Categories</span>
                          ) : (
                            <Badge variant="outline">Global</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {override.seller && override.category && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                              Specific
                            </Badge>
                          )}
                          {override.seller && !override.category && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                              Seller
                            </Badge>
                          )}
                          {!override.seller && override.category && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              Category
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {override.commissionType === 'PERCENTAGE' ? (
                            <span className="text-blue-600">{override.commissionRate}%</span>
                          ) : (
                            <span className="text-green-600">
                              ${formatCurrencyAmount(override.commissionRate, 2)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{override.commissionType}</Badge>
                        </TableCell>
                        <TableCell>
                          {override.minOrderValue || override.maxOrderValue ? (
                            <span className="text-sm">
                              ${override.minOrderValue || '0'} - ${override.maxOrderValue || '∞'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{t('table.any')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {override.validFrom || override.validUntil ? (
                            <div className="text-sm">
                              {override.validFrom && (
                                <div>
                                  {t('table.from')}:{' '}
                                  {new Date(override.validFrom).toLocaleDateString()}
                                </div>
                              )}
                              {override.validUntil && (
                                <div
                                  className={
                                    new Date(override.validUntil) < new Date() ? 'text-red-500' : ''
                                  }
                                >
                                  {t('table.until')}:{' '}
                                  {new Date(override.validUntil).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{t('table.always')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={override.isActive ? 'default' : 'secondary'}>
                            {override.isActive ? t('table.active') : t('table.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(override)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(override.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
              <span className="font-medium">
                {selectedIds.size} {t('bulkActions.selected')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-white hover:text-white hover:bg-slate-800"
              >
                {t('bulkActions.clearSelection')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleBulkExport} className="gap-2">
                <Download className="h-4 w-4" />
                {t('bulkActions.export')}
              </Button>
              <Button
                size="sm"
                onClick={handleBulkActivate}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                {t('bulkActions.activate')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkDeactivate}
                className="gap-2"
              >
                {t('bulkActions.deactivate')}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                {t('bulkActions.delete')}
              </Button>
            </div>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOverride ? t('dialog.editTitle') : t('dialog.createTitle')}
              </DialogTitle>
              <DialogDescription>{t('dialog.description')}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Validation Message */}
              {!formData.sellerEmail && (!formData.categoryId || formData.categoryId === 'all') && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-700">
                    ⚠️ Please select at least one: Seller OR Category (or both for specific
                    combination)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Seller <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <SellerCombobox
                    value={formData.sellerId}
                    displayValue={formData.sellerEmail}
                    onChange={(id, email) =>
                      setFormData({ ...formData, sellerId: id, sellerEmail: email })
                    }
                    disabled={!!editingOverride}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionType">
                    {t('dialog.type')} {t('dialog.required')}
                  </Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, commissionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">{t('dialog.typePercentage')}</SelectItem>
                      <SelectItem value="FIXED">{t('dialog.typeFixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionRate">
                    {formData.commissionType === 'PERCENTAGE'
                      ? t('dialog.ratePercent')
                      : t('dialog.rateAmount')}{' '}
                    {t('dialog.required')}
                  </Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.01"
                    placeholder={
                      formData.commissionType === 'PERCENTAGE'
                        ? t('dialog.ratePlaceholderPercent')
                        : t('dialog.ratePlaceholderAmount')
                    }
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Category <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <CategoryComboboxField
                    categories={categories}
                    value={formData.categoryId === 'all' ? '' : formData.categoryId}
                    onChange={(id) => setFormData({ ...formData, categoryId: id })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minOrderValue">{t('dialog.minOrderValue')}</Label>
                  <Input
                    id="minOrderValue"
                    type="number"
                    step="0.01"
                    placeholder={t('dialog.minOrderPlaceholder')}
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxOrderValue">{t('dialog.maxOrderValue')}</Label>
                  <Input
                    id="maxOrderValue"
                    type="number"
                    step="0.01"
                    placeholder={t('dialog.maxOrderPlaceholder')}
                    value={formData.maxOrderValue}
                    onChange={(e) => setFormData({ ...formData, maxOrderValue: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validFrom">{t('dialog.validFrom')}</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validUntil">{t('dialog.validUntil')}</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('dialog.notes')}</Label>
                <Input
                  id="notes"
                  placeholder={t('dialog.notesPlaceholder')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('dialog.cancel')}
                </Button>
                <Button type="submit">
                  {editingOverride ? t('dialog.updateOverride') : t('dialog.createOverride')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function CommissionOverridesPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CommissionOverridesContent />
      </AdminLayout>
    </AdminRoute>
  );
}

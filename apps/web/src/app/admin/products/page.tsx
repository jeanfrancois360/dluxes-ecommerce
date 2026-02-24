'use client';

/**
 * Admin Products Management Page
 *
 * Standardized to match Customer Management Module pattern
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { StockStatusBadge } from '@/components/admin/stock-status-badge';
import { BulkInventoryModal } from '@/components/admin/bulk-inventory-modal';
import { useAdminProducts } from '@/hooks/use-admin';
import { useDebounce } from '@/hooks/use-debounce';
import { adminProductsApi } from '@/lib/api/admin';
import { categoriesAPI, Category } from '@/lib/api/categories';
import { toast, standardToasts } from '@/lib/utils/toast';
import Link from 'next/link';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { useInventorySettings } from '@/hooks/use-inventory-settings';
import { useTranslations } from 'next-intl';

interface ProductStats {
  total: number;
  active: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
}

function ProductsContent() {
  const t = useTranslations('adminProducts');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showBulkInventoryModal, setShowBulkInventoryModal] = useState(false);
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    active: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Debounce search
  const search = useDebounce(searchInput, 500);

  // Fetch inventory settings
  const { lowStockThreshold } = useInventorySettings();

  // Parse sort
  const [sortField, sortOrder] = sortBy.split('-');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesAPI.getAll();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  const { products, total, pages, loading, refetch } = useAdminProducts({
    page,
    limit,
    search,
    category,
    status,
    sortBy: sortField,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  // Calculate stats from products
  useEffect(() => {
    const calculateStats = async () => {
      try {
        setStatsLoading(true);
        // Fetch all products for stats calculation
        const allProducts = await adminProductsApi.getAll({ limit: 1000 });
        const prods = allProducts.products;

        const activeCount = prods.filter((p) => p.status?.toUpperCase() === 'ACTIVE').length;
        const outOfStockCount = prods.filter(
          (p) => ((p as any).inventory ?? p.stock ?? 0) <= 0
        ).length;
        const lowStockCount = prods.filter((p) => {
          const inv = (p as any).inventory ?? p.stock ?? 0;
          return inv > 0 && inv <= lowStockThreshold;
        }).length;
        const totalValue = prods.reduce((sum, p) => {
          const inv = (p as any).inventory ?? p.stock ?? 0;
          return sum + Number(p.price) * inv;
        }, 0);

        setStats({
          total: allProducts.total,
          active: activeCount,
          outOfStock: outOfStockCount,
          lowStock: lowStockCount,
          totalValue,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    calculateStats();
  }, [lowStockThreshold]);

  // Filter logic
  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string }> = [];
    if (searchInput)
      filters.push({ key: 'search', label: t('activeFilters.search'), value: `"${searchInput}"` });
    if (category) {
      const cat = categories.find((c) => c.slug === category);
      filters.push({
        key: 'category',
        label: t('activeFilters.category'),
        value: cat?.name || category,
      });
    }
    if (status) filters.push({ key: 'status', label: t('activeFilters.status'), value: status });
    if (stockFilter)
      filters.push({
        key: 'stock',
        label: t('activeFilters.stock'),
        value:
          stockFilter === 'in_stock'
            ? t('activeFilters.inStock')
            : stockFilter === 'low_stock'
              ? t('activeFilters.lowStock')
              : t('activeFilters.outOfStock'),
      });
    if (sortBy !== 'createdAt-desc')
      filters.push({ key: 'sort', label: t('activeFilters.sort'), value: sortBy.split('-')[0] });
    return filters;
  }, [searchInput, category, status, stockFilter, sortBy, categories, t]);

  const hasActiveFilters = activeFilters.length > 0;
  const activeFilterCount = activeFilters.length;

  const clearFilters = () => {
    setSearchInput('');
    setCategory('');
    setStatus('');
    setStockFilter('');
    setSortBy('createdAt-desc');
    setPage(1);
  };

  const clearFilter = (key: string) => {
    switch (key) {
      case 'search':
        setSearchInput('');
        break;
      case 'category':
        setCategory('');
        break;
      case 'status':
        setStatus('');
        break;
      case 'stock':
        setStockFilter('');
        break;
      case 'sort':
        setSortBy('createdAt-desc');
        break;
    }
    setPage(1);
  };

  // Selection
  const allSelected = products.length > 0 && selectedIds.length === products.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!confirm(t('confirmations.deleteBulk', { count: selectedIds.length }))) return;
    try {
      await adminProductsApi.bulkDelete(selectedIds);
      toast.success(t('toasts.productsDeleted', { count: selectedIds.length }));
      setSelectedIds([]);
      refetch();
    } catch (error) {
      toast.error(t('toasts.bulkDeleteError'));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      await adminProductsApi.bulkUpdateStatus(selectedIds, newStatus);
      toast.success(t('toasts.productsUpdated', { count: selectedIds.length }));
      setSelectedIds([]);
      refetch();
    } catch (error) {
      toast.error(t('toasts.bulkUpdateError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmations.deleteProduct'))) return;
    try {
      await adminProductsApi.delete(id);
      toast.success(t('toasts.productDeleted'));
      refetch();
    } catch (error) {
      toast.error(t('toasts.deleteError'));
    }
  };

  const handleExport = () => {
    if (!products) return;
    const csv = [
      ['ID', 'Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'],
      ...products.map((p) => [
        p.id,
        p.name,
        p.sku || p.slug,
        typeof p.category === 'string' ? p.category : (p.category as any)?.name || 'N/A',
        p.price,
        (p as any).inventory ?? p.stock ?? 0,
        p.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  };

  const handleBulkExport = () => {
    const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
    const csv = [
      ['ID', 'Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'],
      ...selectedProducts.map((p) => [
        p.id,
        p.name,
        p.sku || p.slug,
        typeof p.category === 'string' ? p.category : (p.category as any)?.name || 'N/A',
        p.price,
        (p as any).inventory ?? p.stock ?? 0,
        p.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-selected-${selectedIds.length}.csv`;
    a.click();
  };

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">{t('actionsTitle')}</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg hover:border-[#CBB57B] hover:text-[#CBB57B] transition-all flex items-center gap-2 shadow-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {t('header.exportButton')}
              </button>
              <Link
                href="/admin/products/new"
                className="px-4 py-2.5 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {t('header.addProductButton')}
              </Link>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">{t('stats.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 mb-1">{t('stats.totalProducts')}</p>
                  <p className="text-2xl font-bold text-black">
                    {statsLoading ? '...' : formatNumber(stats.total)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 mb-1">{t('stats.activeProducts')}</p>
                  <p className="text-2xl font-bold text-black">
                    {statsLoading ? '...' : formatNumber(stats.active)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className={`bg-white rounded-xl shadow-sm border p-6 ${stats.outOfStock > 0 ? 'border-red-200 bg-red-50/30' : 'border-neutral-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 mb-1">{t('stats.outOfStock')}</p>
                  <p
                    className={`text-2xl font-bold ${stats.outOfStock > 0 ? 'text-red-600' : 'text-black'}`}
                  >
                    {statsLoading ? '...' : formatNumber(stats.outOfStock)}
                  </p>
                  {!statsLoading && stats.outOfStock > 0 && (
                    <p className="text-xs text-red-600 mt-1">{t('stats.needsAttention')}</p>
                  )}
                </div>
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.outOfStock > 0 ? 'bg-red-100' : 'bg-neutral-100'}`}
                >
                  <svg
                    className={`w-6 h-6 ${stats.outOfStock > 0 ? 'text-red-600' : 'text-neutral-600'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className={`bg-white rounded-xl shadow-sm border p-6 ${stats.lowStock > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-neutral-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 mb-1">{t('stats.lowStock')}</p>
                  <p
                    className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-amber-600' : 'text-black'}`}
                  >
                    {statsLoading ? '...' : formatNumber(stats.lowStock)}
                  </p>
                  {!statsLoading && stats.lowStock > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      &lt;{lowStockThreshold} {t('stats.units', { count: lowStockThreshold })}
                    </p>
                  )}
                </div>
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.lowStock > 0 ? 'bg-amber-100' : 'bg-neutral-100'}`}
                >
                  <svg
                    className={`w-6 h-6 ${stats.lowStock > 0 ? 'text-amber-600' : 'text-neutral-600'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 mb-1">{t('stats.totalValue')}</p>
                  <p className="text-2xl font-bold text-black">
                    {statsLoading ? '...' : `$${formatCurrencyAmount(stats.totalValue, 0)}`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">{t('filters.title')}</h2>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[250px] relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder={t('filters.searchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-white border border-neutral-300 text-black placeholder-neutral-400 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                disabled={loadingCategories}
                className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
              >
                <option value="">
                  {loadingCategories ? t('filters.loading') : t('filters.allCategories')}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
              >
                <option value="">{t('filters.allStatus')}</option>
                <option value="ACTIVE">{t('status.ACTIVE')}</option>
                <option value="DRAFT">{t('status.DRAFT')}</option>
                <option value="ARCHIVED">{t('status.ARCHIVED')}</option>
                <option value="OUT_OF_STOCK">{t('status.OUT_OF_STOCK')}</option>
              </select>

              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
              >
                <option value="">{t('filters.allStock')}</option>
                <option value="in_stock">{t('filters.inStock')}</option>
                <option value="low_stock">{t('filters.lowStock')}</option>
                <option value="out_of_stock">{t('filters.outOfStock')}</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
              >
                <option value="createdAt-desc">{t('sorting.newestFirst')}</option>
                <option value="createdAt-asc">{t('sorting.oldestFirst')}</option>
                <option value="price-desc">{t('sorting.priceHighToLow')}</option>
                <option value="price-asc">{t('sorting.priceLowToHigh')}</option>
                <option value="inventory-asc">{t('sorting.stockLowToHigh')}</option>
                <option value="inventory-desc">{t('sorting.stockHighToLow')}</option>
                <option value="name-asc">{t('sorting.nameAZ')}</option>
                <option value="name-desc">{t('sorting.nameZA')}</option>
              </select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  {t('filters.clear', { count: activeFilterCount })}
                </button>
              )}
            </div>

            {/* Active Filter Pills */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-200">
                {activeFilters.map((filter) => (
                  <span
                    key={filter.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm"
                  >
                    {filter.label}: {filter.value}
                    <button
                      onClick={() => clearFilter(filter.key)}
                      className="hover:text-neutral-900"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">{t('table.title')}</h2>
          <div className="relative bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto relative">
              {loading ? (
                <div className="p-16 text-center">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
                  </div>
                  <p className="mt-4 text-neutral-600 font-medium">{t('table.loading')}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="p-16 text-center">
                  <svg
                    className="w-16 h-16 mx-auto text-neutral-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <p className="text-neutral-600 font-medium">{t('table.noProducts')}</p>
                  <p className="text-neutral-500 text-sm mt-1">
                    {t('table.noProductsDescription')}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-4 py-4 w-[40px]">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-neutral-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        {t('table.headers.product')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        {t('table.headers.category')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        {t('table.headers.price')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        {t('table.headers.stock')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        {t('table.headers.status')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        {t('table.headers.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="group transition-all duration-200 hover:bg-neutral-50"
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            className="w-4 h-4 rounded border-neutral-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 min-w-[48px] min-h-[48px] bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center ring-2 ring-neutral-200">
                              {(product as any).heroImage ||
                              (product.images && product.images.length > 0) ? (
                                <img
                                  src={
                                    (product as any).heroImage ||
                                    (product.images[0] as any)?.url ||
                                    product.images[0]
                                  }
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <svg
                                  className="w-6 h-6 text-neutral-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="max-w-xs">
                              <div
                                className="text-sm font-semibold text-gray-900 leading-tight truncate group-hover:text-[#CBB57B] transition-colors"
                                title={product.name}
                              >
                                {product.name}
                              </div>
                              {product.sku && (
                                <div className="text-xs text-gray-500 mt-1 font-mono">
                                  SKU: {product.sku}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#CBB57B]/10 border border-[#CBB57B]/30 rounded-lg text-xs font-semibold text-[#9a8854]">
                            {typeof product.category === 'string'
                              ? product.category
                              : (product.category as any)?.name || t('table.na')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-black">
                          ${formatCurrencyAmount(Number(product.price), 2)}
                        </td>
                        <td className="px-6 py-4">
                          <StockStatusBadge
                            stock={(product as any).inventory ?? product.stock ?? 0}
                            lowStockThreshold={lowStockThreshold}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                              product.status?.toUpperCase() === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : product.status?.toUpperCase() === 'DRAFT'
                                  ? 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                product.status?.toUpperCase() === 'ACTIVE'
                                  ? 'bg-green-600'
                                  : product.status?.toUpperCase() === 'DRAFT'
                                    ? 'bg-neutral-600'
                                    : 'bg-red-600'
                              }`}
                            ></div>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CBB57B]/20 hover:bg-[#CBB57B]/30 border border-[#CBB57B]/30 text-[#CBB57B] rounded-lg text-xs font-semibold transition-all hover:scale-105"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              {t('actions.edit')}
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              {t('actions.delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && products.length > 0 && (
              <div className="px-6 py-4 border-t border-neutral-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-700">
                      {t('pagination.showing', {
                        start: (page - 1) * limit + 1,
                        end: Math.min(page * limit, total),
                        total,
                      })}
                    </span>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="ml-4 px-3 py-1.5 border border-neutral-300 bg-white text-black rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
                    >
                      <option value="10">{t('pagination.perPage', { count: 10 })}</option>
                      <option value="25">{t('pagination.perPage', { count: 25 })}</option>
                      <option value="50">{t('pagination.perPage', { count: 50 })}</option>
                      <option value="100">{t('pagination.perPage', { count: 100 })}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-neutral-300 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-[#CBB57B] transition-all"
                    >
                      {t('pagination.previous')}
                    </button>
                    <span className="text-sm text-neutral-700 font-medium px-3">
                      {t('pagination.page', { current: page, total: pages })}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(pages, page + 1))}
                      disabled={page === pages}
                      className="px-4 py-2 border border-neutral-300 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-[#CBB57B] transition-all"
                    >
                      {t('pagination.next')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Bulk Actions Bar (Fixed at Bottom) */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 text-white rounded-lg px-6 py-3 flex items-center gap-4 shadow-xl">
              <span className="font-medium text-sm">
                {selectedIds.length === 1
                  ? t('bulk.selected', { count: selectedIds.length })
                  : t('bulk.selectedPlural', { count: selectedIds.length })}
              </span>

              <div className="h-4 w-px bg-slate-600" />

              <button
                onClick={handleBulkExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {t('bulk.export')}
              </button>

              <button
                onClick={() => handleBulkStatusUpdate('ACTIVE')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t('bulk.activate')}
              </button>

              <button
                onClick={() => handleBulkStatusUpdate('ARCHIVED')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                {t('bulk.archive')}
              </button>

              <button
                onClick={() => setShowBulkInventoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                {t('bulk.adjustStock')}
              </button>

              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {t('bulk.delete')}
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
                title={t('bulk.clearSelection')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Bulk Inventory Modal */}
        <BulkInventoryModal
          open={showBulkInventoryModal}
          onOpenChange={setShowBulkInventoryModal}
          productIds={selectedIds}
          onSuccess={() => {
            refetch();
            setSelectedIds([]);
          }}
        />
      </div>
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <ProductsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

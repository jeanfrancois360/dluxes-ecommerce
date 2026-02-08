'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api/client';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/seller/page-header';
import { PlusCircle } from 'lucide-react';
interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  status: string;
  price: number;
  compareAtPrice: number | null;
  inventory: number;
  heroImage: string | null;
  viewCount: number;
  category: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function SellerProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('sellerProducts');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Bulk actions
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [page, statusFilter, sortBy, sortOrder, searchQuery]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
        sortBy,
        sortOrder,
      });

      const response = await api.get(`/seller/products?${params.toString()}`);

      setProducts(response.data || []);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedProducts.size === 0) return;

    try {
      setBulkActionLoading(true);
      await api.patch('/seller/products/bulk/status', {
        productIds: Array.from(selectedProducts),
        status,
      });

      // Refresh products
      await fetchProducts();
      setSelectedProducts(new Set());
      alert(t('alerts.bulkUpdateSuccess', { count: selectedProducts.size }));
    } catch (error: any) {
      alert(error?.data?.message || t('alerts.bulkUpdateFailed'));
    } finally {
      setBulkActionLoading(false);
      setShowBulkActions(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    if (!confirm(t('alerts.bulkDeleteConfirm', { count: selectedProducts.size }))) {
      return;
    }

    try {
      setBulkActionLoading(true);
      await api.delete('/seller/products/bulk/delete', {
        body: JSON.stringify({ productIds: Array.from(selectedProducts) }),
        headers: { 'Content-Type': 'application/json' },
      } as any);

      // Refresh products
      await fetchProducts();
      setSelectedProducts(new Set());
      alert(t('alerts.bulkDeleteSuccess', { count: selectedProducts.size }));
    } catch (error: any) {
      alert(error?.data?.message || t('alerts.bulkDeleteFailed'));
    } finally {
      setBulkActionLoading(false);
      setShowBulkActions(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(t('alerts.deleteConfirm', { name: productName }))) {
      return;
    }

    try {
      await api.delete(`/seller/products/${productId}`);
      await fetchProducts();
      alert(t('alerts.deleteSuccess'));
    } catch (error: any) {
      alert(error?.data?.message || t('alerts.deleteFailed'));
    }
  };

  const handleExport = () => {
    if (products.length === 0) return;

    // Export to CSV logic
    const csv = [
      ['ID', 'Name', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Views'],
      ...products.map((p) => [
        p.id,
        p.name,
        p.sku || p.slug,
        p.category?.name || 'N/A',
        p.price,
        p.inventory,
        p.status,
        p.viewCount,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success-light text-success-dark border-success-DEFAULT';
      case 'DRAFT':
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
      case 'OUT_OF_STOCK':
        return 'bg-error-light text-error-dark border-error-DEFAULT';
      case 'ARCHIVED':
        return 'bg-neutral-200 text-neutral-600 border-neutral-400';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const getInventoryColor = (inventory: number): string => {
    if (inventory === 0) return 'text-error-DEFAULT';
    if (inventory <= 10) return 'text-warning-DEFAULT';
    return 'text-success-DEFAULT';
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <PageHeader
        title={t('pageTitle')}
        description={t('pageSubtitle')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: '/seller' },
          { label: t('breadcrumbs.products') },
        ]}
        actions={
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-2 bg-black text-[#CBB57B] px-6 py-3 rounded-lg hover:bg-neutral-900 hover:text-[#D4C794] transition-all font-semibold border border-[#CBB57B]"
          >
            <PlusCircle className="w-5 h-5" />
            {t('addProduct')}
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all font-medium"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all font-medium cursor-pointer"
            >
              <option value="">{t('allStatus')}</option>
              <option value="ACTIVE">{t('statuses.ACTIVE')}</option>
              <option value="DRAFT">{t('statuses.DRAFT')}</option>
              <option value="OUT_OF_STOCK">{t('statuses.OUT_OF_STOCK')}</option>
              <option value="ARCHIVED">{t('statuses.ARCHIVED')}</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all font-medium cursor-pointer"
            >
              <option value="createdAt-desc">{t('sort.newestFirst')}</option>
              <option value="createdAt-asc">{t('sort.oldestFirst')}</option>
              <option value="name-asc">{t('sort.nameAZ')}</option>
              <option value="name-desc">{t('sort.nameZA')}</option>
              <option value="price-asc">{t('sort.priceLowHigh')}</option>
              <option value="price-desc">{t('sort.priceHighLow')}</option>
              <option value="inventory-asc">{t('sort.stockLowHigh')}</option>
              <option value="inventory-desc">{t('sort.stockHighLow')}</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="bg-gradient-to-r from-gold to-[#a89158] text-black rounded-2xl shadow-2xl p-4 border border-gold/50">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">
                {t('bulkActions.selected', { count: selectedProducts.size })}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleBulkStatusUpdate('ACTIVE')}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {t('bulkActions.activate')}
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('DRAFT')}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {t('bulkActions.draft')}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {t('bulkActions.delete')}
                </button>
                <button
                  onClick={() => setSelectedProducts(new Set())}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {t('bulkActions.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="relative bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">{t('empty.title')}</h3>
              <p className="text-neutral-600 mb-6">
                {searchQuery || statusFilter ? t('empty.subtitle') : t('empty.action')}
              </p>
              <Link
                href="/seller/products/new"
                className="inline-block bg-gold text-white px-6 py-3 rounded-lg hover:bg-gold/90 transition-colors font-semibold"
              >
                {t('addProduct')}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-neutral-200 bg-neutral-50">
                    <th className="px-6 py-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedProducts.size === products.length && products.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300 bg-white text-gold focus:ring-2 focus:ring-gold/20 focus:ring-offset-0 transition-all cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-black">
                        {t('table.image')} <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-black">
                        {t('table.product')}{' '}
                        <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-black">
                        {t('table.sku')} <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-black">
                        {t('table.category')}{' '}
                        <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-black">
                        {t('table.price')} <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-black">
                        {t('table.stock')} <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-black">
                        {t('table.status')} <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-black">
                        {t('table.actions')}{' '}
                        <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="group transition-all duration-200 hover:bg-neutral-50"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-4 h-4 rounded border-neutral-300 bg-white text-gold focus:ring-2 focus:ring-gold/20 focus:ring-offset-0 transition-all cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        {product.heroImage ? (
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden ring-2 ring-neutral-300 hover:ring-gold transition-all group">
                            <img
                              src={product.heroImage}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg flex items-center justify-center ring-2 ring-neutral-300">
                            <svg
                              className="w-7 h-7 text-neutral-400"
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
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-black group-hover:text-gold/80 transition-colors">
                          {product.name}
                        </div>
                        <div className="text-xs text-neutral-600 mt-0.5 font-medium">
                          {product.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-800 font-semibold">
                          {product.sku || product.slug}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold/10 border border-gold rounded-lg text-xs font-semibold text-gold">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                          {product.category?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-black">
                        ${formatCurrencyAmount(Number(product.price), 2)}
                        {product.compareAtPrice && (
                          <div className="text-xs text-neutral-500 line-through font-normal">
                            ${formatCurrencyAmount(Number(product.compareAtPrice), 2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getInventoryColor(product.inventory) === 'text-error-DEFAULT' ? 'bg-red-100 text-red-700 border border-red-300' : getInventoryColor(product.inventory) === 'text-warning-DEFAULT' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-green-100 text-green-700 border border-green-300'}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${getInventoryColor(product.inventory) === 'text-error-DEFAULT' ? 'bg-red-600' : getInventoryColor(product.inventory) === 'text-warning-DEFAULT' ? 'bg-yellow-600' : 'bg-green-600'}`}
                          ></div>
                          {product.inventory}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${product.status.toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-300' : product.status.toUpperCase() === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-neutral-100 text-neutral-700 border border-neutral-300'}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${product.status.toUpperCase() === 'ACTIVE' ? 'bg-green-600' : product.status.toUpperCase() === 'OUT_OF_STOCK' ? 'bg-red-600' : 'bg-neutral-600'}`}
                          ></div>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/seller/products/${product.id}/edit`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/20 hover:bg-gold/30 border border-gold/30 text-gold rounded-lg text-xs font-semibold transition-all hover:scale-105"
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
                            {t('table.edit')}
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-all hover:scale-105"
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
                            {t('table.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t-2 border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-700 font-medium">
                    {t.rich('pagination.showing', {
                      from: (page - 1) * 20 + 1,
                      to: Math.min(page * 20, total),
                      total,
                      bold: (chunks) => (
                        <strong className="font-bold text-neutral-900">{chunks}</strong>
                      ),
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border-2 border-neutral-300 bg-white text-black rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-gold transition-all"
                  >
                    {t('pagination.previous')}
                  </button>
                  <span className="text-sm text-black font-bold px-3">
                    {t('pagination.page', { current: page, total: totalPages })}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border-2 border-neutral-300 bg-white text-black rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-gold transition-all"
                  >
                    {t('pagination.next')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom accent border */}
          <div className="h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
        </div>

        {/* Export Button */}
        {products.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:border-gold/50 hover:text-gold transition-all flex items-center gap-2 shadow-lg font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {t('exportCSV')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api/client';

interface Product {
  id: string;
  name: string;
  slug: string;
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
    fetchProducts();
  }, [page, statusFilter, sortBy, sortOrder]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
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
      alert(`${selectedProducts.size} products updated successfully`);
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to update products');
    } finally {
      setBulkActionLoading(false);
      setShowBulkActions(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} products? This action cannot be undone.`)) {
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
      alert(`${selectedProducts.size} products deleted successfully`);
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to delete products');
    } finally {
      setBulkActionLoading(false);
      setShowBulkActions(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/seller/products/${productId}`);
      await fetchProducts();
      alert('Product deleted successfully');
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to delete product');
    }
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
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Products</h1>
              <p className="text-neutral-600 mt-1">Manage your product inventory</p>
            </div>
            <Link
              href="/seller/products/new"
              className="inline-flex items-center gap-2 bg-gold text-white px-6 py-3 rounded-lg hover:bg-gold/90 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="ARCHIVED">Archived</option>
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
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="inventory-asc">Stock (Low to High)</option>
                <option value="inventory-desc">Stock (High to Low)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gold/10 border border-gold rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-black">
                  {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedProducts(new Set())}
                  className="text-sm text-neutral-600 hover:text-black transition-colors"
                >
                  Clear selection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? 'Processing...' : 'Bulk Actions'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {showBulkActions && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-10"
                      >
                        <button
                          onClick={() => handleBulkStatusUpdate('ACTIVE')}
                          className="w-full px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
                        >
                          Set as Active
                        </button>
                        <button
                          onClick={() => handleBulkStatusUpdate('DRAFT')}
                          className="w-full px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
                        >
                          Set as Draft
                        </button>
                        <button
                          onClick={() => handleBulkStatusUpdate('ARCHIVED')}
                          className="w-full px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
                        >
                          Archive
                        </button>
                        <div className="border-t border-neutral-200 my-2" />
                        <button
                          onClick={handleBulkDelete}
                          className="w-full px-4 py-2 text-left hover:bg-error-light text-error-dark transition-colors"
                        >
                          Delete Selected
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">No products found</h3>
              <p className="text-neutral-600 mb-6">
                {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Get started by adding your first product'}
              </p>
              <Link
                href="/seller/products/new"
                className="inline-block bg-gold text-white px-6 py-3 rounded-lg hover:bg-gold/90 transition-colors font-semibold"
              >
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.size === products.length && products.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300 text-gold focus:ring-gold"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Inventory</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Views</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {products.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-gold focus:ring-gold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.heroImage ? (
                              <img
                                src={product.heroImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-black truncate">{product.name}</p>
                            {product.category && (
                              <p className="text-sm text-neutral-500">{product.category.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-black">
                            ${Number(product.price).toFixed(2)}
                          </p>
                          {product.compareAtPrice && (
                            <p className="text-sm text-neutral-500 line-through">
                              ${Number(product.compareAtPrice).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${getInventoryColor(product.inventory)}`}>
                          {product.inventory}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-600">{product.viewCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-2 hover:bg-error-light rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5 text-error-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-neutral-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-600">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} products
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-neutral-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

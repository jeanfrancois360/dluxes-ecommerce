'use client';

/**
 * Admin Products Management Page
 *
 * List all products with search, filter, sort, and bulk actions
 */

import React, { useState } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ModernTable } from '@/components/admin/modern-table';
import { useAdminProducts } from '@/hooks/use-admin';
import { adminProductsApi } from '@/lib/api/admin';
import { toast } from '@/lib/toast';
import Link from 'next/link';

function ProductsContent() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { products, total, pages, loading, refetch } = useAdminProducts({
    page,
    limit,
    search,
    category,
    status,
    sortBy,
    sortOrder,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && products) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) {
      return;
    }

    try {
      await adminProductsApi.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} products deleted successfully`);
      setSelectedIds([]);
      refetch();
    } catch (error) {
      toast.error('Failed to delete products');
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      await adminProductsApi.bulkUpdateStatus(selectedIds, newStatus);
      toast.success(`${selectedIds.length} products updated successfully`);
      setSelectedIds([]);
      refetch();
    } catch (error) {
      toast.error('Failed to update products');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await adminProductsApi.delete(id);
      toast.success('Product deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleExport = () => {
    if (!products) return;

    // Export to CSV logic
    const csv = [
      ['ID', 'Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'],
      ...products.map((p) => [p.id, p.name, p.sku, typeof p.category === 'string' ? p.category : (p.category as any)?.name || 'N/A', p.price, p.stock, p.status]),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Products</h1>
          <p className="text-neutral-600 mt-1">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors shadow-lg"
        >
          Add Product
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-all font-medium"
            />
          </div>
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-all font-medium cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="watches">Watches</option>
              <option value="jewelry">Jewelry</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-all font-medium cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-all font-medium cursor-pointer"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="stock-asc">Stock (Low-High)</option>
              <option value="stock-desc">Stock (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-[#CBB57B] to-[#a89158] text-black rounded-2xl shadow-2xl p-4 border border-[#CBB57B]/50">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">{selectedIds.length} products selected</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkStatusUpdate('active')}
                className="px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('inactive')}
                className="px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg"
              >
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="relative bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CBB57B] to-transparent"></div>

        <div className="overflow-x-auto relative">
          {loading ? (
            <div className="p-16 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-neutral-700 font-semibold">Loading products...</p>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="p-16 text-center">
              <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-neutral-600 font-medium">No products found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-neutral-200 bg-neutral-50">
                  <th className="px-6 py-4 text-left w-12">
                    <input
                      type="checkbox"
                      checked={products && selectedIds.length === products.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 bg-white text-[#CBB57B] focus:ring-2 focus:ring-[#CBB57B]/20 focus:ring-offset-0 transition-all cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Image <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Name <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">SKU <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Category <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Price <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Stock <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Status <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Actions <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {products.map((product) => (
                  <tr key={product.id} className="group transition-all duration-200 hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 bg-white text-[#CBB57B] focus:ring-2 focus:ring-[#CBB57B]/20 focus:ring-offset-0 transition-all cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {(product as any).heroImage || (product.images && product.images.length > 0) ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden ring-2 ring-neutral-300 hover:ring-[#CBB57B] transition-all group">
                          <img
                            src={(product as any).heroImage || ((product.images[0] as any)?.url || product.images[0])}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full bg-neutral-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg flex items-center justify-center ring-2 ring-neutral-300">
                          <svg className="w-7 h-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-black group-hover:text-[#9a8854] transition-colors">{product.name}</div>
                      <div className="text-xs text-neutral-600 mt-0.5 font-medium">{product.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-800 font-semibold">{product.sku || product.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#CBB57B]/10 border border-[#CBB57B] rounded-lg text-xs font-semibold text-[#9a8854]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div>
                        {typeof product.category === 'string' ? product.category : (product.category as any)?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-black">${Number(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-600 shadow-lg shadow-green-500/50' : product.stock > 0 ? 'bg-yellow-600 shadow-lg shadow-yellow-500/50' : 'bg-red-600 shadow-lg shadow-red-500/50'}`}></div>
                        <span className={`text-sm font-bold ${product.stock > 10 ? 'text-green-700' : product.stock > 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                          {product.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${product.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' : product.status === 'inactive' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-neutral-100 text-neutral-700 border border-neutral-300'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'active' ? 'bg-green-600' : product.status === 'inactive' ? 'bg-red-600' : 'bg-neutral-600'}`}></div>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CBB57B]/20 hover:bg-[#CBB57B]/30 border border-[#CBB57B]/30 text-[#CBB57B] rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
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
        {!loading && products && products.length > 0 && (
          <div className="px-6 py-4 border-t-2 border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700 font-medium">
                  Showing <span className="font-bold text-black">{(page - 1) * limit + 1}</span> to <span className="font-bold text-black">{Math.min(page * limit, total)}</span> of <span className="font-bold text-black">{total}</span> products
                </span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="ml-4 px-3 py-1.5 border-2 border-neutral-300 bg-white text-black rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-all cursor-pointer"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border-2 border-neutral-300 bg-white text-black rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-[#CBB57B] transition-all"
                >
                  Previous
                </button>
                <span className="text-sm text-black font-bold px-3">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="px-4 py-2 border-2 border-neutral-300 bg-white text-black rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-[#CBB57B] transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom accent border */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#CBB57B]/50 to-transparent"></div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:border-[#CBB57B]/50 hover:text-[#CBB57B] transition-all flex items-center gap-2 shadow-lg font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export to CSV
        </button>
      </div>
    </div>
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

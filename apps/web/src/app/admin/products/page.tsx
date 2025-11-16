'use client';

/**
 * Admin Products Management Page
 *
 * List all products with search, filter, sort, and bulk actions
 */

import React, { useState } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useAdminProducts } from '@/hooks/use-admin';
import { adminProductsApi } from '@/lib/api/admin';
import { toast } from '@/lib/toast';

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
      ...products.map((p) => [p.id, p.name, p.sku, p.category?.name || 'N/A', p.price, p.stock, p.status]),
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <a
          href="/admin/products/new"
          className="px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors"
        >
          Add Product
        </a>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
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
        <div className="bg-[#CBB57B] text-black rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{selectedIds.length} products selected</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkStatusUpdate('active')}
                className="px-3 py-1.5 bg-white text-gray-900 rounded hover:bg-gray-100 text-sm font-medium"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('inactive')}
                className="px-3 py-1.5 bg-white text-gray-900 rounded hover:bg-gray-100 text-sm font-medium"
              >
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 bg-white text-gray-900 rounded hover:bg-gray-100 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CBB57B] mx-auto" />
            </div>
          ) : !products || products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={products && selectedIds.length === products.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                        className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.category?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${Number(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm ${product.stock > 10
                            ? 'text-green-600'
                            : product.stock > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${product.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'inactive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <a
                          href={`/admin/products/${product.id}`}
                          className="text-[#CBB57B] hover:text-[#a89158] text-sm font-medium"
                        >
                          Edit
                        </a>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
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
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} products
                </span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="ml-4 px-3 py-1 border border-gray-300 rounded text-sm"
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
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

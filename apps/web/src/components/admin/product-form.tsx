'use client';

/**
 * Product Form Component
 *
 * Reusable form for creating and editing products
 */

import React, { useState } from 'react';
import type { AdminProduct } from '@/lib/api/admin';

interface ProductFormProps {
  product?: AdminProduct;
  onSubmit: (data: Partial<AdminProduct>) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<AdminProduct>>({
    name: product?.name || '',
    slug: product?.slug || '',
    sku: product?.sku || '',
    description: product?.description || '',
    price: product?.price || 0,
    compareAtPrice: product?.compareAtPrice || undefined,
    category: product?.category || '',
    images: product?.images || [],
    stock: product?.stock || 0,
    status: product?.status || 'draft',
    tags: product?.tags || [],
  });

  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      handleChange('tags', [...(formData.tags || []), newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleChange(
      'tags',
      formData.tags?.filter((t) => t !== tag)
    );
  };

  const handleAddImage = () => {
    if (imageUrl && !formData.images?.includes(imageUrl)) {
      handleChange('images', [...(formData.images || []), imageUrl]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (url: string) => {
    handleChange(
      'images',
      formData.images?.filter((img) => img !== url)
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="Enter product name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                placeholder="product-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                placeholder="SKU-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="Enter product description"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compare At Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.compareAtPrice || ''}
                onChange={(e) =>
                  handleChange('compareAtPrice', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.stock}
              onChange={(e) => handleChange('stock', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
            >
              <option value="">Select category</option>
              <option value="watches">Watches</option>
              <option value="jewelry">Jewelry</option>
              <option value="accessories">Accessories</option>
              <option value="bags">Bags</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="Add tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#CBB57B] text-black rounded-full text-sm flex items-center gap-2"
              >
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-600">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="Image URL"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Add Image
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images?.map((img, index) => (
              <div key={index} className="relative group">
                <img src={img} alt={`Product ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

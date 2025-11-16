'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api/client';
import ImageUpload from './ImageUpload';

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductForm({ initialData, isEdit = false, onSubmit, onCancel }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [price, setPrice] = useState(initialData?.price || '');
  const [compareAtPrice, setCompareAtPrice] = useState(initialData?.compareAtPrice || '');
  const [inventory, setInventory] = useState(initialData?.inventory || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');
  const [heroImage, setHeroImage] = useState(initialData?.heroImage || '');
  const [weight, setWeight] = useState(initialData?.weight || '');

  // SEO fields
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
  const [seoKeywords, setSeoKeywords] = useState(initialData?.seoKeywords?.join(', ') || '');

  // Advanced fields
  const [colors, setColors] = useState(initialData?.colors?.join(', ') || '');
  const [sizes, setSizes] = useState(initialData?.sizes?.join(', ') || '');
  const [materials, setMaterials] = useState(initialData?.materials?.join(', ') || '');

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit && name && !slug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  }, [name, isEdit, slug]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!slug.trim()) newErrors.slug = 'Slug is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!price || Number(price) <= 0) newErrors.price = 'Valid price is required';
    if (!inventory || Number(inventory) < 0) newErrors.inventory = 'Valid inventory is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = {
        name,
        slug,
        description,
        shortDescription: shortDescription || null,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        inventory: Number(inventory),
        categoryId: categoryId || null,
        status,
        heroImage: heroImage || null,
        weight: weight ? Number(weight) : null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        seoKeywords: seoKeywords ? seoKeywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [],
        sizes: sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        materials: materials ? materials.split(',').map(m => m.trim()).filter(Boolean) : [],
      };

      await onSubmit(formData);
    } catch (error: any) {
      console.error('Form submission error:', error);
      alert(error?.data?.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-black mb-6">Basic Information</h2>

        <div className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Product Name <span className="text-error-DEFAULT">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 border ${errors.name ? 'border-error-DEFAULT' : 'border-neutral-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="mt-1 text-sm text-error-DEFAULT">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Slug <span className="text-error-DEFAULT">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={`w-full px-4 py-3 border ${errors.slug ? 'border-error-DEFAULT' : 'border-neutral-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent`}
              placeholder="product-slug-url"
            />
            {errors.slug && <p className="mt-1 text-sm text-error-DEFAULT">{errors.slug}</p>}
            <p className="mt-1 text-sm text-neutral-500">URL-friendly version of the product name</p>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Short Description
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Brief product summary (optional)"
              maxLength={160}
            />
            <p className="mt-1 text-sm text-neutral-500">{shortDescription.length}/160 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description <span className="text-error-DEFAULT">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className={`w-full px-4 py-3 border ${errors.description ? 'border-error-DEFAULT' : 'border-neutral-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent`}
              placeholder="Detailed product description"
            />
            {errors.description && <p className="mt-1 text-sm text-error-DEFAULT">{errors.description}</p>}
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-black mb-6">Pricing & Inventory</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Price <span className="text-error-DEFAULT">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`w-full pl-8 pr-4 py-3 border ${errors.price ? 'border-error-DEFAULT' : 'border-neutral-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent`}
                placeholder="0.00"
              />
            </div>
            {errors.price && <p className="mt-1 text-sm text-error-DEFAULT">{errors.price}</p>}
          </div>

          {/* Compare At Price */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Compare At Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-sm text-neutral-500">Original price (for showing discounts)</p>
          </div>

          {/* Inventory */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Inventory (Stock) <span className="text-error-DEFAULT">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
              className={`w-full px-4 py-3 border ${errors.inventory ? 'border-error-DEFAULT' : 'border-neutral-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent`}
              placeholder="0"
            />
            {errors.inventory && <p className="mt-1 text-sm text-error-DEFAULT">{errors.inventory}</p>}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-black mb-6">Organization</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Status <span className="text-error-DEFAULT">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <p className="mt-1 text-sm text-neutral-500">
              {status === 'ACTIVE' ? 'Visible to customers' : status === 'DRAFT' ? 'Hidden from customers' : 'Not visible, archived'}
            </p>
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-black mb-6">Product Image</h2>

        <ImageUpload
          value={heroImage}
          onChange={setHeroImage}
          folder="products"
          label="Hero Image"
          error={errors.heroImage}
        />
      </div>

      {/* Product Attributes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-black mb-6">Product Attributes</h2>

        <div className="space-y-4">
          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Colors
            </label>
            <input
              type="text"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Black, White, Navy (comma-separated)"
            />
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Sizes
            </label>
            <input
              type="text"
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="XS, S, M, L, XL (comma-separated)"
            />
          </div>

          {/* Materials */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Materials
            </label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Cotton, Leather, Silk (comma-separated)"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-black mb-6">SEO & Marketing</h2>

        <div className="space-y-4">
          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="SEO title for search engines"
              maxLength={60}
            />
            <p className="mt-1 text-sm text-neutral-500">{metaTitle.length}/60 characters</p>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="SEO description for search engines"
              maxLength={160}
            />
            <p className="mt-1 text-sm text-neutral-500">{metaDescription.length}/160 characters</p>
          </div>

          {/* SEO Keywords */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              SEO Keywords
            </label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="luxury, premium, handcrafted (comma-separated)"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {isEdit ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            isEdit ? 'Update Product' : 'Create Product'
          )}
        </button>
      </div>
    </form>
  );
}

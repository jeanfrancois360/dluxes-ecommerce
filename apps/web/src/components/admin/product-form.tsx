'use client';

/**
 * Product Form Component - Production Ready
 *
 * Fully functional form for creating and editing products with:
 * - Dynamic category fetching
 * - Auto-slug generation
 * - Comprehensive validation
 * - All product fields
 * - Excellent UX/UI
 */

import React, { useState, useEffect } from 'react';
import type { AdminProduct } from '@/lib/api/admin';
import { adminCategoriesApi, type Category } from '@/lib/api/admin';
import { VariantManager } from './variant-manager';
import { StockLevelIndicator } from './stock-status-badge';
import { INVENTORY_DEFAULTS } from '@/lib/constants/inventory';

interface ProductFormProps {
  product?: AdminProduct;
  onSubmit: (data: Partial<AdminProduct>) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form state
  const [formData, setFormData] = useState<any>({
    name: product?.name || '',
    slug: product?.slug || '',
    sku: product?.sku || '',
    description: product?.description || '',
    shortDescription: (product as any)?.shortDescription || '',
    price: product?.price || undefined,
    compareAtPrice: product?.compareAtPrice || undefined,
    category: product?.category || '',
    images: product?.images || [],
    stock: product?.stock || undefined,
    status: product?.status || 'DRAFT',
    tags: product?.tags || [],
    productType: (product as any)?.productType || 'PHYSICAL',
    purchaseType: (product as any)?.purchaseType || 'INSTANT',
    // SEO fields
    metaTitle: (product as any)?.metaTitle || '',
    metaDescription: (product as any)?.metaDescription || '',
    seoKeywords: (product as any)?.seoKeywords || '',
    // Attributes
    badges: (product as any)?.badges || [],
    colors: (product as any)?.colors || [],
    sizes: (product as any)?.sizes || [],
    materials: (product as any)?.materials || [],
    // Additional fields
    featured: (product as any)?.featured || false,
    weight: (product as any)?.weight || undefined,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [newTag, setNewTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isDragging, setIsDragging] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true);
        const data = await adminCategoriesApi.getAll();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  // Update form data when product prop changes (for edit mode)
  useEffect(() => {
    if (product) {
      const imageArray = Array.isArray(product.images) ? product.images : [];

      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        sku: product.sku || '',
        description: product.description || '',
        shortDescription: (product as any)?.shortDescription || '',
        price: product.price || undefined,
        compareAtPrice: product.compareAtPrice || undefined,
        category: product.category || '',
        images: imageArray,
        stock: product.stock || undefined,
        status: product.status || 'DRAFT',
        tags: product.tags || [],
        productType: (product as any)?.productType || 'PHYSICAL',
        purchaseType: (product as any)?.purchaseType || 'INSTANT',
        metaTitle: (product as any)?.metaTitle || '',
        metaDescription: (product as any)?.metaDescription || '',
        seoKeywords: (product as any)?.seoKeywords || '',
        badges: (product as any)?.badges || [],
        colors: (product as any)?.colors || [],
        sizes: (product as any)?.sizes || [],
        materials: (product as any)?.materials || [],
        featured: (product as any)?.featured || false,
        weight: (product as any)?.weight || undefined,
      });
    }
  }, [product]);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      name: value,
      // Auto-generate slug if it's a new product or slug hasn't been manually edited
      slug: !product?.slug || prev.slug === generateSlug(prev.name)
        ? generateSlug(value)
        : prev.slug
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Required field validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Product name must be less than 200 characters';
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = 'Product slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must be lowercase letters, numbers, and hyphens only';
    }

    if (!formData.sku?.trim()) {
      newErrors.sku = 'SKU is required';
    }

    // Purchase type specific validation
    if (formData.purchaseType === 'INSTANT') {
      if (formData.price === undefined || formData.price === null || formData.price === '') {
        newErrors.price = 'Price is required for instant purchase products';
      } else if (formData.price < 0) {
        newErrors.price = 'Price cannot be negative';
      } else if (formData.price > 1000000) {
        newErrors.price = 'Price seems unreasonably high';
      }

      if (formData.stock === undefined || formData.stock === null || formData.stock === '') {
        newErrors.stock = 'Stock is required for instant purchase products';
      } else if (formData.stock < 0) {
        newErrors.stock = 'Stock cannot be negative';
      }
    }

    // Compare at price validation
    if (formData.compareAtPrice !== undefined && formData.compareAtPrice !== null && formData.compareAtPrice !== '') {
      if (formData.compareAtPrice < 0) {
        newErrors.compareAtPrice = 'Compare at price cannot be negative';
      }
      if (formData.price && formData.compareAtPrice <= formData.price) {
        newErrors.compareAtPrice = 'Compare at price must be greater than regular price';
      }
    }

    // Description validation
    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    // Images validation - only require for new products
    // For existing products, allow saving without images (they may want to update other fields)
    if (!product && (!formData.images || formData.images.length === 0)) {
      newErrors.images = 'At least one product image is required for new products';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    try {
      // Clean up data before submission
      const submitData: any = {
        name: formData.name,
        slug: formData.slug,
        sku: formData.sku?.trim() || undefined, // Send trimmed SKU or undefined if empty
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        categoryId: formData.category || undefined,
        price: formData.price === '' || formData.price === undefined ? undefined : Number(formData.price),
        compareAtPrice: formData.compareAtPrice === '' || formData.compareAtPrice === undefined ? undefined : Number(formData.compareAtPrice),
        inventory: formData.stock === '' || formData.stock === undefined ? undefined : Number(formData.stock),
        weight: formData.weight === '' || formData.weight === undefined ? undefined : Number(formData.weight),
        status: formData.status,
        productType: formData.productType,
        purchaseType: formData.purchaseType,
        featured: formData.featured,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        // Convert seoKeywords string to array if needed
        seoKeywords: typeof formData.seoKeywords === 'string'
          ? formData.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : (formData.seoKeywords || []),
        badges: formData.badges || [],
        colors: formData.colors || [],
        sizes: formData.sizes || [],
        materials: formData.materials || [],
      };

      // Only include heroImage if we have images
      if (formData.images && formData.images.length > 0) {
        submitData.heroImage = formData.images[0];
        // Also include images array for separate API call
        submitData.images = formData.images;
      }

      // Gallery should be null or a proper object structure, not an empty array
      // For now, we'll omit it from the payload to avoid validation errors
      // The images are handled separately via heroImage and ProductImage relations

      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      handleChange('tags', [...(formData.tags || []), newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleChange('tags', formData.tags?.filter((t: string) => t !== tag));
  };

  const handleAddImage = () => {
    if (imageUrl && !formData.images?.includes(imageUrl)) {
      handleChange('images', [...(formData.images || []), imageUrl]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (url: string) => {
    handleChange('images', formData.images?.filter((img: string) => img !== url));
  };

  const handleSetPrimaryImage = (img: string) => {
    // Move the selected image to the first position (primary position)
    const currentImages = [...(formData.images || [])];
    const imageIndex = currentImages.indexOf(img);

    if (imageIndex > 0) {
      // Remove from current position and add to beginning
      currentImages.splice(imageIndex, 1);
      currentImages.unshift(img);
      handleChange('images', currentImages);
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    // Validate files before upload
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validationErrors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`${file.name} is too large (max 5MB)`);
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        validationErrors.push(`${file.name} has unsupported format`);
      }
    }

    if (validationErrors.length > 0) {
      alert(`Upload errors:\n${validationErrors.join('\n')}`);
      return;
    }

    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    const failedUploads: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileKey = `${file.name}-${Date.now()}`;

        try {
          setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

          const formData = new FormData();
          formData.append('image', file);

          const token = localStorage.getItem('auth_token');
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/upload/optimized?entityType=products`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            }
          );

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.url) {
              uploadedUrls.push(result.data.url);
              setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
            } else {
              failedUploads.push(file.name);
            }
          } else {
            failedUploads.push(file.name);
          }

          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (fileError) {
          failedUploads.push(file.name);
        }
      }

      if (uploadedUrls.length > 0) {
        handleChange('images', [...(formData.images || []), ...uploadedUrls]);
      }

      if (failedUploads.length > 0) {
        alert(`Upload completed:\n✓ ${uploadedUrls.length} image(s) uploaded successfully\n✗ ${failedUploads.length} image(s) failed:\n${failedUploads.join('\n')}`);
      }

      setTimeout(() => setUploadProgress({}), 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await processFiles(files);
    e.target.value = ''; // Reset input
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  // Helper component for error display
  const ErrorMessage = ({ field }: { field: string }) => (
    errors[field] ? (
      <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
    ) : null
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div id="name">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter product name"
            />
            <ErrorMessage field="name" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div id="slug">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="product-slug"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from name, or customize it</p>
              <ErrorMessage field="slug" />
            </div>
            <div id="sku">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="SKU-001"
              />
              <ErrorMessage field="sku" />
            </div>
          </div>

          <div id="description">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter product description"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description?.length || 0}/5000 characters</p>
            <ErrorMessage field="description" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="Brief one-line description"
              maxLength={150}
            />
            <p className="text-xs text-gray-500 mt-1">Used in product cards and previews (max 150 characters)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.productType}
                onChange={(e) => handleChange('productType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              >
                <option value="PHYSICAL">Physical Product</option>
                <option value="REAL_ESTATE">Real Estate</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="SERVICE">Service</option>
                <option value="RENTAL">Rental</option>
                <option value="DIGITAL">Digital Product</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.purchaseType}
                onChange={(e) => handleChange('purchaseType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              >
                <option value="INSTANT">Instant Purchase (Add to Cart)</option>
                <option value="INQUIRY">Inquiry Required (Contact Seller)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.purchaseType === 'INQUIRY'
                  ? 'Customers will contact you for pricing and details'
                  : 'Customers can purchase directly'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pricing & Inventory
          {formData.purchaseType === 'INQUIRY' && (
            <span className="ml-2 text-sm font-normal text-gray-500">(Optional for inquiry products)</span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div id="price">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price {formData.purchaseType === 'INSTANT' && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                required={formData.purchaseType === 'INSTANT'}
                min="0"
                step="0.01"
                value={formData.price === undefined ? '' : formData.price}
                onChange={(e) => handleChange('price', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={formData.purchaseType === 'INQUIRY' ? 'Optional' : '0.00'}
              />
            </div>
            {formData.purchaseType === 'INQUIRY' && (
              <p className="text-xs text-gray-500 mt-1">Leave empty if price varies or is negotiable</p>
            )}
            <ErrorMessage field="price" />
          </div>

          <div id="compareAtPrice">
            <label className="block text-sm font-medium text-gray-700 mb-1">Compare At Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.compareAtPrice === undefined ? '' : formData.compareAtPrice}
                onChange={(e) => handleChange('compareAtPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.compareAtPrice ? 'border-red-500' : 'border-gray-300'}`}
                disabled={formData.purchaseType === 'INQUIRY'}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Original price for sale items</p>
            <ErrorMessage field="compareAtPrice" />
          </div>

          <div id="stock">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock {formData.purchaseType === 'INSTANT' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              required={formData.purchaseType === 'INSTANT'}
              min="0"
              value={formData.stock === undefined ? '' : formData.stock}
              onChange={(e) => handleChange('stock', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={formData.purchaseType === 'INQUIRY' ? 'Optional' : '0'}
            />
            {formData.purchaseType === 'INQUIRY' && (
              <p className="text-xs text-gray-500 mt-1">Not applicable for inquiry-based products</p>
            )}
            <ErrorMessage field="stock" />
            {/* Stock Level Indicator - only show for existing products with stock data */}
            {product && formData.stock !== undefined && formData.stock !== null && formData.stock !== '' && formData.purchaseType !== 'INQUIRY' && (
              <div className="mt-3">
                <StockLevelIndicator stock={Number(formData.stock)} />
              </div>
            )}
          </div>
        </div>

        {formData.purchaseType === 'INQUIRY' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Inquiry Product</h4>
                <p className="text-xs text-blue-800">
                  This product will display "Contact for Price" instead of a price. Customers will submit an inquiry form to contact you about pricing and availability.
                </p>
              </div>
            </div>
          </div>
        )}
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
              disabled={loadingCategories}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">{loadingCategories ? 'Loading...' : 'Select category'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
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
            {formData.tags?.map((tag: string) => (
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

        {/* Featured toggle */}
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => handleChange('featured', e.target.checked)}
              className="w-4 h-4 text-[#CBB57B] border-gray-300 rounded focus:ring-[#CBB57B]"
            />
            <span className="text-sm font-medium text-gray-700">Feature this product</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">Featured products appear prominently on the homepage</p>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg shadow p-6" id="images">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Product Images {!product && <span className="text-red-500">*</span>}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {formData.images && formData.images.length > 0
                ? `${formData.images.length} image${formData.images.length > 1 ? 's' : ''} uploaded`
                : product
                ? 'No images yet. Upload high-quality images to showcase your product'
                : 'Upload at least one high-quality image to showcase your product'}
            </p>
          </div>
          {formData.images && formData.images.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-green-600">Ready</span>
            </div>
          )}
        </div>

        {/* Image Grid - Show First */}
        {formData.images && formData.images.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.images.map((img: string, index: number) => (
                <div
                  key={`${img}-${index}`}
                  className="relative group aspect-square bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-[#CBB57B] transition-all duration-200"
                >
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EImage Error%3C/text%3E%3C/svg%3E';
                    }}
                  />

                  {/* Primary Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 px-3 py-1.5 bg-gradient-to-r from-[#CBB57B] to-[#a89158] text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      PRIMARY
                    </div>
                  )}

                  {/* Image Number */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                    #{index + 1}
                  </div>

                  {/* Hover Overlay - Must come BEFORE buttons in DOM */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 pointer-events-none" />

                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                    {/* Set as Primary Button - Only show for non-primary images */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSetPrimaryImage(img);
                        }}
                        className="p-2 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] hover:scale-110 shadow-lg transition-all duration-200 cursor-pointer"
                        title="Set as primary image"
                      >
                        <svg className="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveImage(img);
                      }}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-110 shadow-lg transition-all duration-200 cursor-pointer"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-blue-800">
                  <p className="font-semibold mb-1">About Primary Image:</p>
                  <ul className="space-y-1">
                    <li>• The <strong>PRIMARY</strong> image is used as the hero/main product image</li>
                    <li>• Click the <strong>star icon</strong> on any image to set it as primary</li>
                    <li>• The primary image appears first in product listings and detail pages</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block">
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  errors.images
                    ? 'border-red-300 bg-red-50 hover:border-red-400'
                    : isDragging
                    ? 'border-[#CBB57B] bg-[#CBB57B]/10 scale-[1.02]'
                    : 'border-gray-300 hover:border-[#CBB57B] hover:bg-gray-50'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadingImages ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-[#CBB57B] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-700">Uploading images...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-gray-700">Click to upload</span>
                      <span className="text-sm text-gray-500"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP or GIF (max. 5MB per file)
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileUpload}
                disabled={uploadingImages}
                className="hidden"
              />
            </label>

            <ErrorMessage field="images" />

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="mt-4 space-y-3">
                {Object.entries(uploadProgress).map(([key, progress]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 truncate">{key}</span>
                      <span className="text-sm font-semibold text-[#CBB57B]">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#CBB57B] to-[#a89158] transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 py-1 bg-white text-xs font-medium text-gray-500 uppercase tracking-wider">
                Or add from URL
              </span>
            </div>
          </div>

          {/* URL Input */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <button
              type="button"
              onClick={handleAddImage}
              disabled={!imageUrl.trim()}
              className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add URL
            </button>
          </div>
        </div>
      </div>

      {/* Product Variants */}
      <VariantManager
        productId={product?.id}
        productPrice={formData.price}
      />

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">
          {Object.keys(errors).length > 0 && (
            <p className="text-red-600">
              Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} above
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>
    </form>
  );
}

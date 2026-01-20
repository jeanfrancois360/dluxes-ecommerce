'use client';

/**
 * Variant Manager Component
 *
 * Manages product variants (size, color, material, etc.) for admin product forms
 */

import React, { useState, useEffect } from 'react';
import { variantsApi, ProductVariant, CreateProductVariantDto, UpdateProductVariantDto } from '@/lib/api/variants';
import { VariantForm } from './variant-form';
import { formatNumber } from '@/lib/utils/number-format';

interface VariantManagerProps {
  productId?: string; // undefined when creating new product
  productPrice?: number; // to inherit price
}

export function VariantManager({ productId, productPrice }: VariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = React.useRef<HTMLDivElement>(null);

  // Load variants when productId is available
  useEffect(() => {
    if (productId) {
      loadVariants();
    }
  }, [productId]);

  // Scroll to form when editing
  useEffect(() => {
    if (editingVariant && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editingVariant]);

  const loadVariants = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await variantsApi.getProductVariants(productId);
      // Filter out any null/undefined variants
      setVariants(data?.filter((v: ProductVariant | null) => v != null) || []);
    } catch (err) {
      console.error('Failed to load variants:', err);
      setError('Failed to load variants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariant = async (data: CreateProductVariantDto) => {
    if (!productId) {
      setError('Please save the product first before adding variants.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newVariant = await variantsApi.createVariant(productId, data);
      if (newVariant) {
        setVariants([...variants, newVariant]);
        setShowForm(false);
      } else {
        throw new Error('Variant creation returned empty response');
      }
    } catch (err: any) {
      console.error('Failed to create variant:', err);
      setError(err?.response?.data?.message || 'Failed to create variant. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariant = async (variantId: string, data: UpdateProductVariantDto) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await variantsApi.updateVariant(variantId, data);
      if (updated) {
        setVariants(variants.map(v => v.id === variantId ? updated : v));
        setEditingVariant(null);
      } else {
        throw new Error('Variant update returned empty response');
      }
    } catch (err: any) {
      console.error('Failed to update variant:', err);
      setError(err?.response?.data?.message || 'Failed to update variant. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const confirmMessage = `Are you sure you want to delete this variant?\n\nVariant: ${variant.name}\nSKU: ${variant.sku}\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await variantsApi.deleteVariant(variantId);
      setVariants(variants.filter(v => v.id !== variantId));
    } catch (err: any) {
      console.error('Failed to delete variant:', err);
      const errorMessage = err?.response?.data?.message;

      // Provide helpful error messages based on the error type
      if (errorMessage?.includes('cart')) {
        setError(`Cannot delete this variant because it is currently in customer shopping carts. Please wait for customers to complete their purchases, or mark the variant as unavailable instead.`);
      } else if (errorMessage?.includes('order')) {
        setError(`Cannot delete this variant because it has been included in previous orders. To prevent this variant from being purchased, mark it as unavailable instead of deleting it.`);
      } else {
        setError(errorMessage || 'Failed to delete variant. Please try again or contact support if the problem persists.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (variantId: string, direction: 'up' | 'down') => {
    if (!productId) return;

    const currentIndex = variants.findIndex(v => v.id === variantId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === variants.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reorderedVariants = [...variants];
    const [movedVariant] = reorderedVariants.splice(currentIndex, 1);
    reorderedVariants.splice(newIndex, 0, movedVariant);

    // Update display order
    const variantOrders = reorderedVariants.map((v, index) => ({
      id: v.id,
      order: index,
    }));

    setLoading(true);
    setError(null);
    try {
      await variantsApi.reorderVariants(productId, variantOrders);
      setVariants(reorderedVariants);
    } catch (err) {
      console.error('Failed to reorder variants:', err);
      setError('Failed to reorder variants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!productId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Variants</h2>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium mb-2">Product variants are not yet available</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Variants allow you to offer different options for this product (e.g., sizes, colors, materials).
            Please save the product first, then return here to add variants.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage size, color, and other product variations
          </p>
        </div>
        {!showForm && !editingVariant && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors"
          >
            + Add Variant
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Variant Form (Create/Edit) */}
      {(showForm || editingVariant) && (
        <div ref={formRef} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {editingVariant ? 'Edit Variant' : 'New Variant'}
          </h3>
          <VariantForm
            variant={editingVariant || undefined}
            productPrice={productPrice}
            onSubmit={async (data) => {
              if (editingVariant) {
                await handleUpdateVariant(editingVariant.id, data);
              } else {
                await handleCreateVariant(data as CreateProductVariantDto);
              }
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingVariant(null);
              setError(null);
            }}
            loading={loading}
          />
        </div>
      )}

      {/* Variants List */}
      {loading && variants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CBB57B] mx-auto"></div>
          <p className="mt-3 text-sm">Loading variants...</p>
        </div>
      ) : variants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-sm">No variants yet. Click "Add Variant" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.filter(v => v != null).map((variant, index) => (
            <div
              key={variant.id}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[#CBB57B] transition-colors"
            >
              {/* Reorder Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleReorder(variant.id, 'up')}
                  disabled={index === 0 || loading}
                  className="p-1 text-gray-400 hover:text-[#CBB57B] disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(variant.id, 'down')}
                  disabled={index === variants.length - 1 || loading}
                  className="p-1 text-gray-400 hover:text-[#CBB57B] disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Variant Image */}
              {variant.image && (
                <img
                  src={variant.image}
                  alt={variant.name}
                  className="w-16 h-16 object-cover rounded border border-gray-200"
                />
              )}

              {/* Color Swatch */}
              {variant.colorHex && !variant.image && (
                <div
                  className="w-16 h-16 rounded border-2 border-gray-300"
                  style={{ backgroundColor: variant.colorHex }}
                  title={variant.colorName || variant.colorHex}
                />
              )}

              {/* Variant Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{variant.name}</h4>
                  {!variant.isAvailable && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                      Unavailable
                    </span>
                  )}
                  {variant.inventory <= variant.lowStockThreshold && variant.inventory > 0 && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Low Stock
                    </span>
                  )}
                  {variant.inventory === 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                      Out of Stock
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  SKU: {variant.sku} • Stock: {variant.inventory}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(variant.options).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  ${formatNumber(variant.price)}
                </p>
                {variant.compareAtPrice && (
                  <p className="text-sm text-gray-500 line-through">
                    ${formatNumber(variant.compareAtPrice)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Edit button clicked for variant:', variant.id);
                    setShowForm(false); // Close create form if open
                    setEditingVariant(variant);
                  }}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-[#CBB57B] hover:bg-[#CBB57B]/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-[#CBB57B] cursor-pointer"
                  title="Edit variant"
                  aria-label="Edit variant"
                >
                  <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteVariant(variant.id);
                  }}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-red-300 cursor-pointer"
                  title="Delete variant"
                  aria-label="Delete variant"
                >
                  <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

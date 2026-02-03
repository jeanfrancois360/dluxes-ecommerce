'use client';

/**
 * Admin Product Edit Page
 *
 * Edit existing product or create new product
 */

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ProductForm } from '@/components/admin/product-form';
import { InventoryAdjustmentModal } from '@/components/admin/inventory-adjustment-modal';
import { InventoryHistoryModal } from '@/components/admin/inventory-history-modal';
import { useAdminProduct } from '@/hooks/use-admin';
import { adminProductsApi, type AdminProduct } from '@/lib/api/admin';
import { toast, standardToasts } from '@/lib/utils/toast';
import { Button } from '@nextpik/ui';
import { Package, History, RefreshCw } from 'lucide-react';

function ProductEditContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const isNew = resolvedParams.id === 'new';
  const { product, loading, error, refetch } = useAdminProduct(isNew ? '' : resolvedParams.id);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleSubmit = async (data: Partial<AdminProduct> & { images?: string[] }) => {
    try {
      let savedProduct;
      const images = data.images || [];

      // Remove images from the product data (handled separately)
      const { images: _, ...productData } = data;

      if (isNew) {
        savedProduct = await adminProductsApi.create(productData);
        toast.success('Product created successfully');
      } else {
        savedProduct = await adminProductsApi.update(resolvedParams.id, productData);
        toast.success('Product updated successfully');
      }

      // Save images if any were provided
      const productId = savedProduct.id || resolvedParams.id;
      if (images.length > 0 && productId) {
        try {
          await adminProductsApi.addImages(productId, images);
        } catch (imgError) {
          console.error('Failed to save images:', imgError);
          toast.error('Product saved but failed to save images');
        }
      }

      router.push('/admin/products');
    } catch (error) {
      toast.error(isNew ? 'Failed to create product' : 'Failed to update product');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/products');
  };

  const handleSyncInventory = async () => {
    if (isNew || !resolvedParams.id) return;

    try {
      await adminProductsApi.syncProductInventory(resolvedParams.id);
      toast.success('Inventory synced successfully');
      refetch();
    } catch (error: any) {
      console.error('Error syncing inventory:', error);
      toast.error(error.response?.data?.message || 'Failed to sync inventory');
    }
  };

  // Show loading state
  if (loading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CBB57B]" />
      </div>
    );
  }

  // Show error state if product not found
  if (error && !isNew) {
    return (
      <div className="max-w-4xl">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-red-900 mb-2">Product Not Found</h2>
          <p className="text-red-700 mb-6">
            The product you're trying to edit doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  // Transform product data to match form expectations
  const transformedProduct = product ? {
    ...product,
    category: typeof product.category === 'object' ? (product.category as any)?.slug : product.category,
    images: Array.isArray(product.images)
      ? product.images.map((img: any) => typeof img === 'string' ? img : img.url)
      : [(product as any).heroImage].filter(Boolean),
    tags: Array.isArray(product.tags)
      ? product.tags.map((tag: any) => typeof tag === 'string' ? tag : tag.name)
      : [],
    stock: (product as any).inventory ?? (product as any).stock ?? 0,
  } : undefined;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Create Product' : `Edit Product`}
          </h1>
          <p className="text-gray-600 mt-1">
            {isNew ? 'Add a new product to your catalog' : 'Update product information'}
          </p>
          {!isNew && product && (
            <p className="text-sm text-gray-500 mt-1">
              Product ID: {resolvedParams.id}
            </p>
          )}
        </div>
        {!isNew && product && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowInventoryModal(true)}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Adjust Stock
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
            {(product as any)?.variants && (product as any).variants.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSyncInventory}
                className="flex items-center gap-2"
                title="Sync inventory from variants"
              >
                <RefreshCw className="h-4 w-4" />
                Sync from Variants
              </Button>
            )}
          </div>
        )}
      </div>

      <ProductForm
        product={isNew ? undefined : transformedProduct}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />

      {/* Inventory Adjustment Modal */}
      <InventoryAdjustmentModal
        open={showInventoryModal}
        onOpenChange={setShowInventoryModal}
        productId={!isNew ? resolvedParams.id : undefined}
        productName={product?.name}
        currentStock={(product as any)?.inventory ?? (product as any)?.stock ?? 0}
        onSuccess={() => {
          refetch();
          toast.success('Inventory adjusted successfully');
        }}
      />

      {/* Inventory History Modal */}
      <InventoryHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        productId={!isNew ? resolvedParams.id : undefined}
        productName={product?.name}
      />
    </div>
  );
}

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminRoute>
      <AdminLayout>
        <ProductEditContent params={params} />
      </AdminLayout>
    </AdminRoute>
  );
}

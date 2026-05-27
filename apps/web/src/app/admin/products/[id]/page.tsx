'use client';

/**
 * Admin Product Edit Page
 */

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SellerProductForm from '@/components/seller/ProductForm';
import { InventoryAdjustmentModal } from '@/components/admin/inventory-adjustment-modal';
import { InventoryHistoryModal } from '@/components/admin/inventory-history-modal';
import { useAdminProduct } from '@/hooks/use-admin';
import { adminProductsApi, adminStoresApi, type AdminProduct } from '@/lib/api/admin';
import { toast } from '@/lib/utils/toast';
import { Button } from '@nextpik/ui';
import { Package, History, RefreshCw } from 'lucide-react';

function ProductEditContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { product, loading, error, refetch } = useAdminProduct(resolvedParams.id);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [storeGelatoOk, setStoreGelatoOk] = useState(false);

  // Once the product loads, check the store's Gelato status
  useEffect(() => {
    const storeId = (product as any)?.storeId;
    if (!storeId) return;
    adminStoresApi.getAll().then((stores) => {
      const store = stores.find((s) => s.id === storeId);
      setStoreGelatoOk(!!(store?.gelatoSettings?.isEnabled && store?.gelatoSettings?.isVerified));
    });
  }, [(product as any)?.storeId]);

  const handleSubmit = async (data: any) => {
    const images: string[] = data.images || [];
    const { images: _, ...productData } = data;

    const saved = await adminProductsApi.update(resolvedParams.id, productData);
    toast.success('Product updated successfully');

    const productId = saved.id || resolvedParams.id;
    if (images.length > 0 && productId) {
      try {
        await adminProductsApi.addImages(productId, images);
      } catch {
        toast.error('Product saved but failed to save images');
      }
    }

    router.push('/admin/products');
  };

  const handleCancel = () => {
    router.push('/admin/products');
  };

  const handleSyncInventory = async () => {
    try {
      await adminProductsApi.syncProductInventory(resolvedParams.id);
      toast.success('Inventory synced successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync inventory');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CBB57B]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center">
          <svg
            className="w-14 h-14 mx-auto mb-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-bold text-red-900 mb-2">Product Not Found</h2>
          <p className="text-red-700 mb-6">
            The product you&apos;re trying to edit doesn&apos;t exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const initialData = {
    ...product,
    category:
      typeof product.category === 'object' ? (product.category as any)?.slug : product.category,
    storeId: (product as any).storeId,
    images: Array.isArray(product.images)
      ? product.images.map((img: any) => (typeof img === 'string' ? img : img.url))
      : [(product as any).heroImage].filter(Boolean),
    tags: Array.isArray(product.tags)
      ? product.tags.map((tag: any) => (typeof tag === 'string' ? tag : tag.name))
      : [],
    stock: (product as any).inventory ?? (product as any).stock ?? 0,
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={() => router.push('/admin/products')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-black">Edit Product</h1>
          </div>
          <p className="ml-14 text-neutral-600 truncate">{product.name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-700">Quick Actions</p>
              <p className="text-xs text-neutral-400 mt-0.5">ID: {resolvedParams.id}</p>
            </div>
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
          </div>
        </div>

        {/* Product Form */}
        <SellerProductForm
          initialData={initialData}
          isEdit
          adminMode
          adminGelatoConfigured={storeGelatoOk}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>

      <InventoryAdjustmentModal
        open={showInventoryModal}
        onOpenChange={setShowInventoryModal}
        productId={resolvedParams.id}
        productName={product.name}
        currentStock={(product as any)?.inventory ?? (product as any)?.stock ?? 0}
        onSuccess={() => {
          refetch();
          toast.success('Inventory adjusted successfully');
        }}
      />

      <InventoryHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        productId={resolvedParams.id}
        productName={product.name}
      />
    </div>
  );
}

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProductEditContent params={params} />;
}

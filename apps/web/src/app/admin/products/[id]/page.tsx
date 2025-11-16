'use client';

/**
 * Admin Product Edit Page
 *
 * Edit existing product or create new product
 */

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ProductForm } from '@/components/admin/product-form';
import { useAdminProduct } from '@/hooks/use-admin';
import { adminProductsApi, type AdminProduct } from '@/lib/api/admin';
import { toast } from '@/lib/toast';

function ProductEditContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const isNew = resolvedParams.id === 'new';
  const { product, loading } = useAdminProduct(isNew ? '' : resolvedParams.id);

  const handleSubmit = async (data: Partial<AdminProduct>) => {
    try {
      if (isNew) {
        await adminProductsApi.create(data);
        toast.success('Product created successfully');
      } else {
        await adminProductsApi.update(resolvedParams.id, data);
        toast.success('Product updated successfully');
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

  if (loading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CBB57B]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Create Product' : 'Edit Product'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isNew ? 'Add a new product to your catalog' : 'Update product information'}
        </p>
      </div>

      <ProductForm product={isNew ? undefined : product || undefined} onSubmit={handleSubmit} onCancel={handleCancel} />
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

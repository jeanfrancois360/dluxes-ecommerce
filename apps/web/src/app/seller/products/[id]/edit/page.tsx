'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import ProductForm from '@/components/seller/ProductForm';
import { api } from '@/lib/api/client';

export default function EditProductPage() {
  const t = useTranslations('sellerProductsEdit');
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/seller/products/${productId}`);
      setProduct(response);
    } catch (err: any) {
      console.error('Failed to fetch product:', err);
      const errorMessage = err.response?.data?.message || t('error.notFound');
      setError(errorMessage);

      // If product not found or unauthorized, redirect after showing error
      if (err.response?.status === 404 || err.response?.status === 403) {
        setTimeout(() => {
          router.push('/seller/products');
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const images = formData.images || [];

      // Remove images from the product data (handled separately, just like admin)
      const { images: _, ...productData } = formData;

      // Update the product
      const response = await api.patch(`/seller/products/${productId}`, productData);

      // Save images if any were provided (same as admin approach)
      if (images.length > 0 && productId) {
        try {
          await api.post(`/products/${productId}/images`, { images });
        } catch (imgError) {
          console.error('Failed to save images:', imgError);
          alert(t('success.imagesFailed'));
        }
      }

      // Show success message
      alert(t('success.productUpdated'));

      // Redirect to products list
      router.push('/seller/products');
    } catch (error: any) {
      console.error('Failed to update product:', error);
      throw error; // Let the form handle the error
    }
  };

  const handleCancel = () => {
    if (confirm(t('form.cancelConfirm'))) {
      router.push('/seller/products');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-black mb-4"></div>
          <p className="text-neutral-600">{t('loading.message')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-black mb-2">{t('error.title')}</h2>
          <p className="text-neutral-600 mb-6">{error || t('error.notFound')}</p>
          <button
            onClick={() => router.push('/seller/products')}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            {t('error.backToProducts')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.push('/seller/products')}
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
              <h1 className="text-3xl font-bold text-black">{t('pageTitle')}</h1>
            </div>
            <p className="text-neutral-600 ml-14">{t('pageSubtitle')}</p>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ProductForm
            initialData={product}
            isEdit={true}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </motion.div>
      </div>
    </div>
  );
}

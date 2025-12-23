'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/page-layout';
import ProductForm from '@/components/seller/ProductForm';
import { api } from '@/lib/api/client';

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    try {
      const response = await api.post('/seller/products', formData);

      // Show success message
      alert('Product created successfully!');

      // Redirect to products list
      router.push('/seller/products');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      throw error; // Let the form handle the error
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      router.push('/seller/products');
    }
  };

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.push('/seller/products')}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-black">Add New Product</h1>
            </div>
            <p className="text-neutral-600 ml-14">Create a new product for your store</p>
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
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </motion.div>
      </div>
      </div>
    </PageLayout>
  );
}

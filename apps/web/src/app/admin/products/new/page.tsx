'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ChevronDown, Search, AlertCircle } from 'lucide-react';
import ProductForm from '@/components/seller/ProductForm';
import { api } from '@/lib/api/client';
import { adminStoresApi, type AdminStore } from '@/lib/api/admin';
import { toast } from '@/lib/utils/toast';

export default function AdminNewProductPage() {
  const router = useRouter();

  // Store selector state
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<AdminStore | null>(null);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);

  useEffect(() => {
    adminStoresApi
      .getAll({ status: 'ACTIVE' })
      .then((data) => setStores(data))
      .catch(() => toast.error('Failed to load stores'))
      .finally(() => setStoresLoading(false));
  }, []);

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.user.email.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const handleSubmit = async (formData: any) => {
    if (!selectedStore) {
      toast.error('Please select a seller store before creating the product.');
      return;
    }

    const response = await api.post('/products', {
      ...formData,
      storeId: selectedStore.id,
    });

    if (response?._imagesSaveFailed) {
      toast.success('Product created, but images failed to save. Re-upload from the edit page.');
    } else {
      toast.success('Product created successfully!');
    }
    router.push('/admin/products');
  };

  const handleCancel = () => {
    if (confirm('Discard this product?')) {
      router.push('/admin/products');
    }
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
            <h1 className="text-3xl font-bold text-black">Add New Product</h1>
          </div>
          <p className="ml-14 text-neutral-600">Create a product on behalf of a seller</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Store Selector */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-neutral-500" />
            <h2 className="text-base font-semibold text-neutral-900">
              Seller&apos;s Store <span className="text-red-500">*</span>
            </h2>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setStoreDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-neutral-300 rounded-xl bg-white hover:border-neutral-400 transition-colors text-left"
            >
              {selectedStore ? (
                <span className="text-neutral-900 font-medium">{selectedStore.name}</span>
              ) : (
                <span className="text-neutral-400">
                  {storesLoading ? 'Loading stores…' : 'Select a seller store first'}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform ${storeDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {storeDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                    <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search stores…"
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {/* Options */}
                <ul className="max-h-56 overflow-y-auto py-1">
                  {filteredStores.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-neutral-400 text-center">
                      No stores found
                    </li>
                  ) : (
                    filteredStores.map((store) => (
                      <li key={store.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStore(store);
                            setStoreDropdownOpen(false);
                            setStoreSearch('');
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors ${
                            selectedStore?.id === store.id ? 'bg-[#fdf9f0]' : ''
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{store.name}</p>
                            <p className="text-xs text-neutral-400">{store.user.email}</p>
                          </div>
                          <span className="text-xs text-neutral-400">
                            {store._count.products} products
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            Assign this product to a specific seller&apos;s store (required for commissions and
            payouts)
          </p>

          {!selectedStore && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              You must select a store before the product can be created.
            </div>
          )}
        </div>

        {/* Product Form — seller form with admin bypass */}
        <ProductForm
          adminMode
          adminGelatoConfigured={
            !!(
              selectedStore?.gelatoSettings?.isEnabled && selectedStore?.gelatoSettings?.isVerified
            )
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

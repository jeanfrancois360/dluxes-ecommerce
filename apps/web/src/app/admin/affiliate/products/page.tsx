'use client';

import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Tag } from 'lucide-react';

function AffiliateProductsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Products</h1>
          <p className="text-gray-500 mt-1">Manage affiliate product listings and translations</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Products — Coming in C.5 Step 3
        </h2>
        <p className="text-sm text-gray-500">
          Full CRUD for affiliate products and translation management will be implemented here.
        </p>
      </div>
    </div>
  );
}

export default function AdminAffiliateProductsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AffiliateProductsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

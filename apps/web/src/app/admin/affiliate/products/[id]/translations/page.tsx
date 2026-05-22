'use client';

import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Languages } from 'lucide-react';
import { useParams } from 'next/navigation';

function TranslationsContent() {
  const params = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Translations</h1>
          <p className="text-gray-500 mt-1">
            Manage localized content for product{' '}
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">{params.id}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Languages className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Translations — Coming in C.5 Step 4
        </h2>
        <p className="text-sm text-gray-500">
          Locale tabs with title/description fields per language will be implemented here.
        </p>
      </div>
    </div>
  );
}

export default function AdminAffiliateProductTranslationsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <TranslationsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

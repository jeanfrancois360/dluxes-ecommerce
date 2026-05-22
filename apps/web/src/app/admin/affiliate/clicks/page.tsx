'use client';

import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { MousePointerClick } from 'lucide-react';

function ClicksContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Click Analytics</h1>
          <p className="text-gray-500 mt-1">View affiliate link click logs and analytics</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <MousePointerClick className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Click Analytics — Coming in C.5 Step 5
        </h2>
        <p className="text-sm text-gray-500">
          Click log table with product filter, date range filter, and pagination will be implemented
          here.
        </p>
      </div>
    </div>
  );
}

export default function AdminAffiliateClicksPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <ClicksContent />
      </AdminLayout>
    </AdminRoute>
  );
}

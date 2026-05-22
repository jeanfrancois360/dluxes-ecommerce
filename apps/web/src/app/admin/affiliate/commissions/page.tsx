'use client';

import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { TrendingUp } from 'lucide-react';

function CommissionsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Commissions</h1>
          <p className="text-gray-500 mt-1">View Awin commission transactions and trigger sync</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Commissions — Coming in C.5 Step 5
        </h2>
        <p className="text-sm text-gray-500">
          Commission list with status badges, date range filter, and Awin sync button will be
          implemented here.
        </p>
      </div>
    </div>
  );
}

export default function AdminAffiliateCommissionsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CommissionsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

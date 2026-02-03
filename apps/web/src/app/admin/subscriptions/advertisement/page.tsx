'use client';

import React from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';

// TODO: Connect to AdvertisementPlan API when available

function AdSubscriptionsContent() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gray-900 rounded-lg p-8 shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-gray-800 rounded-lg">
            <svg className="w-7 h-7 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-black">Advertisement Campaigns</h1>
        </div>
        <p className="text-gray-400 text-lg ml-14">Monitor active campaigns and performance metrics</p>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Ad Subscriptions</h3>
        <p className="text-gray-600 mb-4">Advertisement subscription system is not yet implemented</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-600 font-medium">Backend API Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

export default function AdSubscriptionsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdSubscriptionsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

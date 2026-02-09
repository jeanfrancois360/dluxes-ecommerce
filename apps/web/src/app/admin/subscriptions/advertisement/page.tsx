'use client';

import React from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';

// TODO: Connect to AdvertisementPlan API when available

function AdSubscriptionsContent() {
  return (
    <>
      <PageHeader
        title="Advertisement Campaigns"
        description="Monitor active campaigns and performance metrics"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Campaign Overview</h2>

          {/* Empty State */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-16 text-center">
            <div className="w-20 h-20 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">No Ad Subscriptions</h3>
            <p className="text-neutral-600 mb-4">
              Advertisement subscription system is not yet implemented
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg border border-neutral-200">
              <svg
                className="w-4 h-4 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-neutral-600 font-medium">Backend API Coming Soon</span>
            </div>
          </div>
        </section>
      </div>
    </>
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

'use client';

import React from 'react';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  product?: {
    id: string;
    name: string;
    store?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

interface Commission {
  id: string;
  storeId: string;
  sellerId: string;
  orderAmount: number;
  commissionAmount: number;
  currency: string;
  status: string;
  store: {
    id: string;
    name: string;
    slug: string;
  };
}

interface OrderBreakdownProps {
  items: OrderItem[];
  commissions?: Commission[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency?: string;
}

interface StoreBreakdown {
  storeId: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  commission?: Commission;
  netPayout?: number;
}

export function OrderBreakdown({
  items = [],
  commissions = [],
  subtotal,
  tax,
  shipping,
  total,
  currency = 'USD',
}: OrderBreakdownProps) {
  // Group items by store
  const storeBreakdowns: Record<string, StoreBreakdown> = {};

  items.forEach((item) => {
    const storeId = item.product?.store?.id || 'platform';
    const storeName = item.product?.store?.name || 'Platform Products';
    const itemTotal = item.price * item.quantity;

    if (!storeBreakdowns[storeId]) {
      storeBreakdowns[storeId] = {
        storeId,
        storeName,
        items: [],
        subtotal: 0,
      };
    }

    storeBreakdowns[storeId].items.push(item);
    storeBreakdowns[storeId].subtotal += itemTotal;
  });

  // Add commission data to store breakdowns
  commissions.forEach((commission) => {
    const storeId = commission.storeId;
    if (storeBreakdowns[storeId]) {
      storeBreakdowns[storeId].commission = commission;
      storeBreakdowns[storeId].netPayout =
        commission.orderAmount - commission.commissionAmount;
    }
  });

  const storeArray = Object.values(storeBreakdowns);
  const totalCommission = commissions.reduce(
    (sum, c) => sum + Number(c.commissionAmount),
    0
  );

  return (
    <div className="space-y-6">
      {/* Multi-Vendor Breakdown */}
      {storeArray.length > 1 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              Multi-Vendor Order Breakdown
            </h3>
          </div>

          <div className="space-y-4">
            {storeArray.map((store) => (
              <div
                key={store.storeId}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {store.storeName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {store.items.length} item
                      {store.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${formatCurrencyAmount(store.subtotal, 2)}
                    </div>
                  </div>
                </div>

                {/* Items in this store */}
                <div className="space-y-2 mb-3">
                  {store.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm pl-4 border-l-2 border-gray-200"
                    >
                      <span className="text-gray-600">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-gray-900 font-medium">
                        ${formatCurrencyAmount(item.price * item.quantity, 2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Commission breakdown if available */}
                {store.commission && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Order Amount</span>
                      <span className="text-gray-900">
                        ${formatCurrencyAmount(store.commission.orderAmount, 2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Platform Commission ({' '}
                        {store.commission.orderAmount > 0
                          ? (
                              (store.commission.commissionAmount /
                                store.commission.orderAmount) *
                              100
                            ).toFixed(1)
                          : 0}
                        % )
                      </span>
                      <span className="text-red-600 font-medium">
                        -${formatCurrencyAmount(store.commission.commissionAmount, 2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span className="text-gray-900">
                        Seller Net Payout
                      </span>
                      <span className="text-green-600">
                        ${formatCurrencyAmount(store.netPayout || 0, 2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Platform totals */}
          {totalCommission > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  Total Platform Commission
                </span>
                <span className="text-lg font-bold text-blue-600">
                  ${formatCurrencyAmount(totalCommission, 2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Order Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">
              ${formatCurrencyAmount(subtotal, 2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">
              ${formatCurrencyAmount(tax, 2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900">
              ${formatCurrencyAmount(shipping, 2)}
            </span>
          </div>
          {totalCommission > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Commission</span>
              <span className="text-blue-600 font-medium">
                ${formatCurrencyAmount(totalCommission, 2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">
              ${formatCurrencyAmount(total, 2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

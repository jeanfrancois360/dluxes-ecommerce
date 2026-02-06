'use client';

import React, { useEffect, useState } from 'react';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { currencyApi, CurrencyRate } from '@/lib/api/currency';
import { useTranslations } from 'next-intl';

// Currency symbols map for common currencies (fallback if API fails)
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  RWF: 'FRw',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  SEK: 'kr',
  NZD: 'NZ$',
  KRW: '₩',
  SGD: 'S$',
  NOK: 'kr',
  MXN: 'MX$',
  INR: '₹',
  BRL: 'R$',
  ZAR: 'R',
  HKD: 'HK$',
  LUX: '€', // Luxembourg uses Euro
};

/**
 * Format currency for admin views - shows amount in ORIGINAL currency
 */
function formatAdminCurrency(amount: number, currencyCode: string, currencyData?: CurrencyRate | null): string {
  if (currencyData) {
    return currencyApi.formatPrice(amount, currencyData);
  }

  // Fallback: use currency symbols map
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  const formattedAmount = formatCurrencyAmount(amount, 2);

  // Some currencies use symbol after amount
  if (['JPY', 'KRW', 'SEK', 'NOK', 'RWF'].includes(currencyCode)) {
    return `${formattedAmount} ${symbol}`;
  }

  return `${symbol}${formattedAmount}`;
}

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
  const t = useTranslations('components.orderBreakdown');
  const [currencyData, setCurrencyData] = useState<CurrencyRate | null>(null);

  // Fetch currency data on mount or when currency changes
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const data = await currencyApi.getRate(currency);
        setCurrencyData(data);
      } catch (error) {
        console.error('Failed to fetch currency data:', error);
        setCurrencyData(null); // Will use fallback
      }
    };

    if (currency) {
      fetchCurrency();
    }
  }, [currency]);

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
              {t('multiVendorBreakdown')}
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
                      {store.items.length} {store.items.length === 1 ? t('item') : t('items')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatAdminCurrency(store.subtotal, currency, currencyData)}
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
                        {formatAdminCurrency(item.price * item.quantity, currency, currencyData)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Commission breakdown if available */}
                {store.commission && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('orderAmount')}</span>
                      <span className="text-gray-900">
                        {formatAdminCurrency(store.commission.orderAmount, currency, currencyData)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t('platformCommission')} ({' '}
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
                        -{formatAdminCurrency(store.commission.commissionAmount, currency, currencyData)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span className="text-gray-900">
                        {t('sellerNetPayout')}
                      </span>
                      <span className="text-green-600">
                        {formatAdminCurrency(store.netPayout || 0, currency, currencyData)}
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
                  {t('totalPlatformCommission')}
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatAdminCurrency(totalCommission, currency, currencyData)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('orderSummary')}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('subtotal')}</span>
            <span className="text-gray-900">
              {formatAdminCurrency(subtotal, currency, currencyData)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('tax')}</span>
            <span className="text-gray-900">
              {formatAdminCurrency(tax, currency, currencyData)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('shipping')}</span>
            <span className="text-gray-900">
              {formatAdminCurrency(shipping, currency, currencyData)}
            </span>
          </div>
          {totalCommission > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('platformCommission')}</span>
              <span className="text-blue-600 font-medium">
                {formatAdminCurrency(totalCommission, currency, currencyData)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span className="text-gray-900">{t('total')}</span>
            <span className="text-gray-900">
              {formatAdminCurrency(total, currency, currencyData)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

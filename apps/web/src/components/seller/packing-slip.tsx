'use client';

import React, { forwardRef } from 'react';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { SellerOrderDetail } from '@/lib/api/seller';
import { useTranslations } from 'next-intl';

interface PackingSlipProps {
  order: SellerOrderDetail;
  storeName?: string;
}

export const PackingSlip = forwardRef<HTMLDivElement, PackingSlipProps>(
  ({ order, storeName = 'NextPik Store' }, ref) => {
    const t = useTranslations('components.packingSlip');

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const customerName = [order.user.firstName, order.user.lastName]
      .filter(Boolean)
      .join(' ') || t('customer');

    return (
      <div ref={ref} className="packing-slip bg-white p-8 max-w-[800px] mx-auto">
        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .packing-slip,
            .packing-slip * {
              visibility: visible;
            }
            .packing-slip {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-black">{storeName}</h1>
              <p className="text-sm text-neutral-600 mt-1">{t('packingSlip')}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-black">Order #{order.orderNumber}</p>
              <p className="text-sm text-neutral-600">{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Ship To */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-sm font-bold text-neutral-500 uppercase mb-2">{t('shipTo')}</h2>
            <div className="text-sm text-black">
              <p className="font-semibold">{customerName}</p>
              {order.shippingAddress ? (
                <>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && <p>{t('phone')} {order.shippingAddress.phone}</p>}
                </>
              ) : (
                <p className="text-neutral-500 italic">{t('noShippingAddress')}</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-500 uppercase mb-2">{t('orderDetails')}</h2>
            <div className="text-sm text-black space-y-1">
              <p>
                <span className="text-neutral-600">{t('orderDate')}</span> {formatDate(order.createdAt)}
              </p>
              <p>
                <span className="text-neutral-600">{t('orderStatus')}</span> {order.status}
              </p>
              {order.delivery?.trackingNumber && (
                <p>
                  <span className="text-neutral-600">{t('tracking')}</span>{' '}
                  {order.delivery.trackingNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-neutral-500 uppercase mb-3">{t('items')}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-200">
                <th className="text-left py-2 font-semibold text-black">{t('item')}</th>
                <th className="text-center py-2 font-semibold text-black w-20">{t('qty')}</th>
                <th className="text-right py-2 font-semibold text-black w-24">{t('price')}</th>
                <th className="text-right py-2 font-semibold text-black w-24">{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100">
                  <td className="py-3">
                    <p className="font-medium text-black">{item.product.name}</p>
                    <p className="text-xs text-neutral-500">SKU: {item.product.id.slice(0, 8)}</p>
                  </td>
                  <td className="text-center py-3 text-black">{item.quantity}</td>
                  <td className="text-right py-3 text-black">{formatCurrencyAmount(item.price)}</td>
                  <td className="text-right py-3 font-medium text-black">
                    {formatCurrencyAmount(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-200">
                <td colSpan={3} className="text-right py-3 font-semibold text-black">
                  {t('subtotal')}
                </td>
                <td className="text-right py-3 font-semibold text-black">
                  {formatCurrencyAmount(
                    order.items.reduce((sum, item) => sum + Number(item.total), 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes Section */}
        {order.notes && (
          <div className="mb-8 p-4 bg-neutral-50 rounded-lg">
            <h2 className="text-sm font-bold text-neutral-500 uppercase mb-2">{t('orderNotes')}</h2>
            <p className="text-sm text-black">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-neutral-200 pt-4 mt-8">
          <div className="flex justify-between items-center text-xs text-neutral-500">
            <p>{t('thankYou')}</p>
            <p>{t('printedOn', { date: new Date().toLocaleDateString() })}</p>
          </div>
        </div>

        {/* Checkbox Section for Packing */}
        <div className="mt-6 border-t border-dashed border-neutral-300 pt-4">
          <h2 className="text-sm font-bold text-neutral-500 uppercase mb-3">{t('packingChecklist')}</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-neutral-400 rounded" />
                <span className="text-sm text-black">
                  {item.product.name} (x{item.quantity})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

PackingSlip.displayName = 'PackingSlip';

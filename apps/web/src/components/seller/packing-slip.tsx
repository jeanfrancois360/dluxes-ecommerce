'use client';

import React, { forwardRef } from 'react';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { SellerOrderDetail } from '@/lib/api/seller';

interface PackingSlipProps {
  order: SellerOrderDetail;
  storeName?: string;
}

export const PackingSlip = forwardRef<HTMLDivElement, PackingSlipProps>(
  ({ order, storeName = 'NextPik Store' }, ref) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const customerName = [order.user.firstName, order.user.lastName]
      .filter(Boolean)
      .join(' ') || 'Customer';

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
              <p className="text-sm text-neutral-600 mt-1">Packing Slip</p>
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
            <h2 className="text-sm font-bold text-neutral-500 uppercase mb-2">Ship To</h2>
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
                  {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                </>
              ) : (
                <p className="text-neutral-500 italic">No shipping address provided</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-500 uppercase mb-2">Order Details</h2>
            <div className="text-sm text-black space-y-1">
              <p>
                <span className="text-neutral-600">Order Date:</span> {formatDate(order.createdAt)}
              </p>
              <p>
                <span className="text-neutral-600">Order Status:</span> {order.status}
              </p>
              {order.delivery?.trackingNumber && (
                <p>
                  <span className="text-neutral-600">Tracking:</span>{' '}
                  {order.delivery.trackingNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-neutral-500 uppercase mb-3">Items</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-200">
                <th className="text-left py-2 font-semibold text-black">Item</th>
                <th className="text-center py-2 font-semibold text-black w-20">Qty</th>
                <th className="text-right py-2 font-semibold text-black w-24">Price</th>
                <th className="text-right py-2 font-semibold text-black w-24">Total</th>
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
                  Subtotal:
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
            <h2 className="text-sm font-bold text-neutral-500 uppercase mb-2">Order Notes</h2>
            <p className="text-sm text-black">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-neutral-200 pt-4 mt-8">
          <div className="flex justify-between items-center text-xs text-neutral-500">
            <p>Thank you for your order!</p>
            <p>Printed on {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Checkbox Section for Packing */}
        <div className="mt-6 border-t border-dashed border-neutral-300 pt-4">
          <h2 className="text-sm font-bold text-neutral-500 uppercase mb-3">Packing Checklist</h2>
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

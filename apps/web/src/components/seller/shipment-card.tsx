'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ShipmentEvent {
  id: string;
  status: string;
  title: string;
  description?: string;
  location?: string;
  createdAt: string;
}

interface ShipmentItem {
  id: string;
  quantity: number;
  orderItem: {
    product: {
      id: string;
      name: string;
    };
  };
}

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shippingCost?: string | number;
  weight?: string | number;
  notes?: string;
  items: ShipmentItem[];
  events: ShipmentEvent[];
  createdAt: string;
}

interface ShipmentCardProps {
  shipment: Shipment;
  currency: string;
  onUpdate?: () => void;
}

function getStatusIcon(status: string) {
  const icons: Record<string, { icon: any; color: string }> = {
    PENDING: { icon: Clock, color: 'text-yellow-600' },
    PROCESSING: { icon: Package, color: 'text-blue-600' },
    LABEL_CREATED: { icon: Package, color: 'text-indigo-600' },
    PICKED_UP: { icon: Truck, color: 'text-purple-600' },
    IN_TRANSIT: { icon: Truck, color: 'text-blue-600' },
    OUT_FOR_DELIVERY: { icon: Truck, color: 'text-green-600' },
    DELIVERED: { icon: CheckCircle2, color: 'text-green-600' },
    FAILED_DELIVERY: { icon: AlertCircle, color: 'text-red-600' },
    RETURNED: { icon: XCircle, color: 'text-gray-600' },
  };
  return icons[status] || { icon: Package, color: 'text-gray-600' };
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    PROCESSING: 'bg-blue-100 text-blue-800 border-blue-300',
    LABEL_CREATED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    PICKED_UP: 'bg-purple-100 text-purple-800 border-purple-300',
    IN_TRANSIT: 'bg-blue-100 text-blue-800 border-blue-300',
    OUT_FOR_DELIVERY: 'bg-green-100 text-green-800 border-green-300',
    DELIVERED: 'bg-green-100 text-green-800 border-green-300',
    FAILED_DELIVERY: 'bg-red-100 text-red-800 border-red-300',
    RETURNED: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ShipmentCard({ shipment, currency, onUpdate }: ShipmentCardProps) {
  const { icon: StatusIcon, color: iconColor } = getStatusIcon(shipment.status);
  const [expanded, setExpanded] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="p-4 bg-neutral-50 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-neutral-200`}>
              <StatusIcon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className="font-semibold text-black">{shipment.shipmentNumber}</p>
              <p className="text-sm text-neutral-500">
                {formatDate(shipment.createdAt)}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
              shipment.status
            )}`}
          >
            {shipment.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Carrier & Tracking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shipment.carrier && (
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Carrier</p>
                <p className="text-sm font-medium text-black">{shipment.carrier}</p>
              </div>
            </div>
          )}
          {shipment.trackingNumber && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Tracking Number</p>
                <p className="text-sm font-mono font-medium text-black">
                  {shipment.trackingNumber}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tracking URL */}
        {shipment.trackingUrl && (
          <a
            href={shipment.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Track Package
          </a>
        )}

        {/* Items */}
        <div>
          <p className="text-xs font-medium text-neutral-600 mb-2">
            Items in this shipment ({shipment.items.length})
          </p>
          <div className="space-y-1">
            {shipment.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">
                  {item.orderItem.product.name}
                </span>
                <span className="text-neutral-500">×{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dates & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {shipment.estimatedDelivery && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Est. Delivery</p>
                <p className="font-medium text-black">
                  {formatDate(shipment.estimatedDelivery)}
                </p>
              </div>
            </div>
          )}
          {shipment.shippedAt && (
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Shipped</p>
                <p className="font-medium text-black">
                  {formatDate(shipment.shippedAt)}
                </p>
              </div>
            </div>
          )}
          {shipment.deliveredAt && (
            <div className="flex items-center gap-2 col-span-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-neutral-500">Delivered</p>
                <p className="font-medium text-green-600">
                  {formatDate(shipment.deliveredAt)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Shipping Details */}
        {(shipment.shippingCost || shipment.weight) && (
          <div className="flex items-center gap-4 text-sm">
            {shipment.shippingCost && (
              <div>
                <p className="text-xs text-neutral-500">Shipping Cost</p>
                <p className="font-medium text-black">
                  {formatCurrency(Number(shipment.shippingCost), currency)}
                </p>
              </div>
            )}
            {shipment.weight && (
              <div>
                <p className="text-xs text-neutral-500">Weight</p>
                <p className="font-medium text-black">{Number(shipment.weight)} kg</p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {shipment.notes && (
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-xs font-medium text-neutral-600 mb-1">Notes</p>
            <p className="text-sm text-neutral-700">{shipment.notes}</p>
          </div>
        )}

        {/* Timeline Toggle */}
        {shipment.events && shipment.events.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-sm font-medium text-neutral-700 hover:text-black transition-colors"
          >
            <span>Tracking Timeline ({shipment.events.length} events)</span>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Expanded Timeline */}
      {expanded && shipment.events && shipment.events.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-neutral-200 bg-neutral-50"
        >
          <div className="p-4">
            <div className="space-y-3">
              {shipment.events.map((event, index) => {
                const isFirst = index === 0;
                return (
                  <div key={event.id} className="relative pl-6">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 ${
                        isFirst
                          ? 'bg-gold border-gold'
                          : 'bg-white border-neutral-300'
                      }`}
                    />
                    {/* Timeline line */}
                    {index < shipment.events.length - 1 && (
                      <div className="absolute left-[5px] top-4 w-0.5 h-full bg-neutral-200" />
                    )}
                    {/* Event content */}
                    <div className="pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              isFirst ? 'text-gold' : 'text-black'
                            }`}
                          >
                            {event.title}
                          </p>
                          {event.description && (
                            <p className="text-sm text-neutral-600 mt-0.5">
                              {event.description}
                            </p>
                          )}
                          {event.location && (
                            <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-neutral-500 whitespace-nowrap">
                          {formatDate(event.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

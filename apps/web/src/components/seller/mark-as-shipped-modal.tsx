'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Truck, Calendar, DollarSign, Weight, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    heroImage?: string | null;
  };
  quantity: number;
  price: string | number;
  total: string | number;
}

interface MarkAsShippedModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  storeId: string;
  items: OrderItem[];
  currency: string;
  onSuccess?: () => void;
}

export function MarkAsShippedModal({
  isOpen,
  onClose,
  orderId,
  storeId,
  items,
  currency,
  onSuccess,
}: MarkAsShippedModalProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    items.map((item) => item.id)
  );
  const [useAutoGenerate, setUseAutoGenerate] = useState(true); // Auto-generate by default
  const [carrier, setCarrier] = useState('DHL');
  const [serviceType, setServiceType] = useState('express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItemIds.length === 0) {
      toast.error('Please select at least one item to ship');
      return;
    }

    // Validate based on mode
    if (!useAutoGenerate && !trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    if (useAutoGenerate) {
      // Validate required fields for DHL API
      if (!carrier) {
        toast.error('Please select a carrier');
        return;
      }
      if (!weight) {
        toast.error('Please enter package weight');
        return;
      }
      if (!length || !width || !height) {
        toast.error('Please enter package dimensions (L x W x H)');
        return;
      }
    }

    try {
      setCreating(true);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const token = localStorage.getItem('auth_token');

      const payload: any = {
        orderId,
        storeId,
        itemIds: selectedItemIds,
        carrier: carrier.trim() || undefined,
        generateTracking: useAutoGenerate, // New flag for backend
        notes: notes.trim() || undefined,
      };

      // Add fields based on mode
      if (useAutoGenerate) {
        // DHL API fields
        payload.serviceType = serviceType;
        payload.weight = parseFloat(weight);
        payload.dimensions = {
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          unit: 'cm'
        };
      } else {
        // Manual tracking fields
        payload.trackingNumber = trackingNumber.trim();
        payload.trackingUrl = trackingUrl.trim() || undefined;
        payload.estimatedDelivery = estimatedDelivery || undefined;
        payload.shippingCost = shippingCost ? parseFloat(shippingCost) : undefined;
        payload.weight = weight ? parseFloat(weight) : undefined;
      }

      const response = await fetch(`${API_URL}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create shipment');
      }

      const data = await response.json();

      if (useAutoGenerate && data.data.trackingNumber) {
        toast.success(`Shipment created! Tracking: ${data.data.trackingNumber}`);
      } else {
        toast.success(`Shipment ${data.data.shipmentNumber} created successfully`);
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to create shipment:', error);
      toast.error(error.message || 'Failed to create shipment');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-black to-neutral-800 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Mark as Shipped</h2>
                        <p className="text-neutral-300 text-sm mt-0.5">
                          Create shipment and add tracking information
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  {/* Items Selection */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Items to Ship ({selectedItemIds.length}/{items.length} selected)
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-neutral-200 rounded-lg p-3">
                      {items.map((item) => {
                        const isSelected = selectedItemIds.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-gold bg-gold/5'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleItemToggle(item.id)}
                              className="w-4 h-4 text-gold focus:ring-gold border-neutral-300 rounded"
                            />
                            {item.product.heroImage ? (
                              <img
                                src={item.product.heroImage}
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-neutral-100 rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-neutral-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-black truncate">{item.product.name}</p>
                              <p className="text-sm text-neutral-500">Quantity: {item.quantity}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Auto-Generate Toggle */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAutoGenerate}
                        onChange={(e) => setUseAutoGenerate(e.target.checked)}
                        className="w-5 h-5 text-gold focus:ring-gold border-neutral-300 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">Generate tracking via DHL API</p>
                        <p className="text-sm text-blue-700 mt-0.5">
                          Automatically create shipping label and get tracking number from DHL
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Carrier */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Carrier {useAutoGenerate && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      required={useAutoGenerate}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="DHL">DHL</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="USPS">USPS</option>
                      <option value="DPD">DPD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Conditional: DHL API Fields or Manual Entry */}
                  {useAutoGenerate ? (
                    <>
                      {/* Service Type */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Service Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                        >
                          <option value="express">DHL Express Worldwide</option>
                          <option value="standard">DHL Standard</option>
                          <option value="economy">DHL Economy Select</option>
                        </select>
                      </div>

                      {/* Package Dimensions */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Package Dimensions (cm) <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="number"
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            placeholder="Length"
                            step="0.1"
                            min="0"
                            required
                            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                          <input
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            placeholder="Width"
                            step="0.1"
                            min="0"
                            required
                            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                          <input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            placeholder="Height"
                            step="0.1"
                            min="0"
                            required
                            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Enter dimensions in centimeters (L × W × H)</p>
                      </div>

                      {/* Weight (Required for DHL) */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          <Weight className="w-4 h-4 inline mr-1" />
                          Package Weight (kg) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="0.0"
                          step="0.1"
                          min="0"
                          required
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Manual Tracking Number */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Tracking Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Enter tracking number"
                          required
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>

                      {/* Tracking URL */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Tracking URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          placeholder="https://track.carrier.com/..."
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>

                      {/* Weight (Optional for manual) */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          <Weight className="w-4 h-4 inline mr-1" />
                          Package Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="0.0"
                          step="0.1"
                          min="0"
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>
                    </>
                  )}

                  {/* Optional fields for manual mode */}
                  {!useAutoGenerate && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Estimated Delivery */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Estimated Delivery
                        </label>
                        <input
                          type="date"
                          value={estimatedDelivery}
                          onChange={(e) => setEstimatedDelivery(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>

                      {/* Shipping Cost */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          Shipping Cost ({currency})
                        </label>
                        <input
                          type="number"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes about this shipment..."
                      rows={3}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Warning */}
                  {selectedItemIds.length < items.length && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Partial Shipment</p>
                        <p className="text-sm text-yellow-700 mt-0.5">
                          You're only shipping {selectedItemIds.length} of {items.length} items.
                          The remaining items can be shipped separately later.
                        </p>
                      </div>
                    </div>
                  )}
                </form>

                {/* Footer */}
                <div className="bg-neutral-50 px-6 py-4 flex items-center justify-between border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={creating}
                    className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={
                      creating ||
                      selectedItemIds.length === 0 ||
                      (useAutoGenerate
                        ? !weight || !length || !width || !height
                        : !trackingNumber.trim())
                    }
                    className="px-6 py-2 bg-gold text-black font-medium rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {useAutoGenerate ? 'Generating Tracking...' : 'Creating Shipment...'}
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4" />
                        {useAutoGenerate ? 'Generate & Create Shipment' : 'Create Shipment'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

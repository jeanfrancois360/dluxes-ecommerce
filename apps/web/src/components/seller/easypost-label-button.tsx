'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Truck, Download, ExternalLink, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

interface EasyPostLabelButtonProps {
  orderId: string;
  orderItemId?: string;
  sellerId: string;
  storeId?: string;
  fromAddress: {
    street1: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    name?: string;
  };
  toAddress: {
    street1: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    name?: string;
  };
  parcel: {
    length: number;
    width: number;
    height: number;
    weight: number; // in ounces
  };
}

interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  deliveryDays: number | null;
  deliveryDate?: string;
  deliveryDateGuaranteed?: boolean;
  retailRate?: number | null;
}

interface PurchasedLabel {
  id: string;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  labelPdfUrl?: string;
  labelZplUrl?: string;
  carrier: string;
  service: string;
  rate: number;
  estimatedDeliveryDate?: string;
}

export function EasyPostLabelButton({
  orderId,
  orderItemId,
  sellerId,
  storeId,
  fromAddress,
  toAddress,
  parcel,
}: EasyPostLabelButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [purchasedLabel, setPurchasedLabel] = useState<PurchasedLabel | null>(null);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/easypost/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fromAddress,
          toAddress,
          parcel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch rates');
      }

      const data = await response.json();
      setRates(data.rates || []);
      setShipmentId(data.shipmentId);
      setIsOpen(true);

      if (data.rates?.length === 0) {
        toast.error('No shipping rates available for this destination');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to get shipping rates');
      console.error('Rate fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseLabel = async () => {
    if (!selectedRate || !shipmentId) return;

    setIsPurchasing(true);
    try {
      const response = await fetch('/api/v1/easypost/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          orderItemId,
          sellerId,
          storeId,
          shipmentId,
          rateId: selectedRate,
          fromAddress,
          toAddress,
          parcel,
          labelFormat: 'PDF', // Default to PDF
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to purchase label');
      }

      const data = await response.json();
      setPurchasedLabel(data);
      toast.success('Shipping label purchased successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to purchase label');
      console.error('Label purchase error:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after animation completes
    setTimeout(() => {
      setRates([]);
      setShipmentId(null);
      setSelectedRate(null);
      setPurchasedLabel(null);
    }, 300);
  };

  return (
    <>
      <Button
        onClick={fetchRates}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
        Get Shipping Label
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {purchasedLabel ? (
                <>
                  <Package className="h-5 w-5 text-green-600" />
                  Label Purchased
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5" />
                  Select Shipping Rate
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {purchasedLabel
                ? 'Your shipping label is ready for download'
                : 'Choose a carrier and service for this shipment'}
            </DialogDescription>
          </DialogHeader>

          {!purchasedLabel ? (
            <div className="space-y-4">
              {/* Rates List */}
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRate === rate.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-sm'
                        : 'hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedRate(rate.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-base">{rate.carrier}</div>
                          <Badge variant="secondary" className="text-xs">
                            {rate.service}
                          </Badge>
                        </div>

                        {rate.deliveryDays && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Estimated {rate.deliveryDays} business day
                            {rate.deliveryDays > 1 ? 's' : ''}
                            {rate.deliveryDate && (
                              <span className="ml-1">
                                (by {new Date(rate.deliveryDate).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        )}

                        {rate.deliveryDateGuaranteed && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Guaranteed Delivery
                          </Badge>
                        )}
                      </div>

                      <div className="text-right">
                        <Badge
                          variant={selectedRate === rate.id ? 'default' : 'secondary'}
                          className="text-lg font-bold px-3 py-1"
                        >
                          ${formatCurrencyAmount(rate.rate, 2)}
                        </Badge>
                        {rate.retailRate && rate.retailRate > rate.rate && (
                          <div className="text-xs text-muted-foreground line-through mt-1">
                            ${formatCurrencyAmount(rate.retailRate, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {rates.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    No shipping rates available
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={purchaseLabel}
                  disabled={!selectedRate || isPurchasing}
                  className="gap-2"
                >
                  {isPurchasing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Purchase Label
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success Info */}
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Tracking Number
                </div>
                <div className="font-mono text-lg text-green-900 dark:text-green-100">
                  {purchasedLabel.trackingNumber}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {purchasedLabel.carrier} - {purchasedLabel.service}
                </div>
              </div>

              {/* Estimated Delivery */}
              {purchasedLabel.estimatedDeliveryDate && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <span className="font-medium">Estimated Delivery:</span>{' '}
                  {new Date(purchasedLabel.estimatedDeliveryDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button asChild className="flex-1 gap-2">
                  <a
                    href={purchasedLabel.labelPdfUrl || purchasedLabel.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Download className="h-4 w-4" />
                    Download Label (PDF)
                  </a>
                </Button>
                <Button variant="outline" asChild className="gap-2">
                  <a href={purchasedLabel.trackingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Track Package
                  </a>
                </Button>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

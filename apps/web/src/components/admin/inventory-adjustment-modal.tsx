'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nextpik/ui';
import { adminProductsApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import { Loader2, Package, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InventoryAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  variantId?: string;
  productName?: string;
  variantName?: string;
  currentStock?: number;
  onSuccess?: () => void;
}

type TransactionType = 'SALE' | 'RETURN' | 'RESTOCK' | 'ADJUSTMENT' | 'DAMAGE';

export function InventoryAdjustmentModal({
  open,
  onOpenChange,
  productId,
  variantId,
  productName,
  variantName,
  currentStock = 0,
  onSuccess,
}: InventoryAdjustmentModalProps) {
  const t = useTranslations('components.inventoryAdjustmentModal');
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<string>('');
  const [type, setType] = useState<TransactionType>('ADJUSTMENT');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const transactionTypes: { value: TransactionType; label: string; icon: React.ReactNode }[] = [
    { value: 'RESTOCK', label: t('purchaseReceive'), icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'SALE', label: t('sale'), icon: <TrendingDown className="h-4 w-4" /> },
    { value: 'ADJUSTMENT', label: t('adjustment'), icon: <RefreshCw className="h-4 w-4" /> },
    { value: 'RETURN', label: t('return'), icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'DAMAGE', label: t('damageLoss'), icon: <TrendingDown className="h-4 w-4" /> },
  ];

  const itemName = variantName || productName || 'Product';
  const isDeduction = ['SALE', 'DAMAGE'].includes(type);
  const quantityNumber = parseInt(quantity) || 0;
  const adjustedQuantity = isDeduction ? -Math.abs(quantityNumber) : Math.abs(quantityNumber);
  const newStock = currentStock + adjustedQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || quantityNumber <= 0) {
      toast.error(t('validQuantityError'));
      return;
    }

    if (newStock < 0) {
      toast.error(t('negativeStockError'));
      return;
    }

    if (!productId) {
      toast.error(t('productIdError'));
      return;
    }

    try {
      setLoading(true);

      const adjustmentData = {
        quantity: adjustedQuantity,
        type,
        reason: reason || undefined,
        notes: notes || undefined,
      };

      if (variantId) {
        await adminProductsApi.adjustVariantInventory(productId, variantId, adjustmentData);
      } else {
        await adminProductsApi.adjustProductInventory(productId, adjustmentData);
      }

      toast.success(t('successMessage'));

      // Reset form
      setQuantity('');
      setReason('');
      setNotes('');
      setType('ADJUSTMENT');

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adjusting inventory:', error);
      toast.error(error.response?.data?.message || t('failedMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('adjustInventory')}</DialogTitle>
          <DialogDescription>
            {t('updateStockLevels', { itemName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Stock Display */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('currentStock')}</p>
                <p className="text-2xl font-bold">{currentStock}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">{t('newStock')}</p>
                <p className={`text-2xl font-bold ${newStock < 0 ? 'text-red-600' : newStock < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {newStock}
                </p>
              </div>
            </div>
            {quantityNumber > 0 && (
              <div className="mt-2 flex items-center justify-center">
                <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                  isDeduction ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {isDeduction ? '−' : '+'} {Math.abs(adjustedQuantity)} {t('units')}
                </div>
              </div>
            )}
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type">{t('transactionType')}</Label>
            <Select value={type} onValueChange={(value) => setType(value as TransactionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((txType) => (
                  <SelectItem key={txType.value} value={txType.value}>
                    <div className="flex items-center gap-2">
                      {txType.icon}
                      <span>{txType.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {t('quantity')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('enterQuantity')}
              required
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('reason')}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading || newStock < 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('adjustInventoryButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

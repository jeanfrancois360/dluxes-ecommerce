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
} from '@luxury/ui';
import { adminProductsApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import { Loader2, Package, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface BulkInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
  onSuccess?: () => void;
}

type TransactionType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'RESTOCK';

const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: 'PURCHASE', label: 'Purchase/Receive' },
  { value: 'SALE', label: 'Sale' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'RETURN', label: 'Return' },
  { value: 'DAMAGE', label: 'Damage/Loss' },
  { value: 'RESTOCK', label: 'Restock' },
];

export function BulkInventoryModal({
  open,
  onOpenChange,
  productIds,
  onSuccess,
}: BulkInventoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<string>('');
  const [type, setType] = useState<TransactionType>('ADJUSTMENT');
  const [reason, setReason] = useState('');

  const isDeduction = ['SALE', 'DAMAGE'].includes(type);
  const quantityNumber = parseInt(quantity) || 0;
  const adjustedQuantity = isDeduction ? -Math.abs(quantityNumber) : Math.abs(quantityNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || quantityNumber <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (productIds.length === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      setLoading(true);

      const updates = productIds.map((productId) => ({
        productId,
        quantity: adjustedQuantity,
        type,
        reason: reason || undefined,
      }));

      const results = await adminProductsApi.bulkUpdateInventory(updates);

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (failureCount === 0) {
        toast.success(`Successfully updated inventory for ${successCount} products`);
      } else {
        toast.warning(
          `Updated ${successCount} products, but ${failureCount} failed. Check console for details.`
        );
        console.error('Failed updates:', results.filter((r) => !r.success));
      }

      // Reset form
      setQuantity('');
      setReason('');
      setType('ADJUSTMENT');

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error in bulk inventory update:', error);
      toast.error(error.response?.data?.message || 'Failed to update inventory');
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
          <DialogTitle>Bulk Inventory Adjustment</DialogTitle>
          <DialogDescription>
            Update stock levels for {productIds.length} selected products
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Selected Products</span>
              </div>
              <span className="text-2xl font-bold">{productIds.length}</span>
            </div>
            {quantityNumber > 0 && (
              <div className="mt-3 flex items-center justify-center">
                <div
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    isDeduction ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {isDeduction ? '−' : '+'} {Math.abs(adjustedQuantity)} units each
                </div>
              </div>
            )}
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as TransactionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((txType) => (
                  <SelectItem key={txType.value} value={txType.value}>
                    {txType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity per Product <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
            <p className="text-xs text-muted-foreground">
              This amount will be {isDeduction ? 'deducted from' : 'added to'} each selected product
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Monthly inventory restock"
            />
          </div>

          {/* Warning for deductions */}
          {isDeduction && quantityNumber > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <strong>Warning:</strong> This will deduct {Math.abs(adjustedQuantity)} units from
                each selected product. Products with insufficient stock will fail.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update {productIds.length} Products
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

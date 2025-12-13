'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
} from '@luxury/ui';
import { adminProductsApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import { Loader2, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { INVENTORY_DEFAULTS } from '@/lib/constants/inventory';

interface InventoryHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
}

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
  };
}

const transactionTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PURCHASE: {
    label: 'Purchase',
    color: 'text-green-600 bg-green-100',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  SALE: {
    label: 'Sale',
    color: 'text-blue-600 bg-blue-100',
    icon: <TrendingDown className="h-4 w-4" />,
  },
  ADJUSTMENT: {
    label: 'Adjustment',
    color: 'text-purple-600 bg-purple-100',
    icon: <Package className="h-4 w-4" />,
  },
  RETURN: {
    label: 'Return',
    color: 'text-cyan-600 bg-cyan-100',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  DAMAGE: {
    label: 'Damage',
    color: 'text-red-600 bg-red-100',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  RESTOCK: {
    label: 'Restock',
    color: 'text-emerald-600 bg-emerald-100',
    icon: <Package className="h-4 w-4" />,
  },
};

export function InventoryHistoryModal({
  open,
  onOpenChange,
  productId,
  productName,
}: InventoryHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = INVENTORY_DEFAULTS.TRANSACTION_HISTORY_PAGE_SIZE;

  useEffect(() => {
    if (open && productId) {
      fetchTransactions();
    }
  }, [open, productId, page]);

  const fetchTransactions = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const data = await adminProductsApi.getInventoryTransactions(productId, {
        limit,
        offset: page * limit,
      });
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch (error: any) {
      console.error('Error fetching inventory history:', error);
      toast.error('Failed to load inventory history');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Inventory History</DialogTitle>
          <DialogDescription>
            {productName ? `Transaction history for ${productName}` : 'Product transaction history'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No inventory transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const config = transactionTypeConfig[transaction.type] || {
                  label: transaction.type,
                  color: 'text-gray-600 bg-gray-100',
                  icon: <Package className="h-4 w-4" />,
                };

                const isIncrease = transaction.quantity > 0;

                return (
                  <div
                    key={transaction.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`rounded-full p-2 ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{config.label}</span>
                            {transaction.variant && (
                              <span className="text-xs text-muted-foreground">
                                ({transaction.variant.name})
                              </span>
                            )}
                          </div>
                          {transaction.reason && (
                            <p className="text-sm text-muted-foreground mb-1">
                              {transaction.reason}
                            </p>
                          )}
                          {transaction.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {transaction.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
                            </span>
                            {transaction.user && (
                              <span>
                                by {transaction.user.firstName} {transaction.user.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-lg font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncrease ? '+' : ''}{transaction.quantity}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {transaction.previousQuantity} → {transaction.newQuantity}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

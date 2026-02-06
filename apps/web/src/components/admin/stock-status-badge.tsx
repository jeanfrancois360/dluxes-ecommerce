'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';
import { INVENTORY_DEFAULTS } from '@/lib/constants/inventory';
import { useTranslations } from 'next-intl';

interface StockStatusBadgeProps {
  stock: number;
  lowStockThreshold?: number;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StockStatusBadge({
  stock,
  lowStockThreshold = INVENTORY_DEFAULTS.LOW_STOCK_THRESHOLD,
  className,
  showIcon = true,
  size = 'md',
}: StockStatusBadgeProps) {
  const t = useTranslations('components.stockStatusBadge');

  const getStockStatus = () => {
    if (stock <= 0) {
      return {
        label: t('outOfStock'),
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className={cn('h-3 w-3', size === 'lg' && 'h-4 w-4')} />,
      };
    } else if (stock <= lowStockThreshold) {
      return {
        label: t('lowStock'),
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <AlertTriangle className={cn('h-3 w-3', size === 'lg' && 'h-4 w-4')} />,
      };
    } else {
      return {
        label: t('inStock'),
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className={cn('h-3 w-3', size === 'lg' && 'h-4 w-4')} />,
      };
    }
  };

  const status = getStockStatus();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-medium whitespace-nowrap',
        size === 'sm' && 'text-xs px-2.5 py-1',
        size === 'md' && 'text-sm px-3 py-1.5',
        size === 'lg' && 'text-sm px-3.5 py-2',
        status.color,
        className
      )}
    >
      {showIcon && status.icon}
      <span className="font-semibold">{status.label}</span>
      <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded bg-white/60 text-xs font-bold">
        {stock}
      </span>
    </div>
  );
}

interface StockLevelIndicatorProps {
  stock: number;
  lowStockThreshold?: number;
  className?: string;
}

export function StockLevelIndicator({
  stock,
  lowStockThreshold = INVENTORY_DEFAULTS.LOW_STOCK_THRESHOLD,
  className,
}: StockLevelIndicatorProps) {
  const t = useTranslations('components.stockStatusBadge');
  const percentage = Math.min((stock / (lowStockThreshold * 2)) * 100, 100);

  const getColorClass = () => {
    if (stock <= 0) return 'bg-red-500';
    if (stock <= lowStockThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('stockLevel')}</span>
        <span className="font-medium">{stock} {t('units')}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all', getColorClass())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {stock <= lowStockThreshold && stock > 0 && (
        <p className="text-xs text-yellow-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t('lowStockWarning')}
        </p>
      )}
      {stock <= 0 && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          {t('outOfStockWarning')}
        </p>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ShoppingCart, MessageSquare, Package, Building, Car, Briefcase, Calendar, Download } from 'lucide-react';
import { Button } from '@nextpik/ui';
import { Badge } from '@nextpik/ui';
import ProductInquiryForm from './ProductInquiryForm';

export type ProductType = 'PHYSICAL' | 'REAL_ESTATE' | 'VEHICLE' | 'SERVICE' | 'RENTAL' | 'DIGITAL';
export type PurchaseType = 'INSTANT' | 'INQUIRY';

interface ProductActionButtonProps {
  product: {
    id: string;
    name: string;
    price?: number;
    heroImage?: string;
    productType?: ProductType;
    purchaseType?: PurchaseType;
    contactRequired?: boolean;
    inventory?: number;
  };
  sellerId?: string;
  onAddToCart?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBadge?: boolean;
}

const PRODUCT_TYPE_CONFIG = {
  PHYSICAL: { icon: Package, label: 'Physical Product' },
  REAL_ESTATE: { icon: Building, label: 'Real Estate' },
  VEHICLE: { icon: Car, label: 'Vehicle' },
  SERVICE: { icon: Briefcase, label: 'Service' },
  RENTAL: { icon: Calendar, label: 'Rental' },
  DIGITAL: { icon: Download, label: 'Digital Product' },
};

export default function ProductActionButton({
  product,
  sellerId,
  onAddToCart,
  size = 'md',
  className = '',
  showBadge = false,
}: ProductActionButtonProps) {
  const [isInquiryFormOpen, setIsInquiryFormOpen] = useState(false);

  const purchaseType = product.purchaseType || 'INSTANT';
  const productType = product.productType || 'PHYSICAL';
  const isInquiryBased = purchaseType === 'INQUIRY' || product.contactRequired;
  const isOutOfStock = product.inventory !== undefined && product.inventory <= 0;
  const typeConfig = PRODUCT_TYPE_CONFIG[productType];
  const TypeIcon = typeConfig?.icon || Package;

  const handleAction = () => {
    if (isInquiryBased) {
      setIsInquiryFormOpen(true);
    } else if (onAddToCart) {
      onAddToCart();
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* Product Type Badge */}
        {showBadge && productType !== 'PHYSICAL' && (
          <Badge variant="outline" className="border-[#6B5840] text-[#6B5840] bg-[#CBB57B]/10">
            <TypeIcon className="h-3 w-3 mr-1" />
            {typeConfig?.label}
          </Badge>
        )}

        {/* Action Button */}
        <Button
          onClick={handleAction}
          size={size}
          disabled={!isInquiryBased && isOutOfStock}
          className={`w-full ${
            isInquiryBased
              ? 'bg-[#6B5840] hover:bg-black text-white font-bold'
              : isOutOfStock
              ? 'bg-black/20 text-black/40 cursor-not-allowed'
              : 'bg-black hover:bg-[#6B5840] text-white font-bold'
          } ${className}`}
        >
          {isOutOfStock && !isInquiryBased ? (
            <>
              <Package className="mr-2 h-4 w-4" />
              Out of Stock
            </>
          ) : isInquiryBased ? (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Seller
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>

        {/* Info Text */}
        {isInquiryBased && (
          <p className="text-xs text-black/60 text-center">
            This {typeConfig?.label.toLowerCase()} requires seller contact
          </p>
        )}

        {isOutOfStock && !isInquiryBased && (
          <p className="text-xs text-red-600 text-center">
            Currently unavailable
          </p>
        )}
      </div>

      {/* Inquiry Form Modal */}
      {isInquiryBased && (
        <ProductInquiryForm
          isOpen={isInquiryFormOpen}
          onClose={() => setIsInquiryFormOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            heroImage: product.heroImage,
          }}
          sellerId={sellerId}
        />
      )}
    </>
  );
}

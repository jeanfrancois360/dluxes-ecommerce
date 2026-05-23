'use client';

import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import type { AffiliateProduct } from '@/lib/api/affiliate';

interface AffiliateProductCardProps {
  product: AffiliateProduct;
  locale: string;
  /** Override the card link href. Default: /affiliate/[slug] (detail page).
   *  Blog featured strip passes /api/affiliate/redirect/[id] to track clicks. */
  hrefOverride?: string;
}

function formatPrice(amount: number, currencyCode: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unknown currency codes
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function AffiliateProductCard({ product, locale, hrefOverride }: AffiliateProductCardProps) {
  const title = product.translations?.[0]?.title ?? product.slug;
  const currency = product.displayCurrency || 'USD';
  const hasPrice = product.displayPrice != null && product.displayPrice > 0;
  const hasDiscount =
    hasPrice && product.originalPrice != null && product.originalPrice > product.displayPrice!;

  return (
    <div className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <span className="text-neutral-300 text-xs">No image</span>
          </div>
        )}

        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-amber-900" />
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Advertiser */}
        {product.advertiser && (
          <div className="flex items-center gap-1.5 min-w-0">
            {product.advertiser.logoUrl && (
              <img
                src={product.advertiser.logoUrl}
                alt={product.advertiser.name}
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
            )}
            <span className="text-xs text-neutral-400 truncate">{product.advertiser.name}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug">
          {title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          {hasPrice ? (
            <>
              <span className="text-base font-bold text-neutral-900">
                {formatPrice(product.displayPrice!, currency, locale)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(product.originalPrice!, currency, locale)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-neutral-400">—</span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={hrefOverride ?? `/affiliate/${product.slug}`}
          className="mt-2 block w-full text-center py-2 px-4 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors duration-150"
          {...(hrefOverride ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
}

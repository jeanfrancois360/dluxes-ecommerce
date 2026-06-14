'use client';

import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import type { AffiliateProduct } from '@/lib/api/affiliate';

interface AffiliateProductCardProps {
  product: AffiliateProduct;
  locale: string;
  /** Show a "Partner" badge to visually distinguish affiliate cards when
   *  rendered alongside marketplace products. Default false. */
  showPartnerBadge?: boolean;
}

function formatPrice(amount: number, currencyCode: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

/** Returns true when a string looks like a raw product/SKU identifier
 *  (no spaces, heavily underscore/digit-dominated, e.g. "177943450027lgoods_test_goods_color649492"). */
function looksLikeRawId(s: string): boolean {
  if (!s || s.length < 10) return false;
  const hasSpaces = s.includes(' ');
  if (hasSpaces) return false;
  const nonAlpha = (s.match(/[^a-zA-Z]/g) ?? []).length;
  return nonAlpha / s.length > 0.35;
}

function cleanTitle(raw: string, advertiserName?: string): string {
  if (!looksLikeRawId(raw)) return raw;
  // Turn underscores/dashes into spaces and title-case
  const cleaned = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  // If still looks machine-generated (mostly numbers) use advertiser context
  const wordCount = cleaned.split(' ').length;
  if (wordCount <= 2 && /\d{6,}/.test(cleaned)) {
    return advertiserName ? `${advertiserName} product` : 'Partner product';
  }
  return cleaned.length > 80 ? cleaned.slice(0, 80) + '…' : cleaned;
}

export function AffiliateProductCard({
  product,
  locale,
  showPartnerBadge = false,
}: AffiliateProductCardProps) {
  const rawTitle = product.translations?.[0]?.title ?? product.slug;
  const title = cleanTitle(rawTitle, product.advertiser?.name);
  const currency = product.displayCurrency || 'USD';
  const hasPrice = product.displayPrice != null && product.displayPrice > 0;
  const hasDiscount =
    hasPrice && product.originalPrice != null && product.originalPrice > product.displayPrice!;
  const discountPct = hasDiscount
    ? Math.round((1 - product.displayPrice! / product.originalPrice!) * 100)
    : 0;
  const isOutOfStock = product.inStock === false;
  const redirectHref = `/api/affiliate/redirect/${product.id}?locale=${locale}`;

  return (
    <div className="group relative bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-40' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <span className="text-neutral-300 text-xs">No image</span>
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full tracking-wide">
              Out of stock
            </span>
          </div>
        )}

        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-amber-900" />
            Featured
          </div>
        )}

        {/* Discount badge */}
        {discountPct > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discountPct}%
          </div>
        )}

        {/* Partner badge — only when no discount (avoids overlap) */}
        {showPartnerBadge && discountPct === 0 && (
          <div className="absolute top-2 right-2 bg-white/90 text-neutral-500 text-xs font-medium px-2 py-0.5 rounded-full border border-neutral-200 backdrop-blur-sm">
            Partner
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

        {/* Title — before:inset-0 makes the whole card navigate to detail page */}
        <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug">
          <Link
            href={`/affiliate/${product.slug}`}
            className="before:absolute before:inset-0 hover:text-neutral-600 transition-colors"
          >
            {title}
          </Link>
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

        {/* Shop Now — relative z-10 so it sits above the card link */}
        <a
          href={redirectHref}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 mt-2 block w-full text-center py-2 px-4 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors duration-150"
        >
          Shop Now
        </a>
      </div>
    </div>
  );
}

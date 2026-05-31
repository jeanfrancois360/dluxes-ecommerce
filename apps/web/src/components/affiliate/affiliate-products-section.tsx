'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AffiliateProductCard } from './affiliate-product-card';
import type { AffiliateProduct } from '@/lib/api/affiliate';

/**
 * Shared affiliate products section — reused by blog strip, home page, products page.
 * Renders: heading + Awin disclosure + 3-col card grid.
 * Empty-safe: returns null when products is empty.
 * showPartnerBadge defaults true here because this component is always used OUTSIDE
 * the dedicated /affiliate page (where cards are already in context).
 */

interface AffiliateProductsSectionProps {
  products: AffiliateProduct[];
  /** Section heading. Defaults to i18n key affiliate.fromOurPartners. */
  title?: string;
  /** Show the Awin disclosure line. Default true (required by Awin + EU law). */
  showDisclosure?: boolean;
  locale: string;
}

export function AffiliateProductsSection({
  products,
  title,
  showDisclosure = true,
  locale,
}: AffiliateProductsSectionProps) {
  const ta = useTranslations('affiliate');
  const tb = useTranslations('blog');

  if (products.length === 0) return null;

  const heading = title ?? ta('fromOurPartners');

  return (
    <section className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-1 h-5 bg-[#CBB57B] rounded-full shrink-0" />
          <h2 className="text-base font-semibold text-neutral-900">{heading}</h2>
          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs font-medium rounded-full">
            {products.length}
          </span>
        </div>
        {showDisclosure && (
          <p className="mt-1 ml-4 text-xs text-neutral-400">{tb('featuredProductsDisclosure')}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <AffiliateProductCard
            key={product.id}
            product={product}
            locale={locale}
            showPartnerBadge
          />
        ))}
      </div>
    </section>
  );
}

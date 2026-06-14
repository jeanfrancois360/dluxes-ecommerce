'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { ChevronRight, Star, ExternalLink, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { useAffiliateProduct } from '@/hooks/use-affiliate';
import { useLocale } from '@/contexts/locale-context';

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

function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-4 bg-neutral-200 rounded w-48 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square bg-neutral-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-3/4" />
          <div className="h-4 bg-neutral-200 rounded w-1/4" />
          <div className="h-8 bg-neutral-200 rounded w-1/3" />
          <div className="space-y-2 mt-6">
            <div className="h-4 bg-neutral-200 rounded" />
            <div className="h-4 bg-neutral-200 rounded" />
            <div className="h-4 bg-neutral-200 rounded w-5/6" />
          </div>
          <div className="h-12 bg-neutral-200 rounded-xl mt-8" />
        </div>
      </div>
    </div>
  );
}

export default function AffiliateDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language: locale } = useLocale();
  const { product, loading, error } = useAffiliateProduct(slug, locale);
  const [activeImage, setActiveImage] = useState(0);

  if (loading)
    return (
      <PageLayout>
        <DetailSkeleton />
      </PageLayout>
    );

  if (!loading && (error || !product)) notFound();

  // Type narrowing — product is non-null past this point
  const p = product!;
  const translation = p.translations?.[0];
  const rawTitle = translation?.title ?? p.slug;
  // Clean raw SKU-style titles (e.g. from Voghion: "177943450027lgoods_test_goods_color649492")
  const title = (() => {
    if (!rawTitle || rawTitle.includes(' ')) return rawTitle;
    const cleaned = rawTitle.replace(/[_-]+/g, ' ').trim();
    const nonAlpha = (rawTitle.match(/[^a-zA-Z]/g) ?? []).length;
    if (nonAlpha / rawTitle.length > 0.35) {
      const wordCount = cleaned.split(' ').length;
      if (wordCount <= 2 && /\d{6,}/.test(cleaned))
        return p.advertiser ? `${p.advertiser.name} product` : 'Partner product';
      return cleaned.length > 100 ? cleaned.slice(0, 100) + '…' : cleaned;
    }
    return rawTitle;
  })();
  const description = translation?.description ?? '';
  const currency = p.displayCurrency || 'USD';
  const hasPrice = p.displayPrice != null && p.displayPrice > 0;
  const hasDiscount = hasPrice && p.originalPrice != null && p.originalPrice > p.displayPrice!;
  const discountPct = hasDiscount ? Math.round((1 - p.displayPrice! / p.originalPrice!) * 100) : 0;
  const isOutOfStock = p.inStock === false;

  const allImages = [
    ...(p.imageUrl ? [p.imageUrl] : []),
    ...p.galleryUrls.filter((u) => u !== p.imageUrl),
  ];

  const redirectHref = `/api/affiliate/redirect/${p.id}?locale=${locale}`;

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-neutral-500">
          <Link href="/affiliate" className="hover:text-neutral-800 transition-colors">
            Partner Deals
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-neutral-800 truncate max-w-xs">{title}</span>
        </nav>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image column */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-50 border border-neutral-100">
              {allImages.length > 0 ? (
                <img
                  src={allImages[activeImage]}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-neutral-300 text-sm">No image</span>
                </div>
              )}

              {p.isFeatured && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Star className="w-3 h-3 fill-amber-900" />
                  Featured
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImage
                        ? 'border-neutral-900'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-5">
            {/* Advertiser */}
            {p.advertiser && (
              <div className="flex items-center gap-2">
                {p.advertiser.logoUrl && (
                  <img
                    src={p.advertiser.logoUrl}
                    alt={p.advertiser.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-neutral-500">{p.advertiser.name}</span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl font-bold text-neutral-900 leading-snug">{title}</h1>

            {/* Stock + discount badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  <XCircle className="w-3.5 h-3.5" />
                  Out of stock
                </span>
              ) : p.inStock === true ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  In stock
                </span>
              ) : null}
              {discountPct > 0 && (
                <span className="inline-flex items-center text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full">
                  -{discountPct}% off
                </span>
              )}
            </div>

            {/* Price */}
            {hasPrice && (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-neutral-900">
                  {formatPrice(p.displayPrice!, currency, locale)}
                </span>
                {hasDiscount && (
                  <span className="text-base text-neutral-400 line-through">
                    {formatPrice(p.originalPrice!, currency, locale)}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
            )}

            {/* Tags */}
            {p.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            {isOutOfStock ? (
              <button
                disabled
                className="mt-auto flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-neutral-200 text-neutral-400 text-sm font-semibold cursor-not-allowed"
              >
                Out of stock
              </button>
            ) : (
              <a
                href={redirectHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors duration-150"
              >
                Buy Now — Shop at {p.advertiser?.name ?? 'Partner'}
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            )}

            {/* Affiliate disclosure */}
            <p className="text-xs text-neutral-400 text-center">
              You'll be redirected to our partner's website to complete your purchase.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AutocompleteResult } from '@/lib/api/search';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

interface SearchAutocompleteItemProps {
  product: AutocompleteResult;
  searchQuery: string;
  isSelected?: boolean;
  onClick?: () => void;
}

/** Filled star row — shows up to 5 stars, half-star precision */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <svg key={i} className="w-2.5 h-2.5" viewBox="0 0 20 20">
            {half ? (
              <>
                <defs>
                  <linearGradient id={`half-${i}`}>
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#D1D5DB" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#half-${i})`}
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </>
            ) : (
              <path
                fill={filled ? '#F59E0B' : '#D1D5DB'}
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            )}
          </svg>
        );
      })}
      <span className="ml-0.5 text-[10px] text-amber-600 font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}

/**
 * Renders a single autocomplete result row.
 *
 * Highlighting strategy (preferred → fallback):
 *   1. Server-side: Meilisearch returns `_formatted.name` with <mark> tags.
 *   2. Client-side regex split when `_formatted` is absent.
 */
export function SearchAutocompleteItem({
  product,
  searchQuery,
  isSelected = false,
  onClick,
}: SearchAutocompleteItemProps) {
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="bg-[#CBB57B]/20 text-[#CBB57B] font-semibold not-italic rounded-sm"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const formattedName = product._formatted?.name;
  const formattedSnippet = product._formatted?.shortDescription;
  const isSale = discount > 0 || product.badges?.includes('Sale');
  const isBestseller = product.badges?.includes('Bestseller');

  return (
    <Link href={`/products/${product.slug}`} onClick={onClick}>
      <div
        className={`relative flex items-center gap-3 px-4 py-2.5 transition-all duration-150 group cursor-pointer border-l-2 ${
          isSelected
            ? 'bg-[#CBB57B]/5 border-[#CBB57B]'
            : 'border-transparent hover:bg-gray-50 hover:border-[#CBB57B]/40'
        }`}
      >
        {/* Product Image */}
        <div className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 group-hover:border-[#CBB57B]/30 transition-colors">
          <Image
            src={product.heroImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="56px"
          />
          {isSale && (
            <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold text-white bg-red-500 py-0.5 leading-none">
              SALE
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h4 className="text-sm font-medium text-gray-900 truncate leading-snug group-hover:text-[#CBB57B] transition-colors">
            {formattedName ? (
              <span
                dangerouslySetInnerHTML={{ __html: formattedName }}
                className="[&_mark]:bg-[#CBB57B]/20 [&_mark]:text-[#CBB57B] [&_mark]:font-semibold [&_mark]:not-italic [&_mark]:rounded-sm"
              />
            ) : (
              highlightText(product.name, searchQuery)
            )}
          </h4>

          {/* Snippet */}
          {formattedSnippet && (
            <p
              className="text-[11px] text-gray-400 mt-0.5 truncate [&_mark]:bg-[#CBB57B]/15 [&_mark]:text-[#CBB57B] [&_mark]:font-medium [&_mark]:not-italic"
              dangerouslySetInnerHTML={{ __html: formattedSnippet }}
            />
          )}

          {/* Meta row — category pill + store + rating */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {product.category && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] font-medium text-gray-600 group-hover:bg-[#CBB57B]/10 group-hover:text-[#CBB57B] transition-colors">
                {product.category.name}
              </span>
            )}
            {isBestseller && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-[10px] font-medium text-amber-600">
                Bestseller
              </span>
            )}
            {product.storeName && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400 truncate">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {product.storeName}
              </span>
            )}
            {product.rating !== undefined && product.rating > 0 && (
              <StarRating rating={product.rating} />
            )}
          </div>
        </div>

        {/* Price column */}
        <div className="flex-shrink-0 text-right min-w-[60px]">
          <div className="text-sm font-bold text-[#CBB57B]">
            ${formatCurrencyAmount(product.price || 0, 2)}
          </div>
          {product.compareAtPrice && discount > 0 && (
            <>
              <div className="text-[10px] text-gray-400 line-through leading-none">
                ${formatCurrencyAmount(product.compareAtPrice, 2)}
              </div>
              <div className="mt-0.5 inline-block text-[10px] font-semibold text-white bg-red-500 px-1 py-0.5 rounded leading-none">
                -{discount}%
              </div>
            </>
          )}
        </div>

        {/* Arrow indicator */}
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 transition-all ${
            isSelected
              ? 'text-[#CBB57B] translate-x-0.5'
              : 'text-gray-300 group-hover:text-[#CBB57B] group-hover:translate-x-0.5'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

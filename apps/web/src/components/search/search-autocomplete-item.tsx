'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { AutocompleteResult } from '@/lib/api/search';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

interface SearchAutocompleteItemProps {
  product: AutocompleteResult;
  searchQuery: string;
  onClick?: () => void;
}

/**
 * Renders a single autocomplete result row.
 *
 * Highlighting strategy (preferred → fallback):
 *   1. Server-side: Meilisearch returns `_formatted.name` with <mark> tags
 *      already injected. We render it with dangerouslySetInnerHTML.
 *      Content is from our own DB; only `<mark>` tags are added by Meilisearch.
 *   2. Client-side: if `_formatted` is not present, split the name by regex.
 */
export function SearchAutocompleteItem({
  product,
  searchQuery,
  onClick,
}: SearchAutocompleteItemProps) {
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Client-side highlight fallback (used when _formatted is unavailable)
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-[#CBB57B]/20 text-[#CBB57B] font-semibold not-italic">
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

  return (
    <Link href={`/products/${product.slug}`} onClick={onClick}>
      <motion.div
        whileHover={{ x: 4 }}
        className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group cursor-pointer"
      >
        {/* Product Image */}
        <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={product.heroImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="48px"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-[#CBB57B] transition-colors">
            {formattedName ? (
              // Server-side highlighted name from Meilisearch _formatted
              <span
                dangerouslySetInnerHTML={{ __html: formattedName }}
                className="[&_mark]:bg-[#CBB57B]/20 [&_mark]:text-[#CBB57B] [&_mark]:font-semibold [&_mark]:not-italic"
              />
            ) : (
              // Client-side fallback
              highlightText(product.name, searchQuery)
            )}
          </h4>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {product.category && (
              <span className="text-xs text-gray-500 truncate">{product.category.name}</span>
            )}
            {product.storeName && (
              <>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-500 truncate">{product.storeName}</span>
              </>
            )}
            {product.rating && product.rating >= 4 && (
              <>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-amber-500">★ {product.rating.toFixed(1)}</span>
              </>
            )}
            {product.badges?.includes('Sale') && (
              <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                Sale
              </span>
            )}
          </div>

          {/* Cropped description snippet (from Meilisearch _formatted) */}
          {formattedSnippet && (
            <p
              className="text-xs text-gray-400 mt-0.5 truncate [&_mark]:bg-[#CBB57B]/15 [&_mark]:text-[#CBB57B] [&_mark]:font-medium [&_mark]:not-italic"
              dangerouslySetInnerHTML={{ __html: formattedSnippet }}
            />
          )}
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#CBB57B]">
              ${formatCurrencyAmount(product.price || 0, 2)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-gray-400 line-through">
                ${formatCurrencyAmount(product.compareAtPrice, 2)}
              </span>
            )}
          </div>
          {discount > 0 && (
            <span className="inline-block mt-0.5 text-xs font-medium text-red-500">
              -{discount}%
            </span>
          )}
        </div>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-[#CBB57B] group-hover:translate-x-0.5 transition-all flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.div>
    </Link>
  );
}

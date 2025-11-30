'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { AutocompleteResult } from '@/lib/api/search';

interface SearchAutocompleteItemProps {
  product: AutocompleteResult;
  searchQuery: string;
  onClick?: () => void;
}

export function SearchAutocompleteItem({
  product,
  searchQuery,
  onClick,
}: SearchAutocompleteItemProps) {
  // Helper to highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-[#CBB57B]/20 text-[#CBB57B] font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

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
            {highlightText(product.name, searchQuery)}
          </h4>

          <div className="flex items-center gap-2 mt-0.5">
            {product.category && (
              <span className="text-xs text-gray-500 truncate">
                {product.category.name}
              </span>
            )}
            {product.brand && (
              <>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-500 truncate">{product.brand}</span>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#CBB57B]">
              ${(product.price || 0).toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-gray-400 line-through">
                ${(product.compareAtPrice || 0).toFixed(2)}
              </span>
            )}
          </div>
          {discount > 0 && (
            <span className="inline-block mt-0.5 text-xs font-medium text-red-500">
              -{discount}%
            </span>
          )}
        </div>

        {/* Arrow Icon */}
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

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  brands: string[];
  ratings: number[];
  availability: 'all' | 'in-stock' | 'out-of-stock';
}

export interface FiltersSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearAll: () => void;
}

const categories = [
  { id: 'fashion', label: 'Fashion', count: 245 },
  { id: 'electronics', label: 'Electronics', count: 189 },
  { id: 'home-decor', label: 'Home & Décor', count: 312 },
  { id: 'beauty', label: 'Beauty', count: 156 },
  { id: 'sports', label: 'Sports & Outdoors', count: 98 },
  { id: 'books', label: 'Books & Media', count: 432 },
  { id: 'toys', label: 'Toys & Games', count: 87 },
];

const brands = [
  { id: 'luxury', label: 'LUXURY', count: 45 },
  { id: 'artisan', label: 'ARTISAN', count: 38 },
  { id: 'elegance', label: 'ELEGANCE', count: 52 },
  { id: 'illuminate', label: 'Illuminate', count: 29 },
  { id: 'sleep-elegance', label: 'Sleep Elegance', count: 41 },
];

const ratings = [5, 4, 3, 2, 1];

export function FiltersSidebar({ filters, onFiltersChange, onClearAll }: FiltersSidebarProps) {
  const t = useTranslations('components.filtersSidebar');
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'categories',
    'price',
    'brands',
    'ratings',
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleCategoryChange = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleBrandChange = (brandId: string) => {
    const newBrands = filters.brands.includes(brandId)
      ? filters.brands.filter((b) => b !== brandId)
      : [...filters.brands, brandId];
    onFiltersChange({ ...filters, brands: newBrands });
  };

  const handleRatingChange = (rating: number) => {
    const newRatings = filters.ratings.includes(rating)
      ? filters.ratings.filter((r) => r !== rating)
      : [...filters.ratings, rating];
    onFiltersChange({ ...filters, ratings: newRatings });
  };

  const handlePriceChange = (value: number) => {
    onFiltersChange({ ...filters, priceRange: [filters.priceRange[0], value] });
  };

  const FilterSection = ({
    title,
    id,
    children,
  }: {
    title: string;
    id: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.includes(id);
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between py-4 text-left hover:text-[#CBB57B] transition-colors"
        >
          <h3 className="text-base font-semibold text-black">{title}</h3>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pb-4">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-32 bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-black">{t('filters')}</h2>
          <button
            onClick={onClearAll}
            className="text-sm text-[#CBB57B] hover:text-black transition-colors font-medium"
          >
            {t('clearAll')}
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-0">
          {/* Categories */}
          <FilterSection title={t('categories')} id="categories">
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center justify-between cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                      className="w-4 h-4 text-[#CBB57B] border-gray-300 rounded focus:ring-[#CBB57B]/20 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                      {category.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">({category.count})</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection title={t('priceRange')} id="price">
            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="5000"
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#CBB57B]"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">${filters.priceRange[0]}</span>
                <span className="text-black font-semibold">${filters.priceRange[1]}</span>
              </div>
            </div>
          </FilterSection>

          {/* Brands */}
          <FilterSection title={t('brands')} id="brands">
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {brands.map((brand) => (
                <label
                  key={brand.id}
                  className="flex items-center justify-between cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand.id)}
                      onChange={() => handleBrandChange(brand.id)}
                      className="w-4 h-4 text-[#CBB57B] border-gray-300 rounded focus:ring-[#CBB57B]/20 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                      {brand.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">({brand.count})</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Ratings */}
          <FilterSection title={t('ratings')} id="ratings">
            <div className="space-y-2.5">
              {ratings.map((rating) => (
                <label
                  key={rating}
                  className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.ratings.includes(rating)}
                    onChange={() => handleRatingChange(rating)}
                    className="w-4 h-4 text-[#CBB57B] border-gray-300 rounded focus:ring-[#CBB57B]/20 focus:ring-2"
                  />
                  <div className="flex items-center gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < rating ? 'fill-[#CBB57B] text-[#CBB57B]' : 'fill-gray-200 text-gray-200'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-sm text-gray-700 ml-1 group-hover:text-black transition-colors">
                      {t('andUp')}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Availability */}
          <FilterSection title={t('availability')} id="availability">
            <div className="space-y-2.5">
              {['all', 'in-stock', 'out-of-stock'].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="radio"
                    name="availability"
                    checked={filters.availability === option}
                    onChange={() => onFiltersChange({ ...filters, availability: option as any })}
                    className="w-4 h-4 text-[#CBB57B] border-gray-300 focus:ring-[#CBB57B]/20 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors capitalize">
                    {t(option.replace('-', '') as any)}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>
        </div>
      </div>
    </aside>
  );
}

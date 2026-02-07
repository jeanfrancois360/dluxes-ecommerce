'use client';

import { useState, useMemo } from 'react';
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
  { id: 'fashion', label: 'Fashion', count: 245, icon: '👗' },
  { id: 'electronics', label: 'Electronics', count: 189, icon: '📱' },
  { id: 'home-decor', label: 'Home & Décor', count: 312, icon: '🏠' },
  { id: 'beauty', label: 'Beauty', count: 156, icon: '💄' },
  { id: 'sports', label: 'Sports & Outdoors', count: 98, icon: '⚽' },
  { id: 'books', label: 'Books & Media', count: 432, icon: '📚' },
  { id: 'toys', label: 'Toys & Games', count: 87, icon: '🎮' },
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
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

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

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newRange: [number, number] =
      type === 'min' ? [value, filters.priceRange[1]] : [filters.priceRange[0], value];
    onFiltersChange({ ...filters, priceRange: newRange });
  };

  // Filtered lists based on search
  const filteredCategories = useMemo(
    () =>
      categories.filter((cat) => cat.label.toLowerCase().includes(categorySearch.toLowerCase())),
    [categorySearch]
  );

  const filteredBrands = useMemo(
    () => brands.filter((brand) => brand.label.toLowerCase().includes(brandSearch.toLowerCase())),
    [brandSearch]
  );

  // Count active filters
  const activeFiltersCount =
    filters.categories.length +
    filters.brands.length +
    filters.ratings.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0) +
    (filters.availability !== 'all' ? 1 : 0);

  const FilterSection = ({
    title,
    id,
    children,
    count = 0,
  }: {
    title: string;
    id: string;
    children: React.ReactNode;
    count?: number;
  }) => {
    const isExpanded = expandedSections.includes(id);
    return (
      <div className="border-b border-neutral-200 last:border-b-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between py-4 px-1 text-left hover:text-gold transition-colors group"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-black group-hover:text-gold transition-colors">
              {title}
            </h3>
            {count > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gold/20 text-gold text-xs font-bold rounded-full">
                {count}
              </span>
            )}
          </div>
          <motion.svg
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 text-neutral-400 group-hover:text-gold"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
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
              <div className="pb-5">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="sticky top-32 bg-white rounded-2xl border-2 border-neutral-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-gold/10 to-accent-700/10 border-b-2 border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6 text-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <h2 className="text-xl font-serif font-bold text-black">{t('filters')}</h2>
            </div>
            {activeFiltersCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {t('clearAll')}
              </motion.button>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <p className="text-xs text-neutral-600">
              {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="p-5 space-y-0 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
          {/* Categories */}
          <FilterSection title={t('categories')} id="categories" count={filters.categories.length}>
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-9 pr-3 py-2 text-sm border-2 border-neutral-200 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                />
                <svg
                  className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Categories List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                {filteredCategories.map((category) => (
                  <motion.label
                    key={category.id}
                    whileHover={{ x: 2 }}
                    className={`flex items-center justify-between cursor-pointer group p-2.5 rounded-xl transition-all ${
                      filters.categories.includes(category.id)
                        ? 'bg-gold/10 border-2 border-gold/30'
                        : 'hover:bg-neutral-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category.id)}
                          onChange={() => handleCategoryChange(category.id)}
                          className="w-5 h-5 text-gold border-2 border-neutral-300 rounded-md focus:ring-2 focus:ring-gold/20 cursor-pointer transition-all"
                        />
                      </div>
                      <span className="text-xl">{category.icon}</span>
                      <span
                        className={`text-sm font-medium truncate transition-colors ${
                          filters.categories.includes(category.id)
                            ? 'text-black'
                            : 'text-neutral-700 group-hover:text-black'
                        }`}
                      >
                        {category.label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {category.count}
                    </span>
                  </motion.label>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection
            title={t('priceRange')}
            id="price"
            count={filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0}
          >
            <div className="space-y-4">
              {/* Min/Max Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Min</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-neutral-500">$</span>
                    <input
                      type="number"
                      value={filters.priceRange[0]}
                      onChange={(e) => handlePriceChange('min', parseInt(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 text-sm font-semibold border-2 border-neutral-200 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">Max</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-neutral-500">$</span>
                    <input
                      type="number"
                      value={filters.priceRange[1]}
                      onChange={(e) => handlePriceChange('max', parseInt(e.target.value) || 5000)}
                      className="w-full pl-7 pr-3 py-2 text-sm font-semibold border-2 border-neutral-200 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Range Sliders */}
              <div className="relative pt-2">
                <div className="relative h-2 bg-neutral-200 rounded-full">
                  <div
                    className="absolute h-2 bg-gradient-to-r from-gold to-accent-700 rounded-full"
                    style={{
                      left: `${(filters.priceRange[0] / 5000) * 100}%`,
                      right: `${100 - (filters.priceRange[1] / 5000) * 100}%`,
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange('min', parseInt(e.target.value))}
                  className="absolute top-0 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-gold [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
                <input
                  type="range"
                  min="0"
                  max="5000"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange('max', parseInt(e.target.value))}
                  className="absolute top-0 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-gold [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Under $50', range: [0, 50] },
                  { label: '$50-$200', range: [50, 200] },
                  { label: '$200-$1000', range: [200, 1000] },
                  { label: 'Over $1000', range: [1000, 5000] },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() =>
                      onFiltersChange({ ...filters, priceRange: preset.range as [number, number] })
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-lg hover:bg-gold/20 hover:text-gold transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* Brands */}
          <FilterSection title={t('brands')} id="brands" count={filters.brands.length}>
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="Search brands..."
                  className="w-full pl-9 pr-3 py-2 text-sm border-2 border-neutral-200 rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                />
                <svg
                  className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Brands List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                {filteredBrands.map((brand) => (
                  <motion.label
                    key={brand.id}
                    whileHover={{ x: 2 }}
                    className={`flex items-center justify-between cursor-pointer group p-2.5 rounded-xl transition-all ${
                      filters.brands.includes(brand.id)
                        ? 'bg-gold/10 border-2 border-gold/30'
                        : 'hover:bg-neutral-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={filters.brands.includes(brand.id)}
                        onChange={() => handleBrandChange(brand.id)}
                        className="w-5 h-5 text-gold border-2 border-neutral-300 rounded-md focus:ring-2 focus:ring-gold/20 cursor-pointer"
                      />
                      <span
                        className={`text-sm font-bold truncate transition-colors ${
                          filters.brands.includes(brand.id)
                            ? 'text-black'
                            : 'text-neutral-700 group-hover:text-black'
                        }`}
                      >
                        {brand.label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {brand.count}
                    </span>
                  </motion.label>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* Ratings */}
          <FilterSection title={t('ratings')} id="ratings" count={filters.ratings.length}>
            <div className="space-y-2">
              {ratings.map((rating) => (
                <motion.label
                  key={rating}
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 cursor-pointer group p-2.5 rounded-xl transition-all ${
                    filters.ratings.includes(rating)
                      ? 'bg-gold/10 border-2 border-gold/30'
                      : 'hover:bg-neutral-50 border-2 border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filters.ratings.includes(rating)}
                    onChange={() => handleRatingChange(rating)}
                    className="w-5 h-5 text-gold border-2 border-neutral-300 rounded-md focus:ring-2 focus:ring-gold/20 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 flex-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < rating ? 'fill-gold text-gold' : 'fill-neutral-200 text-neutral-200'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-sm font-medium text-neutral-700 ml-1 group-hover:text-black">
                      {t('andUp')}
                    </span>
                  </div>
                </motion.label>
              ))}
            </div>
          </FilterSection>

          {/* Availability */}
          <FilterSection
            title={t('availability')}
            id="availability"
            count={filters.availability !== 'all' ? 1 : 0}
          >
            <div className="space-y-2">
              {[
                { value: 'all', label: t('all'), icon: '🛍️' },
                { value: 'in-stock', label: t('instock'), icon: '✅' },
                { value: 'out-of-stock', label: t('outofstock'), icon: '❌' },
              ].map((option) => (
                <motion.label
                  key={option.value}
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 cursor-pointer group p-2.5 rounded-xl transition-all ${
                    filters.availability === option.value
                      ? 'bg-gold/10 border-2 border-gold/30'
                      : 'hover:bg-neutral-50 border-2 border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="availability"
                    checked={filters.availability === option.value}
                    onChange={() =>
                      onFiltersChange({ ...filters, availability: option.value as any })
                    }
                    className="w-5 h-5 text-gold border-2 border-neutral-300 focus:ring-2 focus:ring-gold/20 cursor-pointer"
                  />
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-black">
                    {option.label}
                  </span>
                </motion.label>
              ))}
            </div>
          </FilterSection>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbb57b;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b8a468;
        }
      `}</style>
    </aside>
  );
}

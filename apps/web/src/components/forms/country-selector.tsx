'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { countries, popularCountries, type Country } from '@/lib/data/countries';
import { useTranslations } from 'next-intl';

interface CountrySelectorProps {
  value: string;
  onChange: (countryName: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function CountrySelector({
  value,
  onChange,
  error,
  placeholder,
  className = '',
}: CountrySelectorProps) {
  const t = useTranslations('components.countrySelector');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const defaultPlaceholder = placeholder || t('selectCountry');

  // Get selected country
  const selectedCountry = countries.find(c => c.name === value);

  // Filter countries based on search
  const filteredCountries = searchQuery.trim()
    ? countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : countries;

  // Separate popular countries
  const popularFiltered = popularCountries
    .map(name => countries.find(c => c.name === name))
    .filter((c): c is Country => c !== undefined && filteredCountries.includes(c));

  const otherFiltered = filteredCountries.filter(
    c => !popularCountries.includes(c.name)
  );

  // Total items for keyboard navigation
  const allItems = searchQuery.trim() ? filteredCountries : [...popularFiltered, ...otherFiltered];

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allItems[highlightedIndex]) {
          onChange(allItems[highlightedIndex].name);
          setIsOpen(false);
          setSearchQuery('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  return (
    <div ref={containerRef} className="relative">
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-left flex items-center justify-between transition-colors ${
          error
            ? 'border-red-500 focus:border-red-500'
            : isOpen
            ? 'border-gold'
            : 'border-neutral-200 focus:border-gold'
        } ${className}`}
      >
        <span className="flex items-center gap-3">
          {selectedCountry ? (
            <>
              <span className="text-2xl">{selectedCountry.flag}</span>
              <span className="text-neutral-900">{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-neutral-400">{defaultPlaceholder}</span>
          )}
        </span>
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-gold rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-neutral-200 bg-neutral-50">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
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
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-gold text-sm"
                />
              </div>
            </div>

            {/* Countries List */}
            <div ref={listRef} className="max-h-64 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="px-4 py-8 text-center text-neutral-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium">{t('noCountriesFound')}</p>
                  <p className="text-xs mt-1">{t('tryDifferentSearch')}</p>
                </div>
              ) : (
                <>
                  {/* Popular Countries Section */}
                  {!searchQuery.trim() && popularFiltered.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-neutral-100 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        {t('popularCountries')}
                      </div>
                      {popularFiltered.map((country, index) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            onChange(country.name);
                            setIsOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gold/10 transition-colors ${
                            highlightedIndex === index ? 'bg-gold/20' : ''
                          } ${value === country.name ? 'bg-gold/30 font-semibold' : ''}`}
                        >
                          <span className="text-2xl">{country.flag}</span>
                          <span className="flex-1">{country.name}</span>
                          {value === country.name && (
                            <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* All Countries Section */}
                  {!searchQuery.trim() && otherFiltered.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-neutral-100 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        {t('allCountries')}
                      </div>
                      {otherFiltered.map((country, index) => {
                        const actualIndex = popularFiltered.length + index;
                        return (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              onChange(country.name);
                              setIsOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gold/10 transition-colors ${
                              highlightedIndex === actualIndex ? 'bg-gold/20' : ''
                            } ${value === country.name ? 'bg-gold/30 font-semibold' : ''}`}
                          >
                            <span className="text-2xl">{country.flag}</span>
                            <span className="flex-1">{country.name}</span>
                            {value === country.name && (
                              <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Search Results */}
                  {searchQuery.trim() && (
                    <div>
                      <div className="px-4 py-2 bg-neutral-100 text-xs font-semibold text-neutral-600">
                        {filteredCountries.length === 1 ? t('result', { count: filteredCountries.length }) : t('results', { count: filteredCountries.length })}
                      </div>
                      {filteredCountries.map((country, index) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            onChange(country.name);
                            setIsOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gold/10 transition-colors ${
                            highlightedIndex === index ? 'bg-gold/20' : ''
                          } ${value === country.name ? 'bg-gold/30 font-semibold' : ''}`}
                        >
                          <span className="text-2xl">{country.flag}</span>
                          <span className="flex-1">{country.name}</span>
                          {value === country.name && (
                            <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

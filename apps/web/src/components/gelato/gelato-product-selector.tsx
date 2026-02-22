'use client';

import { useState, useEffect, useRef } from 'react';
import { useGelatoCatalog } from '@/hooks/use-gelato';

interface GelatoProductSelectorProps {
  value: string;
  onChange: (uid: string, productName?: string) => void;
  disabled?: boolean;
}

export function GelatoProductSelector({ value, onChange, disabled }: GelatoProductSelectorProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    products,
    total,
    isLoading: loading,
    error,
  } = useGelatoCatalog({ search: debouncedSearch, limit: 20 });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(uid: string, name: string) {
    onChange(uid, name);
    setSelectedName(name);
    setIsOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-[#CBB57B]'
        } ${value ? 'border-[#CBB57B]' : 'border-gray-300'}`}
        onClick={() => !disabled && setIsOpen((o) => !o)}
      >
        <span className="flex-1 text-sm text-gray-700 truncate">
          {selectedName || value || (
            <span className="text-gray-400">Search Gelato product catalog...</span>
          )}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('', '');
              setSelectedName('');
            }}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or product ID..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#CBB57B]"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {error ? (
              <div className="p-4">
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="text-xs">
                    <p className="font-medium text-amber-800 mb-1">Gelato Not Configured</p>
                    <p className="text-amber-600">
                      Configure your Gelato Store ID in the backend .env file to use
                      Print-on-Demand.
                    </p>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : products.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {debouncedSearch ? 'No products found' : 'Type to search Gelato catalog'}
              </div>
            ) : (
              <>
                {products.map((product: any) => (
                  <button
                    key={product.uid}
                    type="button"
                    onClick={() => handleSelect(product.uid, product.title || product.uid)}
                    className={`w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-gray-50 last:border-0 ${
                      value === product.uid ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {product.previewUrl && (
                        <img
                          src={product.previewUrl}
                          alt={product.title}
                          className="w-10 h-10 object-cover rounded border border-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {product.title || product.uid}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{product.uid}</p>
                      </div>
                      {value === product.uid && (
                        <svg
                          className="w-4 h-4 text-[#CBB57B] shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
                {total > 20 && (
                  <p className="px-4 py-2 text-xs text-gray-400 text-center bg-gray-50">
                    Showing 20 of {total} — refine your search
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

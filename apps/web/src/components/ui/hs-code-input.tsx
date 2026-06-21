'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// Valid HS code formats: 4-digit chapter, 6-digit subheading, or 8/10-digit national
const HS_REGEX = /^\d{4}(\.\d{2}(\.\d{2,4})?)?$/;

interface HsResult {
  code: string;
  description: string;
}

interface HsCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

export function HsCodeInput({ value, onChange, id, className = '' }: HsCodeInputProps) {
  const [touched, setTouched] = useState(false);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<HsResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isValid = !value || HS_REGEX.test(value);
  const showError = touched && value && !isValid;

  // Sync query when value changes from outside (e.g. form reset)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hs-code/search?q=${encodeURIComponent(q)}`);
        const data: HsResult[] = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
        setHighlighted(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    search(v);
  };

  const handleSelect = (item: HsResult) => {
    setQuery(item.code);
    onChange(item.code);
    setIsOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlighted]) handleSelect(results[highlighted]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={query}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 6109.10 or search 't-shirt'"
          maxLength={20}
          autoComplete="off"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent font-mono text-sm pr-8 ${
            showError ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </span>
        )}
        {!loading && value && isValid && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {results.map((item, idx) => (
            <li
              key={item.code}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setHighlighted(idx)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer ${
                idx === highlighted
                  ? 'bg-[#CBB57B]/10 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-mono text-xs text-gray-500 w-16 shrink-0">{item.code}</span>
              <span className="truncate">{item.description}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-1 flex items-center justify-between">
        <p className={`text-xs ${showError ? 'text-red-500' : 'text-gray-400'}`}>
          {showError
            ? 'Invalid format — use e.g. 6109.10 or 6109.10.90'
            : 'Type a code or description to search the HTS database'}
        </p>
        <a
          href="https://hts.usitc.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#CBB57B] hover:underline whitespace-nowrap ml-4"
        >
          Full HTS lookup →
        </a>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import {
  cn,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@nextpik/ui';
import {
  getCountryConfig,
  getPopularCountries,
  getAllCountries,
  type CountryAddressConfig,
} from '@/lib/data/address-countries';

interface CountrySelectorProps {
  value: string;
  onChange: (countryCode: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Simple Country Selector - No cmdk, just plain buttons
 */
export function CountrySelector({
  value,
  onChange,
  error,
  disabled = false,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const selectedCountry = getCountryConfig(value);
  const popularCountries = getPopularCountries();
  const allCountries = getAllCountries();

  // Filter countries not in popular list
  const otherCountries = allCountries.filter(
    country => !popularCountries.some(p => p.code === country.code)
  );

  // Filter countries based on search
  const filterCountries = (countries: CountryAddressConfig[]) => {
    if (!searchQuery) return countries;

    const query = searchQuery.toLowerCase();
    return countries.filter(
      country =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    );
  };

  const filteredPopular = filterCountries(popularCountries);
  const filteredOther = filterCountries(otherCountries);

  const handleSelect = (countryCode: string) => {
    console.log('🎯 Country selected:', countryCode);
    onChange(countryCode);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select country"
            className={cn(
              'w-full justify-between',
              error && 'border-red-500',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {value ? (
                <>
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span>{selectedCountry.name}</span>
                </>
              ) : (
                <span>Select country...</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] max-w-[90vw] p-0" align="start" sideOffset={4}>
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search countries..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Countries List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredPopular.length === 0 && filteredOther.length === 0 && (
              <div className="py-6 text-center text-sm">No country found.</div>
            )}

            {/* Popular Countries */}
            {filteredPopular.length > 0 && (
              <div className="p-1">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                  Popular Countries
                </div>
                {filteredPopular.map(country => (
                  <button
                    key={country.code}
                    onClick={() => {
                      console.log('🔴 Button clicked:', country.code);
                      handleSelect(country.code);
                    }}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                      'hover:bg-gray-100 hover:text-gray-900',
                      'focus:bg-gray-100 focus:text-gray-900',
                      'transition-colors'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === country.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="mr-2 text-lg">{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {country.phonePrefix}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Separator */}
            {filteredPopular.length > 0 && filteredOther.length > 0 && (
              <div className="h-px bg-gray-200 -mx-1" />
            )}

            {/* All Other Countries */}
            {filteredOther.length > 0 && (
              <div className="p-1">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                  All Countries
                </div>
                {filteredOther.map(country => (
                  <button
                    key={country.code}
                    onClick={() => {
                      console.log('🔴 Button clicked:', country.code);
                      handleSelect(country.code);
                    }}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                      'hover:bg-gray-100 hover:text-gray-900',
                      'focus:bg-gray-100 focus:text-gray-900',
                      'transition-colors'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === country.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="mr-2 text-lg">{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {country.phonePrefix}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

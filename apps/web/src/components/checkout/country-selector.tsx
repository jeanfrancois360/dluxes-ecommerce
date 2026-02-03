'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import {
  cn,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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
 * Country Selector Component
 *
 * Searchable dropdown with:
 * - Popular countries section
 * - All countries alphabetically
 * - Flag + name display
 * - Keyboard navigation
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
    console.log('🎯 handleSelect called with:', countryCode);
    console.log('🎯 About to call onChange');
    onChange(countryCode);
    console.log('🎯 Closing popover');
    setOpen(false);
    setSearchQuery('');
    console.log('🎯 handleSelect complete');
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
        <PopoverContent
          className="w-[400px] max-w-[90vw] p-0"
          align="start"
          sideOffset={4}
        >
          <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search countries..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <CommandList>
            {filteredPopular.length === 0 && filteredOther.length === 0 && (
              <CommandEmpty>No country found.</CommandEmpty>
            )}

            {/* Popular Countries */}
            {filteredPopular.length > 0 && (
              <CommandGroup heading="Popular Countries">
                {filteredPopular.map(country => (
                  <CommandItem
                    key={country.code}
                    value={country.name.toLowerCase()}
                    onSelect={() => {
                      console.log('🟢 onSelect triggered for:', country.code, country.name);
                      handleSelect(country.code);
                    }}
                    className="cursor-pointer"
                  >
                    <div
                      className="flex items-center w-full"
                      onClick={(e) => {
                        console.log('🔴 DIV CLICKED for country:', country.code, country.name);
                        e.stopPropagation();
                        handleSelect(country.code);
                      }}
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
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Separator */}
            {filteredPopular.length > 0 && filteredOther.length > 0 && (
              <CommandSeparator />
            )}

            {/* All Other Countries */}
            {filteredOther.length > 0 && (
              <CommandGroup heading="All Countries">
                {filteredOther.map(country => (
                  <CommandItem
                    key={country.code}
                    value={country.name.toLowerCase()}
                    onSelect={() => {
                      console.log('🟢 onSelect triggered for:', country.code, country.name);
                      handleSelect(country.code);
                    }}
                    className="cursor-pointer"
                  >
                    <div
                      className="flex items-center w-full"
                      onClick={(e) => {
                        console.log('🔴 DIV CLICKED for country:', country.code, country.name);
                        e.stopPropagation();
                        handleSelect(country.code);
                      }}
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
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

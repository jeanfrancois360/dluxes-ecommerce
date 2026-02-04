'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAddresses } from '@/hooks/use-addresses';
import { Address as APIAddress } from '@/lib/api/addresses';
import { Address as FormAddress } from './address-form';

interface SavedAddressSelectorProps {
  onSelect: (address: FormAddress | null, addressId?: string) => void;
  selectedAddressId?: string | null;
}

/**
 * Component to select from saved addresses in checkout
 * Displays user's saved addresses and allows selection to auto-fill the form
 */
export function SavedAddressSelector({ onSelect, selectedAddressId }: SavedAddressSelectorProps) {
  const { addresses, isLoading, error } = useAddresses();

  // Map API address format to form address format
  const mapApiAddressToFormAddress = (apiAddress: APIAddress): FormAddress => ({
    firstName: apiAddress.firstName,
    lastName: apiAddress.lastName,
    company: apiAddress.company || '',
    addressLine1: apiAddress.address1,
    addressLine2: apiAddress.address2 || '',
    city: apiAddress.city,
    state: apiAddress.province || '',
    postalCode: apiAddress.postalCode || '',
    country: apiAddress.country,
    phone: apiAddress.phone || '',
    saveAsDefault: apiAddress.isDefault,
  });

  const handleAddressSelect = (addressId: string) => {
    if (addressId === 'new') {
      onSelect(null);
      return;
    }

    const selectedAddress = addresses.find((addr) => addr.id === addressId);
    if (selectedAddress) {
      onSelect(mapApiAddressToFormAddress(selectedAddress), selectedAddress.id);
    }
  };

  // Don't show if loading or no addresses
  if (isLoading) {
    return (
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm text-neutral-600">Loading your saved addresses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - user can still enter address manually
  }

  if (addresses.length === 0) {
    return null; // No saved addresses - show form only
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-gradient-to-br from-gold/5 to-neutral-50 rounded-lg border-2 border-gold/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-base font-semibold text-black">Use a Saved Address</h3>
        </div>

        <div className="space-y-3">
          {/* New Address Option */}
          <label
            className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              !selectedAddressId
                ? 'border-gold bg-gold/5 shadow-sm'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="saved-address"
              value="new"
              checked={!selectedAddressId}
              onChange={() => handleAddressSelect('new')}
              className="mt-1 w-4 h-4 text-gold focus:ring-gold"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium text-black">Enter a new address</span>
              </div>
            </div>
          </label>

          {/* Saved Addresses */}
          {addresses.map((address) => (
            <motion.label
              key={address.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedAddressId === address.id
                  ? 'border-gold bg-gold/5 shadow-sm'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="saved-address"
                value={address.id}
                checked={selectedAddressId === address.id}
                onChange={() => handleAddressSelect(address.id)}
                className="mt-1 w-4 h-4 text-gold focus:ring-gold"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-black">
                    {address.firstName} {address.lastName}
                  </span>
                  {address.isDefault && (
                    <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs font-semibold rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {address.address1}
                  {address.address2 && `, ${address.address2}`}
                  <br />
                  {address.city}, {address.province} {address.postalCode}
                  <br />
                  {address.country}
                </p>
                {address.phone && (
                  <p className="text-sm text-neutral-500 mt-1">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {address.phone}
                  </p>
                )}
              </div>
            </motion.label>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

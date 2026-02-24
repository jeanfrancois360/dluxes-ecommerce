'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingInput } from '@nextpik/ui';
import { FloatingSelect } from '@nextpik/ui';
import { CountrySelector } from '@/components/forms/country-selector';
import { SavedAddressSelector } from './saved-address-selector';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';

export interface Address {
  id?: string; // Optional - present when using saved address
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  saveAsDefault?: boolean;
}

interface AddressFormProps {
  initialAddress?: Partial<Address>;
  onSubmit: (address: Address) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export function AddressForm({ initialAddress, onSubmit, onBack, isLoading }: AddressFormProps) {
  const t = useTranslations('components.addressForm');
  const { user } = useAuth();
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [isUsingNewAddress, setIsUsingNewAddress] = useState<boolean>(true);
  const [formData, setFormData] = useState<Address>({
    firstName: initialAddress?.firstName || '',
    lastName: initialAddress?.lastName || '',
    company: initialAddress?.company || '',
    addressLine1: initialAddress?.addressLine1 || '',
    addressLine2: initialAddress?.addressLine2 || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    postalCode: initialAddress?.postalCode || '',
    country: initialAddress?.country || 'United States',
    phone: initialAddress?.phone || '',
    saveAsDefault: initialAddress?.saveAsDefault || false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});

  // Handle saved address selection
  const handleSavedAddressSelect = (address: Address | null, addressId?: string) => {
    if (address && addressId) {
      // User selected a saved address
      setFormData(address);
      setSelectedSavedAddressId(addressId);
      setIsUsingNewAddress(false);
      setErrors({}); // Clear any existing errors
    } else {
      // User wants to enter a new address
      setFormData({
        firstName: '',
        lastName: '',
        company: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        phone: '',
        saveAsDefault: false,
      });
      setSelectedSavedAddressId(null);
      setIsUsingNewAddress(true);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Address, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('lastNameRequired');
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = t('addressRequired');
    } else if (formData.addressLine1.trim().length > 35) {
      newErrors.addressLine1 = 'Address must not exceed 35 characters (shipping provider limit)';
    } else if (/[\n\r]/.test(formData.addressLine1)) {
      newErrors.addressLine1 = 'Address cannot contain line breaks';
    }

    if (formData.addressLine2 && formData.addressLine2.trim().length > 35) {
      newErrors.addressLine2 = 'Address line 2 must not exceed 35 characters';
    }

    if (!formData.city.trim()) {
      newErrors.city = t('cityRequired');
    } else if (formData.city.trim().length > 50) {
      newErrors.city = 'City name must not exceed 50 characters';
    }

    if (!formData.state.trim()) {
      newErrors.state = t('stateRequired');
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = t('postalCodeRequired');
    } else if (
      formData.country === 'United States' &&
      !/^\d{5}(-\d{4})?$/.test(formData.postalCode)
    ) {
      newErrors.postalCode = t('invalidPostalCode');
    }

    if (!formData.country.trim()) {
      newErrors.country = t('countryRequired');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('phoneRequired');
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = t('invalidPhone');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If using saved address, skip validation and just submit
    if (!isUsingNewAddress && selectedSavedAddressId) {
      onSubmit({ ...formData, id: selectedSavedAddressId } as any);
      return;
    }

    // Otherwise validate and submit new address
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof Address, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Saved Address Selector - Only show for logged-in users */}
      {user && (
        <SavedAddressSelector
          onSelect={handleSavedAddressSelect}
          selectedAddressId={selectedSavedAddressId}
        />
      )}

      {/* Using Saved Address Indicator */}
      {!isUsingNewAddress && selectedSavedAddressId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3"
        >
          <svg
            className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900">{t('usingSavedAddress')}</p>
            <p className="text-xs text-green-700 mt-1">{t('savedAddressNote')}</p>
          </div>
        </motion.div>
      )}

      {/* Contact Information */}
      <div className={!isUsingNewAddress ? 'opacity-60 pointer-events-none' : ''}>
        <h3 className="text-lg font-serif font-semibold mb-4">
          {t('contactInformation')}
          {!isUsingNewAddress && (
            <span className="ml-2 text-sm font-normal text-neutral-500">{t('readOnly')}</span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingInput
            label={t('firstName')}
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            disabled={isLoading}
            required
          />
          <FloatingInput
            label={t('lastName')}
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
            disabled={isLoading}
            required
          />
        </div>
        <div className="mt-4">
          <FloatingInput
            label={t('companyOptional')}
            value={formData.company}
            onChange={(e) => handleChange('company', e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Shipping Address */}
      <div className={!isUsingNewAddress ? 'opacity-60 pointer-events-none' : ''}>
        <h3 className="text-lg font-serif font-semibold mb-4">
          {t('shippingAddress')}
          {!isUsingNewAddress && (
            <span className="ml-2 text-sm font-normal text-neutral-500">{t('readOnly')}</span>
          )}
        </h3>
        <div className="space-y-4">
          <div>
            <FloatingInput
              label={t('addressLine1')}
              value={formData.addressLine1}
              onChange={(e) => handleChange('addressLine1', e.target.value)}
              error={errors.addressLine1}
              disabled={isLoading}
              required
              maxLength={35}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.addressLine1.length}/35 characters
            </p>
          </div>
          <div>
            <FloatingInput
              label={t('addressLine2Optional')}
              value={formData.addressLine2}
              onChange={(e) => handleChange('addressLine2', e.target.value)}
              error={errors.addressLine2}
              disabled={isLoading}
              maxLength={35}
            />
            {formData.addressLine2 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formData.addressLine2.length}/35 characters
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              label={t('city')}
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              error={errors.city}
              disabled={isLoading}
              required
            />
            <div>
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-4 bg-white border-2 ${
                  errors.state ? 'border-red-500' : 'border-neutral-200'
                } rounded-lg text-base text-black transition-all duration-300 focus:outline-none focus:border-gold hover:border-neutral-300`}
              >
                <option value="">{t('selectState')}</option>
                {US_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
              {errors.state && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500 px-1"
                >
                  {errors.state}
                </motion.p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              label={t('postalCode')}
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              error={errors.postalCode}
              disabled={isLoading}
              required
            />
            <div>
              <CountrySelector
                value={formData.country}
                onChange={(countryName) => handleChange('country', countryName)}
                error={errors.country}
                placeholder={t('selectCountry')}
                className={isLoading ? 'opacity-50 pointer-events-none' : ''}
              />
              {errors.country && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500 px-1"
                >
                  {errors.country}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phone Number */}
      <div className={!isUsingNewAddress ? 'opacity-60 pointer-events-none' : ''}>
        <FloatingInput
          label={t('phoneNumber')}
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          disabled={isLoading}
          required
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          }
        />
      </div>

      {/* Save as Default - Only show when creating new address */}
      {isUsingNewAddress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <input
            type="checkbox"
            id="saveAsDefault"
            checked={formData.saveAsDefault}
            onChange={(e) => handleChange('saveAsDefault', e.target.checked)}
            disabled={isLoading}
            className="w-5 h-5 rounded border-neutral-300 text-gold focus:ring-gold focus:ring-offset-0"
          />
          <label htmlFor="saveAsDefault" className="text-sm text-neutral-700 cursor-pointer">
            {t('saveAsDefault')}
          </label>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        {onBack && (
          <motion.button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-4 border-2 border-neutral-200 rounded-lg font-semibold hover:border-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('back')}
          </motion.button>
        )}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t('processing')}
            </>
          ) : (
            <>
              {isUsingNewAddress ? t('saveAndContinue') : t('continueToShipping')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}

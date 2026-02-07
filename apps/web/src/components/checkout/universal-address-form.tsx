'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Label, Textarea, Checkbox } from '@nextpik/ui';
import { CountrySelector } from './country-selector-simple';
import { PhoneInput } from './phone-input';
import {
  getCountryConfig,
  validatePostalCode,
  validatePhoneNumber,
  type CountryAddressConfig,
} from '@/lib/data/address-countries';

/**
 * Address form data structure
 */
export interface AddressFormData {
  country: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  deliveryNotes?: string;
  isDefault: boolean;
}

/**
 * Form validation errors
 */
interface FormErrors {
  country?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

/**
 * Component props
 */
interface UniversalAddressFormProps {
  initialData?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  showCancelButton?: boolean;
}

/**
 * Universal Address Form Component
 *
 * Adapts to any country's address format requirements
 * Shows/hides fields based on country selection
 * Validates according to country-specific rules
 */
export function UniversalAddressForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save & Continue to Shipping',
  showCancelButton = false,
}: UniversalAddressFormProps) {
  // Form state
  const [formData, setFormData] = useState<AddressFormData>({
    country: initialData?.country || '', // No default - user must select
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postalCode: initialData?.postalCode || '',
    deliveryNotes: initialData?.deliveryNotes || '',
    isDefault: initialData?.isDefault || false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countryConfig, setCountryConfig] = useState<CountryAddressConfig>(
    formData.country ? getCountryConfig(formData.country) : getCountryConfig('US') // Use US config as template when no country selected
  );

  /**
   * Update country configuration when country changes
   */
  useEffect(() => {
    if (!formData.country) return; // Don't update config if no country selected

    const config = getCountryConfig(formData.country);
    setCountryConfig(config);

    // Clear state and postal code if new country doesn't use them
    setFormData((prev) => {
      const updates: Partial<AddressFormData> = {};

      if (!config.showState) {
        updates.state = '';
      }

      if (!config.showPostalCode) {
        updates.postalCode = '';
      }

      return { ...prev, ...updates };
    });

    // Clear related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (!config.showState) delete newErrors.state;
      if (!config.showPostalCode) delete newErrors.postalCode;
      return newErrors;
    });
  }, [formData.country]);

  /**
   * Handle input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handle country change
   */
  const handleCountryChange = (countryCode: string) => {
    setFormData((prev) => ({ ...prev, country: countryCode }));

    // Clear country error
    if (errors.country) {
      setErrors((prev) => ({ ...prev, country: undefined }));
    }
  };

  /**
   * Handle phone change
   */
  const handlePhoneChange = (phone: string) => {
    setFormData((prev) => ({ ...prev, phone }));

    // Clear phone error
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  /**
   * Handle checkbox change
   */
  const handleDefaultChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isDefault: checked }));
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Country (always required)
    if (!formData.country) {
      newErrors.country = 'Please select a country';
    }

    // Full name (always required)
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    // Phone (always required)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone, formData.country)) {
      newErrors.phone = `Invalid phone number for ${countryConfig.name}`;
    }

    // Address (always required)
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Please provide a complete address';
    }

    // City (always required)
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'City name must be at least 2 characters';
    }

    // State (conditionally required)
    if (countryConfig.showState && countryConfig.requiresState) {
      if (!formData.state?.trim()) {
        newErrors.state = `${countryConfig.stateLabel} is required`;
      }
    }

    // Postal code (conditionally required)
    if (countryConfig.showPostalCode && countryConfig.requiresPostalCode) {
      if (!formData.postalCode?.trim()) {
        newErrors.postalCode = `${countryConfig.postalCodeLabel} is required`;
      } else if (!validatePostalCode(formData.postalCode, formData.country)) {
        newErrors.postalCode = `Invalid ${countryConfig.postalCodeLabel.toLowerCase()} format`;
      }
    } else if (
      countryConfig.showPostalCode &&
      formData.postalCode?.trim() &&
      !validatePostalCode(formData.postalCode, formData.country)
    ) {
      // Validate format even if optional, but only if user entered something
      newErrors.postalCode = `Invalid ${countryConfig.postalCodeLabel.toLowerCase()} format`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean up data - remove empty optional fields
      const cleanData: AddressFormData = {
        country: formData.country,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        isDefault: formData.isDefault,
      };

      // Only include state if country uses it
      if (countryConfig.showState && formData.state?.trim()) {
        cleanData.state = formData.state.trim();
      }

      // Only include postal code if country uses it
      if (countryConfig.showPostalCode && formData.postalCode?.trim()) {
        cleanData.postalCode = formData.postalCode.trim();
      }

      // Include delivery notes if provided
      if (formData.deliveryNotes?.trim()) {
        cleanData.deliveryNotes = formData.deliveryNotes.trim();
      }

      await onSubmit(cleanData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        country: 'Failed to save address. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Country Selector - ALWAYS FIRST */}
      <div className="space-y-2">
        <Label htmlFor="country">
          Country <span className="text-red-500">*</span>
        </Label>
        <CountrySelector
          value={formData.country}
          onChange={handleCountryChange}
          error={errors.country}
        />
        {errors.country && (
          <p className="text-sm text-red-500" data-error="true">
            {errors.country}
          </p>
        )}
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="John Doe"
          className={errors.fullName ? 'border-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500" data-error="true">
            {errors.fullName}
          </p>
        )}
        <p className="text-xs text-muted-foreground">First and last name for delivery</p>
      </div>

      {/* Phone Number with Country Prefix */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <PhoneInput
          value={formData.phone}
          onChange={handlePhoneChange}
          countryCode={formData.country}
          error={errors.phone}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-red-500" data-error="true">
            {errors.phone}
          </p>
        )}
        <p className="text-xs text-muted-foreground">For delivery updates and contact</p>
      </div>

      {/* Address (Textarea) */}
      <div className="space-y-2">
        <Label htmlFor="address">
          Address <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Street address, building name, apartment number, area"
          rows={3}
          className={errors.address ? 'border-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.address && (
          <p className="text-sm text-red-500" data-error="true">
            {errors.address}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Include street, building, apartment/unit number
        </p>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">
          City <span className="text-red-500">*</span>
        </Label>
        <Input
          id="city"
          name="city"
          type="text"
          value={formData.city}
          onChange={handleChange}
          placeholder="Paris"
          className={errors.city ? 'border-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.city && (
          <p className="text-sm text-red-500" data-error="true">
            {errors.city}
          </p>
        )}
      </div>

      {/* State/Province - Conditional */}
      {formData.country && countryConfig.showState && (
        <div className="space-y-2">
          <Label htmlFor="state">
            {countryConfig.stateLabel}
            {countryConfig.requiresState && <span className="text-red-500"> *</span>}
          </Label>
          <Input
            id="state"
            name="state"
            type="text"
            value={formData.state || ''}
            onChange={handleChange}
            placeholder={`Enter ${countryConfig.stateLabel.toLowerCase()}`}
            className={errors.state ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.state && (
            <p className="text-sm text-red-500" data-error="true">
              {errors.state}
            </p>
          )}
        </div>
      )}

      {/* Postal Code - Conditional */}
      {formData.country && countryConfig.showPostalCode && (
        <div className="space-y-2">
          <Label htmlFor="postalCode">
            {countryConfig.postalCodeLabel}
            {countryConfig.requiresPostalCode && <span className="text-red-500"> *</span>}
          </Label>
          <Input
            id="postalCode"
            name="postalCode"
            type="text"
            value={formData.postalCode || ''}
            onChange={handleChange}
            placeholder={
              countryConfig.postalCodePlaceholder ||
              `Enter ${countryConfig.postalCodeLabel.toLowerCase()}`
            }
            className={errors.postalCode ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.postalCode && (
            <p className="text-sm text-red-500" data-error="true">
              {errors.postalCode}
            </p>
          )}
          {countryConfig.postalCodePlaceholder && !errors.postalCode && (
            <p className="text-xs text-muted-foreground">
              Example: {countryConfig.postalCodePlaceholder}
            </p>
          )}
        </div>
      )}

      {/* Delivery Instructions (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="deliveryNotes">
          Delivery Instructions <span className="text-xs text-muted-foreground">(Optional)</span>
        </Label>
        <Textarea
          id="deliveryNotes"
          name="deliveryNotes"
          value={formData.deliveryNotes || ''}
          onChange={handleChange}
          placeholder="Landmarks, gate codes, or special instructions for delivery"
          rows={2}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">Help courier find your location easily</p>
      </div>

      {/* Save as Default Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={handleDefaultChange}
          disabled={isSubmitting}
        />
        <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
          Save this address as my default shipping address
        </Label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        {showCancelButton && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={showCancelButton ? 'flex-1' : 'w-full'}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">Saving...</span>
              <span className="animate-spin">⏳</span>
            </>
          ) : (
            <>{submitLabel} →</>
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground text-center pt-2">
        <span className="text-red-500">*</span> Required fields
      </div>
    </form>
  );
}

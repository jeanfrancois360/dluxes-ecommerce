/**
 * Address Form Validation
 */

export interface AddressFormData {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault?: boolean;
}

export interface AddressValidationErrors {
  firstName?: string;
  lastName?: string;
  address1?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
}

/**
 * Validate phone number format
 * Accepts various international formats
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true; // Phone is optional

  // Remove all non-digit characters except + at the start
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Must have at least 10 digits (excluding country code)
  const digitsOnly = cleaned.replace(/\+/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Validate postal code format
 * Basic validation - not country-specific
 */
export function validatePostalCode(postalCode: string): boolean {
  if (!postalCode || postalCode.trim() === '') return false;

  // Must be between 3-10 characters and contain letters or numbers
  const cleaned = postalCode.trim();
  return cleaned.length >= 3 && cleaned.length <= 10 && /^[A-Za-z0-9\s-]+$/.test(cleaned);
}

/**
 * Validate required field
 */
export function validateRequired(value: string | undefined | null): boolean {
  return !!value && value.trim().length > 0;
}

/**
 * Validate name (first name or last name)
 */
export function validateName(name: string): boolean {
  if (!validateRequired(name)) return false;

  // Must be at least 2 characters and contain only letters, spaces, hyphens, and apostrophes
  const trimmed = name.trim();
  return trimmed.length >= 2 && /^[A-Za-z\s'-]+$/.test(trimmed);
}

/**
 * Validate complete address form
 */
export function validateAddressForm(data: AddressFormData): {
  isValid: boolean;
  errors: AddressValidationErrors;
} {
  const errors: AddressValidationErrors = {};

  // First Name - required, must be valid name
  if (!validateRequired(data.firstName)) {
    errors.firstName = 'First name is required';
  } else if (!validateName(data.firstName)) {
    errors.firstName = 'Please enter a valid first name (letters only, min 2 characters)';
  }

  // Last Name - required, must be valid name
  if (!validateRequired(data.lastName)) {
    errors.lastName = 'Last name is required';
  } else if (!validateName(data.lastName)) {
    errors.lastName = 'Please enter a valid last name (letters only, min 2 characters)';
  }

  // Address Line 1 - required
  if (!validateRequired(data.address1)) {
    errors.address1 = 'Address is required';
  } else if (data.address1.trim().length < 5) {
    errors.address1 = 'Please enter a complete address (min 5 characters)';
  }

  // City - required
  if (!validateRequired(data.city)) {
    errors.city = 'City is required';
  } else if (!validateName(data.city)) {
    errors.city = 'Please enter a valid city name';
  }

  // Province/State - required
  if (!validateRequired(data.province)) {
    errors.province = 'State/Province is required';
  }

  // Country - required
  if (!validateRequired(data.country)) {
    errors.country = 'Country is required';
  }

  // Postal Code - required with format validation
  if (!validateRequired(data.postalCode)) {
    errors.postalCode = 'Postal code is required';
  } else if (!validatePostalCode(data.postalCode)) {
    errors.postalCode = 'Please enter a valid postal code';
  }

  // Phone - optional but validated if provided
  if (data.phone && data.phone.trim() !== '' && !validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number (10-15 digits)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

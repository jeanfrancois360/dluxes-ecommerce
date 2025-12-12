/**
 * Settings utilities for transforming and managing settings data
 */

export interface Setting {
  key: string;
  value: any;
  label: string;
  description?: string;
  valueType: string;
  isPublic: boolean;
  isEditable: boolean;
  requiresRestart: boolean;
}

/**
 * Transform array of settings into key-value object for forms
 */
export function transformSettingsToForm(settings: Setting[]): Record<string, any> {
  const form: Record<string, any> = {};
  settings.forEach((setting) => {
    form[setting.key] = setting.value;
  });
  return form;
}

/**
 * Get setting value by key
 */
export function getSettingValue(settings: Setting[], key: string, defaultValue?: any): any {
  const setting = settings.find((s) => s.key === key);
  return setting?.value ?? defaultValue;
}

/**
 * Check if any settings require restart
 */
export function hasRestartRequired(settings: Setting[], changedKeys: string[]): boolean {
  return settings.some((s) => changedKeys.includes(s.key) && s.requiresRestart);
}

/**
 * Get changed settings between two objects
 */
export function getChangedSettings(
  original: Record<string, any>,
  updated: Record<string, any>
): string[] {
  const changed: string[] = [];
  Object.keys(updated).forEach((key) => {
    if (JSON.stringify(original[key]) !== JSON.stringify(updated[key])) {
      changed.push(key);
    }
  });
  return changed;
}

/**
 * Validate setting dependencies
 */
export function validateSettingDependencies(
  settings: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate default currency is in supported currencies
  if (settings.default_currency && settings.supported_currencies) {
    const supportedCurrencies = Array.isArray(settings.supported_currencies)
      ? settings.supported_currencies
      : JSON.parse(settings.supported_currencies || '[]');

    const defaultCurrency = typeof settings.default_currency === 'string'
      ? settings.default_currency.replace(/"/g, '')
      : settings.default_currency;

    if (!supportedCurrencies.includes(defaultCurrency)) {
      errors.push('Default currency must be in supported currencies list');
    }
  }

  // Validate payout amount is positive
  const payoutAmount = settings['payout.minimum_amount'] || settings.min_payout_amount;
  if (payoutAmount && payoutAmount < 0) {
    errors.push('Minimum payout amount must be positive');
  }

  // Validate escrow hold days
  const holdDays = settings['escrow.hold_period_days'] || settings.escrow_default_hold_days;
  if (holdDays) {
    const days = Number(holdDays);
    if (days < 1 || days > 90) {
      errors.push('Escrow hold days must be between 1 and 90');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

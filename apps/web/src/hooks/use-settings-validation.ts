'use client';

import { useMemo } from 'react';
import { useSettings } from './use-settings';
import { validateSettings, getValidationSummary, type ValidationResult } from '@/lib/settings-validator';
import { transformSettingsToForm } from '@/lib/settings-utils';

/**
 * Hook to validate all platform settings
 */
export function useSettingsValidation() {
  const { settings: generalSettings } = useSettings('general');
  const { settings: paymentSettings } = useSettings('payment');
  const { settings: paymentSettingsUpper } = useSettings('PAYMENT'); // Uppercase for escrow settings
  const { settings: commissionSettings } = useSettings('commission');
  const { settings: currencySettings } = useSettings('currency');
  const { settings: deliverySettings } = useSettings('delivery');
  const { settings: securitySettings } = useSettings('security');

  const allSettings = useMemo(() => {
    return {
      ...transformSettingsToForm(generalSettings),
      ...transformSettingsToForm(paymentSettings),
      ...transformSettingsToForm(paymentSettingsUpper), // Include uppercase PAYMENT settings
      ...transformSettingsToForm(commissionSettings),
      ...transformSettingsToForm(currencySettings),
      ...transformSettingsToForm(deliverySettings),
      ...transformSettingsToForm(securitySettings),
    };
  }, [
    generalSettings,
    paymentSettings,
    paymentSettingsUpper,
    commissionSettings,
    currencySettings,
    deliverySettings,
    securitySettings,
  ]);

  const validation: ValidationResult = useMemo(() => {
    return validateSettings(allSettings);
  }, [allSettings]);

  const summary = useMemo(() => {
    return getValidationSummary(allSettings);
  }, [allSettings]);

  return {
    validation,
    summary,
    allSettings,
    hasCriticalIssues: validation.missing.length > 0,
    hasWarnings: validation.warnings.length > 0,
  };
}

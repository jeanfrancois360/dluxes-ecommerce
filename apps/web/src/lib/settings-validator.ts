/**
 * Settings Validation Utility
 * Checks for missing or invalid critical settings that are required for platform operations
 */

export interface SettingRequirement {
  key: string;
  category: string;
  label: string;
  description: string;
  requiredFor: string[];
  severity: 'critical' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  missing: SettingRequirement[];
  warnings: SettingRequirement[];
  blockedOperations: string[];
}

/**
 * Critical settings that must be configured
 */
export const REQUIRED_SETTINGS: SettingRequirement[] = [
  {
    key: 'escrow_enabled',
    category: 'payment',
    label: 'Escrow System',
    description: 'Escrow must be enabled for secure payments',
    requiredFor: ['checkout', 'orders', 'payments'],
    severity: 'critical',
  },
  {
    key: 'escrow_default_hold_days',
    category: 'payment',
    label: 'Escrow Hold Period',
    description: 'Default days to hold payment after delivery',
    requiredFor: ['checkout', 'orders', 'payments'],
    severity: 'critical',
  },
  {
    key: 'min_payout_amount',
    category: 'payment',
    label: 'Minimum Payout Amount',
    description: 'Minimum amount required for seller payouts',
    requiredFor: ['payouts', 'seller-dashboard'],
    severity: 'warning',
  },
  {
    key: 'global_commission_rate',
    category: 'commission',
    label: 'Commission Rate',
    description: 'Platform commission rate on sales',
    requiredFor: ['checkout', 'orders', 'seller-earnings'],
    severity: 'critical',
  },
  {
    key: 'default_currency',
    category: 'currency',
    label: 'Default Currency',
    description: 'Primary currency for pricing',
    requiredFor: ['products', 'checkout', 'orders'],
    severity: 'critical',
  },
  {
    key: 'supported_currencies',
    category: 'currency',
    label: 'Supported Currencies',
    description: 'List of currencies supported on the platform',
    requiredFor: ['products', 'checkout'],
    severity: 'warning',
  },
  {
    key: 'delivery_confirmation_required',
    category: 'delivery',
    label: 'Delivery Confirmation',
    description: 'Require delivery confirmation for escrow release',
    requiredFor: ['orders', 'delivery', 'escrow-release'],
    severity: 'critical',
  },
  {
    key: 'password_min_length',
    category: 'security',
    label: 'Password Minimum Length',
    description: 'Minimum password length for security',
    requiredFor: ['authentication', 'registration'],
    severity: 'warning',
  },
];

/**
 * Validate if a setting value is properly configured
 */
function isSettingConfigured(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (typeof value === 'number' && isNaN(value)) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Validate all critical settings
 */
export function validateSettings(
  settings: Record<string, any>
): ValidationResult {
  const missing: SettingRequirement[] = [];
  const warnings: SettingRequirement[] = [];
  const blockedOperations = new Set<string>();

  REQUIRED_SETTINGS.forEach((requirement) => {
    const value = settings[requirement.key];
    const isConfigured = isSettingConfigured(value);

    if (!isConfigured) {
      if (requirement.severity === 'critical') {
        missing.push(requirement);
        requirement.requiredFor.forEach((op) => blockedOperations.add(op));
      } else if (requirement.severity === 'warning') {
        warnings.push(requirement);
      }
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    blockedOperations: Array.from(blockedOperations),
  };
}

/**
 * Check if a specific operation is allowed based on settings
 */
export function canPerformOperation(
  operation: string,
  settings: Record<string, any>
): { allowed: boolean; reason?: string; missingSetting?: SettingRequirement } {
  const validation = validateSettings(settings);

  const blockingSetting = validation.missing.find((req) =>
    req.requiredFor.includes(operation)
  );

  if (blockingSetting) {
    return {
      allowed: false,
      reason: `${blockingSetting.label} must be configured to perform this operation`,
      missingSetting: blockingSetting,
    };
  }

  return { allowed: true };
}

/**
 * Get settings validation summary for display
 */
export function getValidationSummary(settings: Record<string, any>): {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  criticalCount: number;
  warningCount: number;
} {
  const validation = validateSettings(settings);

  if (validation.missing.length > 0) {
    return {
      status: 'critical',
      message: `${validation.missing.length} critical setting(s) missing. Some features are disabled.`,
      criticalCount: validation.missing.length,
      warningCount: validation.warnings.length,
    };
  }

  if (validation.warnings.length > 0) {
    return {
      status: 'warning',
      message: `${validation.warnings.length} recommended setting(s) need attention.`,
      criticalCount: 0,
      warningCount: validation.warnings.length,
    };
  }

  return {
    status: 'healthy',
    message: 'All critical settings are configured correctly.',
    criticalCount: 0,
    warningCount: 0,
  };
}

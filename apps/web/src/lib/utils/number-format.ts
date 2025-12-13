/**
 * Centralized number formatting utilities
 * Provides consistent thousand separator formatting across the application
 */

/**
 * Format a number with thousand separators and decimal places
 *
 * @param value - The number to format (can be null/undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted string with thousand separators
 *
 * @example
 * formatNumber(100000) // "100,000.00"
 * formatNumber(1234.5) // "1,234.50"
 * formatNumber(0) // "0.00"
 * formatNumber(null) // "0.00"
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 2,
  locale: string = 'en-US'
): string {
  // Handle null/undefined/NaN
  if (value == null || isNaN(value) || !isFinite(value)) {
    return '0.' + '0'.repeat(decimals);
  }

  // Use Intl.NumberFormat for locale-aware formatting
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number with thousand separators (no decimals)
 *
 * @param value - The number to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted string with thousand separators, no decimals
 *
 * @example
 * formatInteger(100000) // "100,000"
 * formatInteger(1234) // "1,234"
 */
export function formatInteger(
  value: number | null | undefined,
  locale: string = 'en-US'
): string {
  return formatNumber(value, 0, locale);
}

/**
 * Format currency amount with thousand separators
 * This is a low-level utility - prefer using currency hooks for actual currency formatting
 *
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted amount with thousand separators
 *
 * @example
 * formatCurrencyAmount(100000) // "100,000.00"
 * formatCurrencyAmount(1234.567, 2) // "1,234.57"
 */
export function formatCurrencyAmount(
  amount: number | null | undefined,
  decimals: number = 2,
  locale: string = 'en-US'
): string {
  return formatNumber(amount, decimals, locale);
}

/**
 * Format percentage with thousand separators
 *
 * @param value - The percentage value (e.g., 15.5 for 15.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(15.5) // "15.50%"
 * formatPercentage(1000.25) // "1,000.25%"
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 2,
  locale: string = 'en-US'
): string {
  const formatted = formatNumber(value, decimals, locale);
  return `${formatted}%`;
}

/**
 * Parse a formatted number string back to a number
 * Removes thousand separators and parses the number
 *
 * @param value - The formatted string to parse
 * @returns Parsed number or 0 if invalid
 *
 * @example
 * parseFormattedNumber("100,000.00") // 100000
 * parseFormattedNumber("1,234.56") // 1234.56
 * parseFormattedNumber("invalid") // 0
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;

  // Remove thousand separators and parse
  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
}

/**
 * Format a number compactly (e.g., 1K, 1.5M, 2B)
 *
 * @param value - The number to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Compact formatted string
 *
 * @example
 * formatCompact(1000) // "1K"
 * formatCompact(1500000) // "1.5M"
 * formatCompact(2000000000) // "2B"
 */
export function formatCompact(
  value: number | null | undefined,
  locale: string = 'en-US'
): string {
  if (value == null || isNaN(value) || !isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

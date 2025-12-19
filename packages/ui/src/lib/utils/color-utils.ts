/**
 * Color utility functions for the UI library
 */

/**
 * Light colors that need visible borders
 * These colors are too light to see against white backgrounds without borders
 */
const LIGHT_COLORS = [
  '#FFFFFF', // White
  '#FFFFF0', // Ivory
  '#F5F5DC', // Beige
  '#FFFDD0', // Cream
  '#FAFAFA', // Off-white
  '#F8F8F8', // Light gray
] as const;

/**
 * Check if a color is light and needs a visible border
 * @param hex - Hex color code (e.g., "#FFFFFF")
 * @returns true if the color is light and needs a border
 */
export function isLightColor(hex: string): boolean {
  if (!hex) return false;

  const upperHex = hex.toUpperCase();

  // Check if it's in our predefined light colors list
  if (LIGHT_COLORS.includes(upperHex as any)) {
    return true;
  }

  // Check if it starts with #FFF or #F (very light colors)
  if (upperHex.startsWith('#FFF') || upperHex.startsWith('#F')) {
    return true;
  }

  // Calculate luminance for any hex color
  // Remove # if present
  const cleanHex = upperHex.replace('#', '');

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  // Calculate relative luminance (sRGB color space)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Colors with luminance > 0.9 are considered light
  return luminance > 0.9;
}

/**
 * Calculate the discount percentage between two prices
 * @param originalPrice - The original/compare price
 * @param salePrice - The current sale price
 * @returns The discount percentage (0-100)
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  salePrice: number
): number {
  if (!originalPrice || !salePrice || salePrice >= originalPrice) {
    return 0;
  }

  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Get contrasting text color for a background color
 * @param hex - Background hex color
 * @returns 'light' or 'dark' for the text color
 */
export function getContrastTextColor(hex: string): 'light' | 'dark' {
  if (!hex) return 'dark';

  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Calculate perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? 'dark' : 'light';
}

/**
 * SKU Generator Utility
 *
 * Generates unique Stock Keeping Units (SKUs) for products and variants
 * Format: PREFIX-CATEGORY-RANDOM
 * Example: PROD-FASH-A8B2C4
 */

import { SKU_CONFIG } from '../constants/inventory.constants';

export class SkuGenerator {
  /**
   * Generate a product SKU
   * @param productName - Product name
   * @param categorySlug - Category slug (optional)
   * @returns Generated SKU
   */
  static generateProductSku(productName: string, categorySlug?: string): string {
    const prefix = SKU_CONFIG.PRODUCT_PREFIX;
    const category = categorySlug
      ? this.sanitizeCategoryCode(categorySlug)
      : 'GEN'; // GEN = General
    const random = this.generateRandomCode(SKU_CONFIG.RANDOM_LENGTH);

    return `${prefix}-${category}-${random}`.toUpperCase();
  }

  /**
   * Generate a variant SKU based on product SKU
   * @param productSku - Parent product SKU
   * @param variantOptions - Variant options (size, color, etc.)
   * @returns Generated variant SKU
   */
  static generateVariantSku(
    productSku: string,
    variantOptions: Record<string, string>
  ): string {
    const optionCode = this.encodeVariantOptions(variantOptions);
    const random = this.generateRandomCode(4);

    return `${productSku}-${optionCode}-${random}`.toUpperCase();
  }

  /**
   * Generate a random alphanumeric code
   * @param length - Length of the code
   * @returns Random code
   */
  private static generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Sanitize category slug to 3-4 character code
   * @param categorySlug - Category slug
   * @returns Sanitized category code
   */
  private static sanitizeCategoryCode(categorySlug: string): string {
    // Remove hyphens and take first 4 characters
    const cleaned = categorySlug.replace(/-/g, '').toUpperCase();
    return cleaned.substring(0, 4);
  }

  /**
   * Encode variant options into a short code
   * @param options - Variant options object
   * @returns Encoded option code
   */
  private static encodeVariantOptions(options: Record<string, string>): string {
    const codes: string[] = [];

    // Common option mappings
    if (options.size) {
      codes.push(options.size.substring(0, 2).toUpperCase());
    }
    if (options.color) {
      codes.push(options.color.substring(0, 3).toUpperCase());
    }
    if (options.material) {
      codes.push(options.material.substring(0, 3).toUpperCase());
    }

    // If no standard options, use first 2 chars of first value
    if (codes.length === 0) {
      const firstValue = Object.values(options)[0];
      if (firstValue) {
        codes.push(firstValue.substring(0, 2).toUpperCase());
      }
    }

    return codes.join('-') || 'VAR';
  }

  /**
   * Check if a SKU is valid format
   * @param sku - SKU to validate
   * @returns True if valid format
   */
  static isValidSku(sku: string): boolean {
    // Format: PREFIX-CATEGORY-RANDOM or PREFIX-CATEGORY-RANDOM-OPTIONS-RANDOM
    const pattern = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+(-[A-Z0-9-]+)?$/;
    return pattern.test(sku);
  }

  /**
   * Generate bulk SKUs for multiple products
   * @param count - Number of SKUs to generate
   * @param categorySlug - Category slug
   * @returns Array of unique SKUs
   */
  static generateBulkSkus(count: number, categorySlug?: string): string[] {
    const skus = new Set<string>();

    while (skus.size < count) {
      const sku = this.generateProductSku(`Product ${skus.size + 1}`, categorySlug);
      skus.add(sku);
    }

    return Array.from(skus);
  }
}

/**
 * HTML Sanitization Utility
 * Uses DOMPurify to prevent XSS attacks while allowing safe HTML formatting
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Allows common formatting tags but strips dangerous elements and attributes
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    // Allowed HTML tags for rich text formatting
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'blockquote',
      'code',
      'pre',
      'span',
      'div',
    ],

    // Allowed attributes (whitelist approach for security)
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],

    // Disallow data attributes to prevent data exfiltration
    ALLOW_DATA_ATTR: false,

    // Force target="_blank" for external links
    ADD_ATTR: ['target'],

    // Additional security options
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
  });
}

/**
 * Sanitizes HTML for simple text content (no HTML allowed)
 * Strips all HTML tags and returns plain text
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns Plain text with all HTML stripped
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  });
}

/**
 * Sanitizes HTML for payment gateway setup instructions
 * More restrictive - only allows basic formatting
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizePaymentInstructions(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'code', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

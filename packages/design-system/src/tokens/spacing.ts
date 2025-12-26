/**
 * NextPik E-commerce Design System - Spacing Tokens
 * Based on 8px grid system with generous white space
 */

export const spacing = {
  0: '0px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px - Base unit
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

/**
 * Container Max Widths
 */
export const containerMaxWidth = {
  xs: '20rem', // 320px
  sm: '24rem', // 384px
  md: '28rem', // 448px
  lg: '32rem', // 512px
  xl: '36rem', // 576px
  '2xl': '42rem', // 672px
  '3xl': '48rem', // 768px
  '4xl': '56rem', // 896px
  '5xl': '64rem', // 1024px
  '6xl': '72rem', // 1152px
  '7xl': '80rem', // 1280px
  full: '100%',
} as const;

/**
 * Section Spacing Presets
 */
export const sectionSpacing = {
  compact: {
    mobile: spacing[12], // 48px
    tablet: spacing[16], // 64px
    desktop: spacing[20], // 80px
  },
  comfortable: {
    mobile: spacing[16], // 64px
    tablet: spacing[24], // 96px
    desktop: spacing[32], // 128px
  },
  spacious: {
    mobile: spacing[20], // 80px
    tablet: spacing[32], // 128px
    desktop: spacing[48], // 192px
  },
} as const;

/**
 * Component Spacing Presets
 */
export const componentSpacing = {
  // Card padding
  card: {
    compact: spacing[4], // 16px
    comfortable: spacing[6], // 24px
    spacious: spacing[8], // 32px
  },
  // Button padding
  button: {
    xs: { x: spacing[3], y: spacing[1] }, // 12px x 4px
    sm: { x: spacing[4], y: spacing[2] }, // 16px x 8px
    md: { x: spacing[6], y: spacing[3] }, // 24px x 12px
    lg: { x: spacing[8], y: spacing[4] }, // 32px x 16px
    xl: { x: spacing[10], y: spacing[5] }, // 40px x 20px
  },
  // Input padding
  input: {
    sm: { x: spacing[3], y: spacing[2] }, // 12px x 8px
    md: { x: spacing[4], y: spacing[3] }, // 16px x 12px
    lg: { x: spacing[6], y: spacing[4] }, // 24px x 16px
  },
  // Gap between elements
  gap: {
    xs: spacing[1], // 4px
    sm: spacing[2], // 8px
    md: spacing[4], // 16px
    lg: spacing[6], // 24px
    xl: spacing[8], // 32px
  },
} as const;

export type Spacing = typeof spacing;
export type SectionSpacing = typeof sectionSpacing;
export type ComponentSpacing = typeof componentSpacing;

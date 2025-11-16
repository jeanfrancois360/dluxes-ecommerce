/**
 * Luxury E-commerce Design System - Color Tokens
 * Modern minimalist luxury palette (Apple meets Chanel)
 */

export const colors = {
  // Primary Colors
  black: '#000000',
  gold: '#CBB57B',
  gray: '#C3C9C0',
  white: '#FFFFFF',

  // Extended Palette
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },

  // Gold Variations
  accent: {
    50: '#FDFBF7',
    100: '#FAF6ED',
    200: '#F4ECD9',
    300: '#EBE0C0',
    400: '#DFD0A3',
    500: '#CBB57B', // Primary Gold
    600: '#B89F63',
    700: '#9A824D',
    800: '#7D6A3F',
    900: '#645535',
  },

  // Semantic Colors
  success: {
    light: '#D1FAE5',
    DEFAULT: '#10B981',
    dark: '#047857',
  },
  error: {
    light: '#FEE2E2',
    DEFAULT: '#EF4444',
    dark: '#B91C1C',
  },
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F59E0B',
    dark: '#D97706',
  },
  info: {
    light: '#DBEAFE',
    DEFAULT: '#3B82F6',
    dark: '#1D4ED8',
  },

  // Background & Surface
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
    dark: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Border Colors
  border: {
    light: '#E5E5E5',
    DEFAULT: '#D4D4D4',
    dark: '#A3A3A3',
    gold: '#CBB57B',
  },

  // Text Colors
  text: {
    primary: '#000000',
    secondary: '#525252',
    tertiary: '#737373',
    inverse: '#FFFFFF',
    gold: '#CBB57B',
    muted: '#A3A3A3',
  },
} as const;

export type Colors = typeof colors;

/**
 * CSS Custom Properties for runtime theming
 */
export const cssVariables = {
  // Primary
  '--color-black': colors.black,
  '--color-gold': colors.gold,
  '--color-gray': colors.gray,
  '--color-white': colors.white,

  // Backgrounds
  '--color-bg-primary': colors.background.primary,
  '--color-bg-secondary': colors.background.secondary,
  '--color-bg-tertiary': colors.background.tertiary,
  '--color-bg-dark': colors.background.dark,
  '--color-bg-overlay': colors.background.overlay,

  // Text
  '--color-text-primary': colors.text.primary,
  '--color-text-secondary': colors.text.secondary,
  '--color-text-tertiary': colors.text.tertiary,
  '--color-text-inverse': colors.text.inverse,
  '--color-text-gold': colors.text.gold,
  '--color-text-muted': colors.text.muted,

  // Borders
  '--color-border-light': colors.border.light,
  '--color-border': colors.border.DEFAULT,
  '--color-border-dark': colors.border.dark,
  '--color-border-gold': colors.border.gold,

  // Semantic
  '--color-success': colors.success.DEFAULT,
  '--color-error': colors.error.DEFAULT,
  '--color-warning': colors.warning.DEFAULT,
  '--color-info': colors.info.DEFAULT,
} as const;

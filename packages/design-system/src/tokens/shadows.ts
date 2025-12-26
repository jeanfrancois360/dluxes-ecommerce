/**
 * NextPik E-commerce Design System - Shadow Tokens
 * Smooth, elegant shadows for depth and elevation
 */

export const shadows = {
  // Subtle shadows
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  innerLg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',

  // No shadow
  none: 'none',

  // Gold accent shadows
  goldSm: '0 2px 8px rgba(203, 181, 123, 0.2)',
  goldMd: '0 4px 12px rgba(203, 181, 123, 0.25)',
  goldLg: '0 8px 24px rgba(203, 181, 123, 0.3)',

  // Elevated cards
  card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',

  // Dropdown & Modals
  dropdown: '0 12px 32px rgba(0, 0, 0, 0.15)',
  modal: '0 24px 48px rgba(0, 0, 0, 0.2)',

  // Focus states
  focus: '0 0 0 3px rgba(203, 181, 123, 0.3)',
  focusError: '0 0 0 3px rgba(239, 68, 68, 0.3)',
  focusSuccess: '0 0 0 3px rgba(16, 185, 129, 0.3)',
} as const;

/**
 * Glassmorphism effects
 */
export const glass = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: shadows.lg,
  },
  dark: {
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(10px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: shadows.xl,
  },
  gold: {
    background: 'rgba(203, 181, 123, 0.1)',
    backdropFilter: 'blur(10px) saturate(180%)',
    border: '1px solid rgba(203, 181, 123, 0.2)',
    boxShadow: shadows.goldMd,
  },
} as const;

export type Shadows = typeof shadows;
export type Glass = typeof glass;

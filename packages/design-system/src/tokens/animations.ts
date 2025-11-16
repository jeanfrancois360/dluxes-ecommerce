/**
 * Luxury E-commerce Design System - Animation Tokens
 * Smooth, subtle animations (0.3s ease-in-out)
 */

export const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '300ms', // Default
  slow: '500ms',
  slower: '700ms',
  slowest: '1000ms',
} as const;

export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', // Default
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elegant: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

/**
 * Animation Presets
 */
export const animations = {
  // Fade animations
  fadeIn: {
    duration: duration.normal,
    easing: easing.easeOut,
    keyframes: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  },
  fadeOut: {
    duration: duration.normal,
    easing: easing.easeIn,
    keyframes: {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
  },

  // Slide animations
  slideInUp: {
    duration: duration.normal,
    easing: easing.elegant,
    keyframes: {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
  },
  slideInDown: {
    duration: duration.normal,
    easing: easing.elegant,
    keyframes: {
      from: { transform: 'translateY(-20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
  },
  slideInLeft: {
    duration: duration.normal,
    easing: easing.elegant,
    keyframes: {
      from: { transform: 'translateX(-20px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
  },
  slideInRight: {
    duration: duration.normal,
    easing: easing.elegant,
    keyframes: {
      from: { transform: 'translateX(20px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
  },

  // Scale animations
  scaleIn: {
    duration: duration.normal,
    easing: easing.elegant,
    keyframes: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
  },
  scaleOut: {
    duration: duration.normal,
    easing: easing.easeIn,
    keyframes: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.95)', opacity: 0 },
    },
  },

  // Hover effects
  hoverLift: {
    duration: duration.normal,
    easing: easing.elegant,
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },
  hoverScale: {
    duration: duration.normal,
    easing: easing.elegant,
    transform: 'scale(1.05)',
  },
  hoverGlow: {
    duration: duration.normal,
    easing: easing.elegant,
    boxShadow: '0 0 20px rgba(203, 181, 123, 0.4)',
  },

  // Spin animation
  spin: {
    duration: duration.slowest,
    easing: easing.linear,
    keyframes: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  },

  // Pulse animation
  pulse: {
    duration: duration.slower,
    easing: easing.easeInOut,
    keyframes: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
  },

  // Shimmer effect (for loading states)
  shimmer: {
    duration: '2000ms',
    easing: easing.linear,
    keyframes: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
  },
} as const;

/**
 * Transition Presets
 */
export const transitions = {
  // Default transition
  default: `all ${duration.normal} ${easing.easeInOut}`,

  // Specific property transitions
  colors: `color ${duration.normal} ${easing.easeInOut}, background-color ${duration.normal} ${easing.easeInOut}, border-color ${duration.normal} ${easing.easeInOut}`,
  opacity: `opacity ${duration.normal} ${easing.easeInOut}`,
  shadow: `box-shadow ${duration.normal} ${easing.elegant}`,
  transform: `transform ${duration.normal} ${easing.elegant}`,

  // Component-specific transitions
  button: `all ${duration.normal} ${easing.elegant}`,
  dropdown: `all ${duration.fast} ${easing.easeOut}`,
  modal: `all ${duration.slow} ${easing.elegant}`,
  page: `all ${duration.slow} ${easing.smooth}`,
} as const;

/**
 * Spring Animation Presets (for Framer Motion / React Spring)
 */
export const springs = {
  gentle: { mass: 1, tension: 180, friction: 26 },
  bouncy: { mass: 1, tension: 210, friction: 20 },
  slow: { mass: 1, tension: 140, friction: 40 },
  molasses: { mass: 1, tension: 100, friction: 50 },
} as const;

/**
 * GSAP Animation Presets
 */
export const gsapEasing = {
  power1: 'power1.inOut',
  power2: 'power2.inOut',
  power3: 'power3.inOut',
  power4: 'power4.inOut',
  back: 'back.inOut',
  elastic: 'elastic.inOut',
  bounce: 'bounce.inOut',
  circ: 'circ.inOut',
  expo: 'expo.inOut',
  sine: 'sine.inOut',
} as const;

export type Duration = typeof duration;
export type Easing = typeof easing;
export type Animations = typeof animations;
export type Transitions = typeof transitions;

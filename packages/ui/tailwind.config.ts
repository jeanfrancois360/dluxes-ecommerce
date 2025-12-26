import type { Config } from 'tailwindcss';
import { colors, spacing, fontSize, fontWeight, fontFamily, shadows } from '@nextpik/design-system';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        black: colors.black,
        gold: colors.gold,
        gray: colors.gray,
        white: colors.white,
        neutral: colors.neutral,
        accent: colors.accent,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        background: colors.background,
        border: colors.border,
        text: colors.text,
      },
      fontFamily: {
        sans: fontFamily.sans,
        serif: fontFamily.serif,
        mono: fontFamily.mono,
      },
      fontSize: fontSize,
      fontWeight: fontWeight,
      spacing: spacing,
      boxShadow: shadows,
    },
  },
  plugins: [],
};

export default config;

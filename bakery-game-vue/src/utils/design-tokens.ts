/**
 * Design Tokens for Bakery Game
 * Centralized design system values for consistency across the UI
 */

export const colors = {
  // Primary bakery palette
  primary: {
    50: '#fdf8f6',
    100: '#f2e8e5',
    200: '#eaddd7',
    300: '#e0cec7',
    400: '#d2bab0',
    500: '#bfa094',
    600: '#a18072',
    700: '#8b6f5c',
    800: '#6f5b4a',
    900: '#5a4a3a',
  },
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // Semantic colors
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Financial indicators
  profit: '#10b981',
  loss: '#ef4444',
  neutral: '#64748b',
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    display: 'Merriweather, Georgia, serif',
    mono: 'Fira Code, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
} as const;

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  2: '0.5rem',       // 8px
  3: '0.75rem',      // 12px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  8: '2rem',         // 32px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  32: '8rem',        // 128px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  base: '0.25rem',   // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Custom bakery shadows
  bakery: '0 4px 6px -1px rgba(139, 69, 19, 0.1), 0 2px 4px -1px rgba(139, 69, 19, 0.06)',
  bakeryLg: '0 10px 15px -3px rgba(139, 69, 19, 0.1), 0 4px 6px -2px rgba(139, 69, 19, 0.05)',
  gold: '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
} as const;

export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const breakpoints = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

// Game-specific design values
export const gameDesign = {
  // Oven colors based on temperature
  ovenHeat: {
    cold: '#64748b',
    warm: '#f59e0b',
    hot: '#ef4444',
  },
  
  // Customer satisfaction colors
  satisfaction: {
    veryHappy: '#10b981',
    happy: '#84cc16',
    neutral: '#f59e0b',
    unhappy: '#f97316',
    veryUnhappy: '#ef4444',
  },
  
  // Product freshness indicator
  freshness: {
    fresh: '#10b981',
    good: '#84cc16',
    aging: '#f59e0b',
    stale: '#ef4444',
  },
  
  // Phase colors
  phase: {
    buying: '#3b82f6',
    baking: '#f59e0b',
    selling: '#10b981',
    summary: '#8b5cf6',
  },
} as const;

export const animations = {
  fadeIn: 'fadeIn 0.3s ease-in-out',
  slideUp: 'slideUp 0.4s ease-out',
  slideDown: 'slideDown 0.4s ease-out',
  bounceSubtle: 'bounceSubtle 1s infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
} as const;

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  gameDesign,
  animations,
};

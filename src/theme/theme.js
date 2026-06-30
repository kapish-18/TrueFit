// Design tokens for TrueFit
// Premium dark theme with electric cyan accents

export const colors = {
  // Backgrounds
  bg: '#0a0e1a',
  bgAlt: '#080c16',
  surface: '#141a2e',
  surfaceAlt: '#1c2341',
  surfaceHover: '#222b4a',
  border: '#252d4a',
  borderLight: '#1e2640',

  // Primary
  primary: '#00d4ff',
  primaryDim: '#0099cc',
  primaryGlow: 'rgba(0, 212, 255, 0.15)',
  primaryBg: 'rgba(0, 212, 255, 0.08)',

  // Accents
  success: '#10b981',
  successDim: '#059669',
  successBg: 'rgba(16, 185, 129, 0.1)',
  warning: '#f59e0b',
  warningDim: '#d97706',
  warningBg: 'rgba(245, 158, 11, 0.1)',
  danger: '#ef4444',
  dangerDim: '#dc2626',
  dangerBg: 'rgba(239, 68, 68, 0.1)',

  // Text
  text: '#e8eaf6',
  textSecondary: '#9ca3c4',
  textDim: '#6b7299',
  textInverse: '#0a0e1a',

  // Misc
  gold: '#fbbf24',
  purple: '#a78bfa',
  pink: '#f472b6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 40,
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color = colors.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export default { colors, spacing, radius, fontSize, fontWeight, shadows };

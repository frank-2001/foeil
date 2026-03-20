export const Colors = {
  background: '#F8F9FA',
  paper: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  primary: '#2D3436',
  accent: '#0984E3',
  success: '#00B894',
  danger: '#D63031',
  warning: '#FDCB6E',
  border: '#E0E0E0',
  ink: '#1D1D1F',
};

export const Shadows = {
  paper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  number: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: 'System', // Use mono if available
  }
};

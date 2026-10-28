export const colors = {
  brand: {
    primary: '#7C3AED',         // Vibrant Violet / Purple
    primaryDark: '#6D28D9',     // Deep Royal Purple
    primaryLight: '#A78BFA',    // Light Lavender Purple
    primaryLighter: '#EDE9FE',  // Soft Tint Lavender
    accent: '#6366F1',          // Indigo Accent
    accentPink: '#EC4899',      // Radiant Pink Sparkle
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #D946EF 100%)',
    gradientSubtle: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
  },
  dark: {
    background: '#09090F',      // Deep Cosmic Obsidian
    surface: '#12111E',         // Midnight Violet Surface
    surfaceElevated: '#1B192E', // Elevated Dark Violet
    surfaceHover: '#262342',    // Interactive Surface
    border: 'rgba(139, 92, 246, 0.18)', // Subtle Neon Purple Border
    borderFocus: '#A78BFA',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
  },
  light: {
    background: '#F8FAFC',      // Crisp Off-White
    surface: '#FFFFFF',         // Pure White
    surfaceElevated: '#F5F3FF', // Very Subtle Lavender-White
    surfaceHover: '#EDE9FE',
    border: '#E2E8F0',          // Slate 200
    borderFocus: '#7C3AED',
    textPrimary: '#0F172A',     // Slate 900
    textSecondary: '#475569',   // Slate 600
    textMuted: '#94A3B8',       // Slate 400
  },
  status: {
    success: '#10B981',         // Emerald Green
    warning: '#F59E0B',         // Amber
    error: '#EF4444',           // Crimson
    info: '#6366F1',            // Indigo
  },
  automotive: {
    engineHot: '#DC2626',
    oilWarning: '#EA580C',
    batteryCold: '#6366F1',
    safeGreen: '#10B981',
  }
} as const;

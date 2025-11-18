import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

/**
 * Theme de El Tetu - Identidad Visual Oficial
 * 
 * Primary: #002D72 - Azul corporativo para botones principales, navegación y CTA
 * Secondary: #FFDD00 - Amarillo para acciones importantes o badges
 * Accent: #E2261A - Rojo para énfasis y alertas importantes
 * 
 * Neutrals para fondos, tarjetas y tablas
 * Feedback para estados (success, warning, error, info)
 */

// Paleta de colores oficial de El Tetu
const elTetuColors = {
  // Colores principales
  primary: '#002D72',
  secondary: '#FFDD00',
  accent: '#E2261A',
  
  // Neutrals
  backgroundLight: '#F5F5F5',
  backgroundDark: '#0C0C0C',
  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  border: '#D4D4D4',
  
  // Feedback
  success: '#2E7D32',
  warning: '#ED6C02',
  error: '#D32F2F',
  info: '#0288D1',
  
  // Colores adicionales para compatibilidad con Material Design 3
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  onPrimary: '#FFFFFF',
  onSecondary: '#1A1A1A', // Texto oscuro sobre amarillo para contraste
  onAccent: '#FFFFFF',
  onSurface: '#1A1A1A',
  onSurfaceVariant: '#4A4A4A',
  outline: '#D4D4D4',
  
  // Estados de feedback con opacidad para backgrounds
  successContainer: '#E8F5E9',
  warningContainer: '#FFF3E0',
  errorContainer: '#FFEBEE',
  infoContainer: '#E3F2FD',
};

// Tipografías
const typography = {
  // Headings - Montserrat
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: 'Montserrat-Bold',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'Montserrat-Bold',
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat-SemiBold',
    letterSpacing: 0,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat-SemiBold',
    letterSpacing: 0.15,
  },
  h5: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat-SemiBold',
    letterSpacing: 0.15,
  },
  h6: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat-SemiBold',
    letterSpacing: 0.15,
  },
  
  // Body - Inter
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.4,
  },
  
  // Labels - Inter
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.5,
  },
  
  // Caption - Inter
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.4,
  },
};

// Espaciado consistente
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Sombras modernas y sutiles
const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Bordes y radios
const borders = {
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  width: {
    thin: 1,
    medium: 1.5,
    thick: 2,
  },
};

// Theme principal para React Native Paper
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // Colores principales
    primary: elTetuColors.primary,
    secondary: elTetuColors.secondary,
    tertiary: elTetuColors.accent,
    accent: elTetuColors.accent,
    
    // Backgrounds
    background: elTetuColors.backgroundLight,
    surface: elTetuColors.surface,
    surfaceVariant: elTetuColors.surfaceVariant,
    
    // Textos
    onPrimary: elTetuColors.onPrimary,
    onSecondary: elTetuColors.onSecondary,
    onSurface: elTetuColors.onSurface,
    onSurfaceVariant: elTetuColors.onSurfaceVariant,
    
    // Bordes y outlines
    outline: elTetuColors.outline,
    outlineVariant: elTetuColors.border,
    
    // Feedback
    error: elTetuColors.error,
    errorContainer: elTetuColors.errorContainer,
    onError: elTetuColors.onPrimary,
    onErrorContainer: elTetuColors.error,
    
    // Success (usando tertiary para compatibilidad)
    success: elTetuColors.success,
    successContainer: elTetuColors.successContainer,
    onSuccess: elTetuColors.onPrimary,
    onSuccessContainer: elTetuColors.success,
    
    // Warning
    warning: elTetuColors.warning,
    warningContainer: elTetuColors.warningContainer,
    onWarning: elTetuColors.onPrimary,
    onWarningContainer: elTetuColors.warning,
    
    // Info
    info: elTetuColors.info,
    infoContainer: elTetuColors.infoContainer,
    onInfo: elTetuColors.onPrimary,
    onInfoContainer: elTetuColors.info,
  },
  roundness: 12, // borders.radius.md
  fonts: {
    ...DefaultTheme.fonts,
    // Configuración de fuentes para React Native Paper
    displayLarge: {
      ...DefaultTheme.fonts.displayLarge,
      fontFamily: 'Montserrat-Bold',
    },
    displayMedium: {
      ...DefaultTheme.fonts.displayMedium,
      fontFamily: 'Montserrat-Bold',
    },
    displaySmall: {
      ...DefaultTheme.fonts.displaySmall,
      fontFamily: 'Montserrat-Bold',
    },
    headlineLarge: {
      ...DefaultTheme.fonts.headlineLarge,
      fontFamily: 'Montserrat-Bold',
    },
    headlineMedium: {
      ...DefaultTheme.fonts.headlineMedium,
      fontFamily: 'Montserrat-Bold',
    },
    headlineSmall: {
      ...DefaultTheme.fonts.headlineSmall,
      fontFamily: 'Montserrat-SemiBold',
    },
    titleLarge: {
      ...DefaultTheme.fonts.titleLarge,
      fontFamily: 'Montserrat-SemiBold',
    },
    titleMedium: {
      ...DefaultTheme.fonts.titleMedium,
      fontFamily: 'Montserrat-SemiBold',
    },
    titleSmall: {
      ...DefaultTheme.fonts.titleSmall,
      fontFamily: 'Montserrat-SemiBold',
    },
    bodyLarge: {
      ...DefaultTheme.fonts.bodyLarge,
      fontFamily: 'Inter-Regular',
    },
    bodyMedium: {
      ...DefaultTheme.fonts.bodyMedium,
      fontFamily: 'Inter-Regular',
    },
    bodySmall: {
      ...DefaultTheme.fonts.bodySmall,
      fontFamily: 'Inter-Regular',
    },
    labelLarge: {
      ...DefaultTheme.fonts.labelLarge,
      fontFamily: 'Inter-Medium',
    },
    labelMedium: {
      ...DefaultTheme.fonts.labelMedium,
      fontFamily: 'Inter-Medium',
    },
    labelSmall: {
      ...DefaultTheme.fonts.labelSmall,
      fontFamily: 'Inter-Medium',
    },
  },
};

// Exportar colores directamente para uso en estilos
export const colors = elTetuColors;

// Exportar utilidades
export { spacing, typography, shadows, borders };

// Helper para obtener colores con opacidad
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Convertir hex a rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper para obtener color de estado
export const getEstadoColor = (estado: string): string => {
  switch (estado?.toUpperCase()) {
    case 'PENDIENTE':
      return elTetuColors.warning;
    case 'CONFIRMADO':
      return elTetuColors.info;
    case 'CANCELADO':
      return elTetuColors.error;
    case 'ENTREGADO':
      return elTetuColors.success;
    default:
      return elTetuColors.textSecondary;
  }
};

import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

/**
 * Paleta de colores de El Tetu
 * Basada en el logo púrpura/violeta de la marca
 */
const brandColors = {
  // Colores principales de marca
  purple: {
    main: '#6B2D8B',      // Púrpura principal del logo
    light: '#8E4AAD',     // Púrpura claro
    dark: '#4A1D62',      // Púrpura oscuro
    surface: '#F5EEFA',   // Superficie con tinte púrpura
  },
  // Colores de acento
  accent: {
    gold: '#D4A853',      // Dorado para acentos premium
    goldLight: '#E8C97A', // Dorado claro
  },
  // Colores semánticos
  semantic: {
    success: '#2E7D32',   // Verde éxito
    successLight: '#E8F5E9',
    warning: '#F57C00',   // Naranja advertencia
    warningLight: '#FFF3E0',
    error: '#C62828',     // Rojo error
    errorLight: '#FFEBEE',
    info: '#1565C0',      // Azul información
    infoLight: '#E3F2FD',
    invoice: '#7B1FA2',   // Violeta facturado
    invoiceLight: '#F3E5F5',
    promo: '#FF6B35',     // Naranja promoción
    promoLight: '#FFF4E5',
    promoGradientStart: '#FF6B35',
    promoGradientEnd: '#F7C331',
  },
  // Colores neutros
  neutral: {
    white: '#FFFFFF',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',
    disabled: '#BDBDBD',
  },
};

/**
 * Espaciado consistente en toda la app
 * Escala de 4px para mejor alineación
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Tipografía personalizada
 */
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;

/**
 * Radios de borde
 */
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Sombras para elevación
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/**
 * Tema principal de React Native Paper
 * Integrado con Material Design 3
 */
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // Colores primarios (púrpura de marca)
    primary: brandColors.purple.main,
    primaryContainer: brandColors.purple.surface,
    onPrimary: brandColors.neutral.white,
    onPrimaryContainer: brandColors.purple.dark,
    
    // Colores secundarios (dorado)
    secondary: brandColors.accent.gold,
    secondaryContainer: brandColors.accent.goldLight + '30',
    onSecondary: brandColors.neutral.white,
    onSecondaryContainer: brandColors.purple.dark,
    
    // Terciario (verde éxito)
    tertiary: brandColors.semantic.success,
    tertiaryContainer: brandColors.semantic.successLight,
    onTertiary: brandColors.neutral.white,
    onTertiaryContainer: brandColors.semantic.success,
    
    // Error
    error: brandColors.semantic.error,
    errorContainer: brandColors.semantic.errorLight,
    onError: brandColors.neutral.white,
    onErrorContainer: brandColors.semantic.error,
    
    // Fondos y superficies
    background: brandColors.neutral.background,
    surface: brandColors.neutral.surface,
    surfaceVariant: brandColors.purple.surface,
    onBackground: brandColors.neutral.text,
    onSurface: brandColors.neutral.text,
    onSurfaceVariant: brandColors.neutral.textSecondary,
    
    // Bordes y outlines
    outline: brandColors.neutral.border,
    outlineVariant: brandColors.neutral.borderLight,
    
    // Inversiones
    inverseSurface: brandColors.purple.dark,
    inverseOnSurface: brandColors.neutral.white,
    inversePrimary: brandColors.purple.light,
    
    // Elevación
    elevation: {
      level0: 'transparent',
      level1: brandColors.neutral.surface,
      level2: brandColors.neutral.surface,
      level3: brandColors.neutral.surface,
      level4: brandColors.neutral.surface,
      level5: brandColors.neutral.surface,
    },
  },
  roundness: borderRadius.sm,
  // Añadir spacing al tema para acceso unificado
  spacing,
};

/**
 * Colores exportados para uso directo
 * @example
 * import { colors } from '@/theme';
 * <View style={{ backgroundColor: colors.primary }} />
 */
export const colors = {
  // Marca
  primary: brandColors.purple.main,
  primaryLight: brandColors.purple.light,
  primaryDark: brandColors.purple.dark,
  primarySurface: brandColors.purple.surface,
  primaryContainer: brandColors.purple.surface,
  onPrimaryContainer: brandColors.purple.dark,
  
  // Acento
  accent: brandColors.accent.gold,
  accentLight: brandColors.accent.goldLight,
  secondary: brandColors.accent.gold,
  secondaryContainer: brandColors.accent.goldLight + '30',
  onSecondaryContainer: brandColors.purple.dark,
  
  // Terciario (verde)
  tertiary: brandColors.semantic.success,
  tertiaryContainer: brandColors.semantic.successLight,
  onTertiaryContainer: brandColors.semantic.success,
  
  // Semánticos
  success: brandColors.semantic.success,
  successLight: brandColors.semantic.successLight,
  warning: brandColors.semantic.warning,
  warningLight: brandColors.semantic.warningLight,
  error: brandColors.semantic.error,
  errorLight: brandColors.semantic.errorLight,
  errorContainer: brandColors.semantic.errorLight,
  onErrorContainer: brandColors.semantic.error,
  info: brandColors.semantic.info,
  infoLight: brandColors.semantic.infoLight,
  invoice: brandColors.semantic.invoice,
  invoiceLight: brandColors.semantic.invoiceLight,
  promo: brandColors.semantic.promo,
  promoLight: brandColors.semantic.promoLight,
  promoGradientStart: brandColors.semantic.promoGradientStart,
  promoGradientEnd: brandColors.semantic.promoGradientEnd,
  
  // Neutros
  white: brandColors.neutral.white,
  background: brandColors.neutral.background,
  surface: brandColors.neutral.surface,
  surfaceVariant: brandColors.purple.surface,
  surfaceDisabled: brandColors.neutral.disabled,
  border: brandColors.neutral.border,
  borderLight: brandColors.neutral.borderLight,
  outline: brandColors.neutral.border,
  outlineVariant: brandColors.neutral.borderLight,
  text: brandColors.neutral.text,
  textSecondary: brandColors.neutral.textSecondary,
  textTertiary: brandColors.neutral.textTertiary,
  disabled: brandColors.neutral.disabled,
  onPrimary: brandColors.neutral.white,
  onSurface: brandColors.neutral.text,
  onSurfaceVariant: brandColors.neutral.textSecondary,
  onBackground: brandColors.neutral.text,
} as const;

// Tipos para TypeScript
export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
export type ThemeTypography = typeof typography;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { colors, spacing, borderRadius } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * EmptyState
 * 
 * Componente estandarizado para estados vacíos con:
 * - Icono opcional
 * - Título y mensaje
 * - Botón de acción opcional
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={48} color={colors.primary} />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {message && (
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.button}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
});

export default EmptyState;

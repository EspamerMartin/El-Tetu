import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text, Surface } from 'react-native-paper';
import { theme, spacing, colors } from '@/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * LoadingOverlay
 * Overlay de carga con spinner y mensaje opcional
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Cargando...',
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <Surface style={styles.surface}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.spinner}
          />
          <Text variant="bodyMedium" style={styles.message}>
            {message}
          </Text>
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surface: {
    padding: spacing.xl,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    elevation: 8,
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    textAlign: 'center',
    color: colors.onSurface,
  },
});

export default LoadingOverlay;

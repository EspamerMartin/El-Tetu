import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text, Surface } from 'react-native-paper';
import { colors, spacing, borderRadius } from '@/theme';

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
          <View style={styles.spinnerContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
          </View>
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
    borderRadius: borderRadius.md,
    minWidth: 200,
    alignItems: 'center',
    elevation: 8,
    backgroundColor: colors.white,
  },
  spinnerContainer: {
    marginBottom: spacing.md,
  },
  message: {
    textAlign: 'center',
    color: colors.text,
  },
});

export default LoadingOverlay;

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/**
 * ScreenContainer
 * 
 * Contenedor estandarizado para todas las pantallas con:
 * - SafeAreaView opcional
 * - Background consistente
 * - Padding base
 */
const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  safeArea = true,
  edges = ['top', 'bottom'],
}) => {
  const containerStyle = [styles.container, style];

  if (safeArea) {
    return (
      <SafeAreaView style={containerStyle} edges={edges}>
        {children}
      </SafeAreaView>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default ScreenContainer;

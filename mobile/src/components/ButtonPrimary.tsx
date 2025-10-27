import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, ButtonProps } from 'react-native-paper';
import { spacing } from '@/theme';

interface ButtonPrimaryProps extends Omit<ButtonProps, 'mode'> {
  variant?: 'contained' | 'outlined' | 'text';
}

/**
 * ButtonPrimary
 * Botón reutilizable con estilos consistentes
 */
const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({
  variant = 'contained',
  style,
  ...props
}) => {
  return (
    <Button
      mode={variant}
      style={[styles.button, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: spacing.md,
  },
});

export default ButtonPrimary;

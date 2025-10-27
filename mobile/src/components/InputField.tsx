import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput, HelperText, TextInputProps } from 'react-native-paper';
import { spacing } from '@/theme';

interface InputFieldProps extends Omit<TextInputProps, 'theme'> {
  error?: string;
  helperText?: string;
}

/**
 * InputField
 * Campo de texto reutilizable con manejo de errores
 */
const InputField: React.FC<InputFieldProps> = ({
  error,
  helperText,
  style,
  ...props
}) => {
  return (
    <>
      <TextInput
        mode="outlined"
        error={!!error}
        style={[styles.input, style]}
        {...props}
      />
      {(error || helperText) && (
        <HelperText type={error ? 'error' : 'info'} visible>
          {error || helperText}
        </HelperText>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: spacing.xs,
  },
});

export default InputField;

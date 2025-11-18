import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { useAppDispatch, useAppSelector } from '@/store';
import { register } from '@/store/slices/authSlice';
import { theme, spacing, colors } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

/**
 * RegisterScreen
 * 
 * Pantalla de registro con:
 * - Formulario completo (nombre, apellido, email, etc.)
 * - Validación de contraseñas
 * - Manejo de errores
 */
const RegisterScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!isFormValid()) {
      return;
    }

    try {
      await dispatch(register(formData)).unwrap();
      // Navigation automática al stack correspondiente
    } catch (err) {
      // Error mostrado desde el estado de Redux
    }
  };

  const isFormValid = () => {
    return (
      formData.email.includes('@') &&
      formData.password.length >= 6 &&
      formData.password === formData.password_confirm &&
      formData.nombre &&
      formData.apellido
    );
  };

  const passwordsMatch = () => {
    if (!formData.password_confirm) return true;
    return formData.password === formData.password_confirm;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Crear Cuenta
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Completa tus datos para registrarte
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Nombre *"
              value={formData.nombre}
              onChangeText={(text) => updateField('nombre', text)}
              autoCapitalize="words"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Apellido *"
              value={formData.apellido}
              onChangeText={(text) => updateField('apellido', text)}
              autoCapitalize="words"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Teléfono"
              value={formData.telefono}
              onChangeText={(text) => updateField('telefono', text)}
              keyboardType="phone-pad"
              autoComplete="tel"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Dirección"
              value={formData.direccion}
              onChangeText={(text) => updateField('direccion', text)}
              multiline
              numberOfLines={2}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Contraseña *"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <HelperText type="info" visible>
              Mínimo 6 caracteres
            </HelperText>

            <TextInput
              label="Confirmar Contraseña *"
              value={formData.password_confirm}
              onChangeText={(text) => updateField('password_confirm', text)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              error={!passwordsMatch()}
            />
            <HelperText type="error" visible={!passwordsMatch()}>
              Las contraseñas no coinciden
            </HelperText>

            {error && (
              <HelperText type="error" visible>
                {typeof error === 'string' ? error : 'Error al registrarse'}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading || !isFormValid()}
              style={styles.button}
            >
              Registrarse
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  surface: {
    padding: spacing.lg,
    borderRadius: 12,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
  },
});

export default RegisterScreen;

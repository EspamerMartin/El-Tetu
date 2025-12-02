import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { useAppDispatch, useAppSelector } from '@/store';
import { register } from '@/store/slices/authSlice';
import { colors, spacing, borderRadius, shadows } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

/**
 * RegisterScreen
 * 
 * Pantalla de registro con diseño de marca El Tetu:
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
    } catch {
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>📝</Text>
          </View>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Completa tus datos para registrarte</Text>
        </View>

        {/* Formulario */}
        <Surface style={styles.formCard}>
          <View style={styles.form}>
            {/* Nombre y Apellido en fila */}
            <View style={styles.row}>
              <TextInput
                label="Nombre *"
                value={formData.nombre}
                onChangeText={(text) => updateField('nombre', text)}
                autoCapitalize="words"
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                left={<TextInput.Icon icon="account" color={colors.textSecondary} />}
              />
              <TextInput
                label="Apellido *"
                value={formData.apellido}
                onChangeText={(text) => updateField('apellido', text)}
                autoCapitalize="words"
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
            </View>

            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="email-outline" color={colors.textSecondary} />}
            />

            <TextInput
              label="Teléfono"
              value={formData.telefono}
              onChangeText={(text) => updateField('telefono', text)}
              keyboardType="phone-pad"
              autoComplete="tel"
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="phone-outline" color={colors.textSecondary} />}
            />

            <TextInput
              label="Dirección"
              value={formData.direccion}
              onChangeText={(text) => updateField('direccion', text)}
              multiline
              numberOfLines={2}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="map-marker-outline" color={colors.textSecondary} />}
            />

            <TextInput
              label="Contraseña *"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="lock-outline" color={colors.textSecondary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  color={colors.textSecondary}
                />
              }
            />
            <HelperText type="info" visible style={styles.helperText}>
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
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="lock-check-outline" color={colors.textSecondary} />}
              error={!passwordsMatch()}
            />
            {!passwordsMatch() && (
              <HelperText type="error" visible>
                Las contraseñas no coinciden
              </HelperText>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <HelperText type="error" visible style={styles.errorText}>
                  {typeof error === 'string' ? error : 'Error al registrarse'}
                </HelperText>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading || !isFormValid()}
              style={styles.registerButton}
              contentStyle={styles.registerButtonContent}
              labelStyle={styles.registerButtonLabel}
            >
              Crear Cuenta
            </Button>
          </View>
        </Surface>

        {/* Link a login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            labelStyle={styles.loginButton}
            compact
          >
            Inicia sesión
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    ...shadows.lg,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  halfInput: {
    flex: 1,
  },
  helperText: {
    marginTop: -spacing.sm,
    marginBottom: spacing.xs,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
  },
  registerButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  registerButtonContent: {
    paddingVertical: spacing.sm,
  },
  registerButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  loginButton: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default RegisterScreen;

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/store';
import { login } from '@/store/slices/authSlice';
import { colors, spacing, borderRadius, shadows } from '@/theme';

/**
 * LoginScreen
 * 
 * Pantalla de inicio de sesión con diseño de marca El Tetu:
 * - Colores púrpura corporativos
 * - Validación de formulario
 * - Manejo de errores
 * 
 * Nota: Los usuarios solo se crean desde el panel de administración.
 */
const LoginScreen = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }

    try {
      await dispatch(login({ email, password })).unwrap();
    } catch {
      // Error mostrado desde el estado de Redux
    }
  };

  const isEmailValid = email.length === 0 || email.includes('@');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🛒</Text>
          </View>
          <Text style={styles.title}>El Tetu</Text>
          <Text style={styles.subtitle}>Tu distribuidora de confianza</Text>
        </View>

        {/* Formulario */}
        <Surface style={styles.formCard}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>
          
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              mode="outlined"
              style={styles.input}
              error={!isEmailValid}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="email-outline" color={colors.textSecondary} />}
            />
            {!isEmailValid && (
              <HelperText type="error" visible>
                Ingresa un email válido
              </HelperText>
            )}

            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
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

            {error && (
              <View style={styles.errorContainer}>
                <HelperText type="error" visible style={styles.errorText}>
                  {typeof error === 'string' ? error : 'Error al iniciar sesión'}
                </HelperText>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading || !email || !password || !isEmailValid}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              labelStyle={styles.loginButtonLabel}
            >
              Iniciar Sesión
            </Button>
          </View>
        </Surface>

        {/* Mensaje informativo */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Para obtener acceso, contacta con el administrador.
          </Text>
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
    justifyContent: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    ...shadows.lg,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
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
  loginButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  loginButtonContent: {
    paddingVertical: spacing.sm,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default LoginScreen;

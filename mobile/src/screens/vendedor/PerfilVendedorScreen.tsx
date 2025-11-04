import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface, Avatar } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { InputField } from '@/components';
import { theme, spacing } from '@/theme';
import { authAPI } from '@/services/api';

const PerfilVendedorScreen = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      await authAPI.updateProfile(formData);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  if (!user) return null;

  const iniciales = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`;

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.headerSurface} elevation={2}>
        <Avatar.Text size={80} label={iniciales} style={styles.avatar} />
        <Text variant="headlineSmall" style={styles.userName}>
          {user.full_name}
        </Text>
        <Text variant="bodyMedium" style={styles.userRole}>
          Vendedor
        </Text>
      </Surface>

      <Surface style={styles.surface} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Información Personal
        </Text>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Email
          </Text>
          <Text variant="bodyLarge">{user.email}</Text>
        </View>

        {editing ? (
          <>
            <InputField
              label="Teléfono"
              value={formData.telefono}
              onChangeText={(text) => setFormData({ ...formData, telefono: text })}
              keyboardType="phone-pad"
            />

            <InputField
              label="Dirección"
              value={formData.direccion}
              onChangeText={(text) => setFormData({ ...formData, direccion: text })}
              multiline
              numberOfLines={2}
            />

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setEditing(false)}
                style={styles.halfButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={styles.halfButton}
              >
                Guardar
              </Button>
            </View>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                Teléfono
              </Text>
              <Text variant="bodyLarge">{user.telefono || 'No especificado'}</Text>
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                Dirección
              </Text>
              <Text variant="bodyLarge">{user.direccion || 'No especificada'}</Text>
            </View>

            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => setEditing(true)}
              style={styles.button}
            >
              Editar Datos
            </Button>
          </>
        )}
      </Surface>

      <Surface style={styles.surface} elevation={1}>
        <Button
          mode="contained"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor={theme.colors.error}
        >
          Cerrar Sesión
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerSurface: {
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.tertiaryContainer,
  },
  avatar: {
    backgroundColor: theme.colors.tertiary,
  },
  userName: {
    fontWeight: 'bold',
    marginTop: spacing.md,
    color: theme.colors.onTertiaryContainer,
  },
  userRole: {
    marginTop: spacing.xs,
    color: theme.colors.onTertiaryContainer,
    opacity: 0.8,
  },
  surface: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.primary,
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  halfButton: {
    flex: 1,
  },
  logoutButton: {
    marginTop: spacing.sm,
  },
});

export default PerfilVendedorScreen;

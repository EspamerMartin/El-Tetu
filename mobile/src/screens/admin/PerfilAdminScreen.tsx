import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout, setUser } from '@/store/slices/authSlice';
import { InputField } from '@/components';
import { theme, spacing, colors } from '@/theme';
import { authAPI } from '@/services/api';

const PerfilAdminScreen = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
  });

  // Recargar datos del usuario al enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const userData = await authAPI.me();
      dispatch(setUser(userData));
      setFormData({
        telefono: userData.telefono || '',
        direccion: userData.direccion || '',
      });
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedUser = await authAPI.updateProfile(formData);
      dispatch(setUser(updatedUser));
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setEditing(false);
      await fetchUserData(); // Recargar datos
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
          {user.rol === 'admin' ? 'Administrador' : user.rol === 'vendedor' ? 'Vendedor' : 'Cliente'}
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
          buttonColor={colors.error}
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
    backgroundColor: colors.backgroundLight,
  },
  headerSurface: {
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.infoContainer,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  userName: {
    fontWeight: 'bold',
    marginTop: spacing.md,
    color: colors.info,
  },
  userRole: {
    marginTop: spacing.xs,
    color: colors.info,
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
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.onSurfaceVariant,
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

export default PerfilAdminScreen;

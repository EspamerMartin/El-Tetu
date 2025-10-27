import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { InputField } from '@/components';
import { theme, spacing } from '@/theme';
import { authAPI } from '@/services/api';

type Props = NativeStackScreenProps<ClienteTabParamList, 'Perfil'>;

/**
 * PerfilScreen
 * 
 * Pantalla de perfil del usuario con:
 * - Datos personales
 * - Opción de cambiar contraseña
 * - Cerrar sesión
 */
const PerfilScreen = ({ navigation }: Props) => {
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

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.surface}>
        <Text variant="headlineSmall" style={styles.title}>
          Mi Perfil
        </Text>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Nombre Completo
          </Text>
          <Text variant="bodyLarge">{user.full_name}</Text>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Email
          </Text>
          <Text variant="bodyLarge">{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Rol
          </Text>
          <Text variant="bodyLarge" style={styles.roleText}>
            {user.rol === 'cliente' ? 'Cliente' : user.rol === 'vendedor' ? 'Vendedor' : 'Administrador'}
          </Text>
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

        <Button
          mode="contained"
          icon="logout"
          onPress={handleLogout}
          style={[styles.button, styles.logoutButton]}
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
  surface: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: theme.colors.primary,
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  roleText: {
    textTransform: 'capitalize',
  },
  button: {
    marginTop: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  halfButton: {
    flex: 1,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
});

export default PerfilScreen;

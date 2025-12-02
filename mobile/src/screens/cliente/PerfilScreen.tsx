import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout, updateProfile } from '@/store/slices/authSlice';
import { InputField, ScreenContainer } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';

type Props = NativeStackScreenProps<ClienteTabParamList, 'Perfil'>;

/**
 * PerfilScreen
 * 
 * Pantalla de perfil del usuario con:
 * - Datos personales
 * - Opción de editar teléfono y dirección
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
      await dispatch(updateProfile(formData)).unwrap();
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error || 'Error al actualizar perfil');
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

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'cliente': return 'Cliente';
      case 'vendedor': return 'Vendedor';
      case 'admin': return 'Administrador';
      default: return rol;
    }
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Avatar y nombre */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.nombre.charAt(0)}{user.apellido.charAt(0)}
            </Text>
          </View>
          <Text style={styles.fullName}>{user.full_name}</Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolText}>{getRolLabel(user.rol)}</Text>
          </View>
        </View>

        <Surface style={styles.surface}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
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
              <View style={styles.infoRow}>
                <Text style={styles.label}>Teléfono</Text>
                <Text style={styles.value}>{user.telefono || 'No especificado'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Dirección</Text>
                <Text style={styles.value}>{user.direccion || 'No especificada'}</Text>
              </View>

              <Button
                mode="outlined"
                icon="pencil"
                onPress={() => setEditing(true)}
                style={styles.editButton}
              >
                Editar Datos
              </Button>
            </>
          )}
        </Surface>

        <Button
          mode="contained"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor={colors.error}
        >
          Cerrar Sesión
        </Button>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  fullName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  rolBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  rolText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  surface: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: colors.text,
  },
  editButton: {
    marginTop: spacing.sm,
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
    borderRadius: borderRadius.md,
  },
});

export default PerfilScreen;

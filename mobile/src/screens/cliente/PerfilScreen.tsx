import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout, updateProfile } from '@/store/slices/authSlice';
import { InputField, ScreenContainer } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';

type Props = NativeStackScreenProps<ClienteTabParamList, 'Perfil'>;

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * PerfilScreen
 * 
 * Pantalla de perfil del usuario con:
 * - Datos personales
 * - Información de ubicación y horarios (para clientes)
 * - Opción de editar teléfono
 * - Cerrar sesión
 */
const PerfilScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    telefono: user?.telefono || '',
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

  // Construir dirección completa
  const getDireccionCompleta = () => {
    const parts = [];
    if (user.calle) parts.push(user.calle);
    if (user.numero) parts.push(user.numero);
    if (user.entre_calles) parts.push(`(entre ${user.entre_calles})`);
    return parts.join(' ') || 'No especificada';
  };

  return (
    <ScreenContainer edges={[]}>
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

        {/* Información Personal */}
        <Surface style={styles.surface}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          {user.cuit_dni && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>CUIT/DNI</Text>
              <Text style={styles.value}>{user.cuit_dni}</Text>
            </View>
          )}

          {editing ? (
            <>
              <InputField
                label="Teléfono"
                value={formData.telefono}
                onChangeText={(text) => setFormData({ ...formData, telefono: text })}
                keyboardType="phone-pad"
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

              <Button
                mode="outlined"
                icon="pencil"
                onPress={() => setEditing(true)}
                style={styles.editButton}
              >
                Editar Teléfono
              </Button>
            </>
          )}
        </Surface>

        {/* Información de Ubicación (solo cliente) */}
        {user.rol === 'cliente' && (
          <Surface style={styles.surface}>
            <Text style={styles.sectionTitle}>Ubicación</Text>

            {user.zona_nombre && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Zona</Text>
                <Text style={styles.value}>{user.zona_nombre}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.value}>{getDireccionCompleta()}</Text>
            </View>

            {user.descripcion_ubicacion && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Descripción</Text>
                <Text style={styles.value}>{user.descripcion_ubicacion}</Text>
              </View>
            )}

            <Text style={styles.infoNote}>
              Para modificar tu ubicación, contacta con el administrador.
            </Text>
          </Surface>
        )}

        {/* Horarios de Atención (solo cliente) */}
        {user.rol === 'cliente' && user.horarios && user.horarios.length > 0 && (
          <Surface style={styles.surface}>
            <Text style={styles.sectionTitle}>Horarios de Atención</Text>

            {DIAS_SEMANA.map((dia, index) => {
              const horariosDia = user.horarios?.filter(h => h.dia_semana === index) || [];
              if (horariosDia.length === 0) return null;
              
              return (
                <View key={index} style={styles.horarioRow}>
                  <Text style={styles.diaText}>{dia}</Text>
                  <View>
                    {horariosDia.map((h, idx) => (
                      <Text key={idx} style={styles.horarioText}>
                        {h.hora_desde} - {h.hora_hasta}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}

            <Text style={styles.infoNote}>
              Para modificar tus horarios, contacta con el administrador.
            </Text>
          </Surface>
        )}

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
    paddingBottom: spacing.xxl,
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
    marginBottom: spacing.md,
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
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  horarioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  diaText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  horarioText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoNote: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default PerfilScreen;

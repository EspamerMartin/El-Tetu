import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Divider, List, Avatar, Chip, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { clientesAPI, pedidosAPI } from '@/services/api';
import { LoadingOverlay, PedidoCard } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { Pedido } from '@/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<AdminStackParamList, 'UsuarioDetalle'>;

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const getRolLabel = (rol: string) => {
  const roles: Record<string, string> = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    cliente: 'Cliente',
  };
  return roles[rol] || rol;
};

const getRolColor = (rol: string) => {
  const roleColors: Record<string, string> = {
    admin: colors.error,
    vendedor: colors.tertiary,
    cliente: colors.primary,
  };
  return roleColors[rol] || colors.primary;
};

const getRolIcon = (rol: string) => {
  const icons: Record<string, string> = {
    admin: 'shield-crown',
    vendedor: 'account-tie',
    cliente: 'account',
  };
  return icons[rol] || 'account';
};

/**
 * UsuarioDetalleScreen
 * 
 * Muestra información completa de un usuario para administradores.
 * Adapta las secciones mostradas según el rol del usuario:
 * - Admin: Datos básicos
 * - Vendedor: Datos básicos + contacto
 * - Cliente: Datos básicos + contacto + ubicación + horarios + pedidos
 */
const UsuarioDetalleScreen = ({ route, navigation }: Props) => {
  const { usuarioId } = route.params;

  const { data: usuario, loading: loadingUsuario, error: errorUsuario, refetch } = useFetch(
    () => clientesAPI.getById(usuarioId)
  );

  // Estado para pedidos (solo se cargan si es cliente)
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  // Cargar pedidos cuando el usuario esté cargado y sea cliente
  useEffect(() => {
    if (usuario && usuario.rol === 'cliente') {
      setLoadingPedidos(true);
      pedidosAPI.getAll({ cliente: usuarioId })
        .then(data => {
          setPedidos(data.results || []);
        })
        .catch(err => {
          console.error('Error cargando pedidos:', err);
          setPedidos([]);
        })
        .finally(() => {
          setLoadingPedidos(false);
        });
    }
  }, [usuario, usuarioId]);

  const loading = loadingUsuario || loadingPedidos;

  const handleDelete = async () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro de eliminar este usuario? Si tiene pedidos asociados, solo se desactivará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clientesAPI.delete(usuarioId);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  if (errorUsuario) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color={colors.error} />
        <Text variant="titleMedium" style={styles.errorText}>
          Error al cargar el usuario
        </Text>
        <Text variant="bodySmall" style={styles.errorSubtext}>{errorUsuario}</Text>
      </View>
    );
  }

  if (loading || !usuario) {
    return <LoadingOverlay visible message="Cargando información del usuario..." />;
  }

  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
  const iniciales = `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`;
  const esCliente = usuario.rol === 'cliente';
  const esVendedor = usuario.rol === 'vendedor';
  const tieneContacto = esCliente || esVendedor;

  // Construir dirección completa
  const getDireccionCompleta = () => {
    const parts = [];
    if (usuario.calle) parts.push(usuario.calle);
    if (usuario.numero) parts.push(usuario.numero);
    if (usuario.entre_calles) parts.push(`(entre ${usuario.entre_calles})`);
    return parts.join(' ') || null;
  };

  const direccionCompleta = getDireccionCompleta();

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header con avatar y datos principales */}
      <Surface style={styles.header} elevation={2}>
        <Avatar.Text 
          label={iniciales} 
          size={80} 
          style={[styles.avatar, { backgroundColor: getRolColor(usuario.rol) }]} 
        />
        <Text variant="headlineSmall" style={styles.nombre}>
          {nombreCompleto}
        </Text>
        <Chip 
          icon={getRolIcon(usuario.rol)}
          style={[styles.rolChip, { backgroundColor: `${getRolColor(usuario.rol)}20` }]}
          textStyle={{ color: getRolColor(usuario.rol) }}
        >
          {getRolLabel(usuario.rol)}
        </Chip>
        <View style={styles.statusRow}>
          <Chip
            icon={usuario.is_active ? 'check-circle' : 'close-circle'}
            style={[
              styles.statusChip,
              { backgroundColor: usuario.is_active ? colors.successLight : colors.errorLight },
            ]}
            textStyle={{ color: usuario.is_active ? colors.success : colors.error }}
          >
            {usuario.is_active ? 'Activo' : 'Inactivo'}
          </Chip>
          {esCliente && usuario.zona_nombre && (
            <Chip icon="map-marker" style={styles.zonaChip}>
              {usuario.zona_nombre}
            </Chip>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={() => navigation.navigate('UsuarioForm', { usuarioId: usuario.id })}
            style={styles.editButton}
          >
            Editar
          </Button>
          <Button
            mode="outlined"
            icon="delete"
            onPress={handleDelete}
            textColor={colors.error}
            style={styles.deleteButton}
          >
            Eliminar
          </Button>
        </View>
      </Surface>

      {/* Información de Cuenta */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Información de Cuenta</Text>
        <Divider style={styles.divider} />
        
        <List.Item
          title="Email"
          description={usuario.email}
          left={(props) => <List.Icon {...props} icon="email" color={colors.primary} />}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDescription}
        />
        <List.Item
          title="Fecha de Registro"
          description={formatFecha(usuario.date_joined)}
          left={(props) => <List.Icon {...props} icon="calendar" color={colors.primary} />}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDescription}
        />
      </Surface>

      {/* Información de Contacto (solo vendedor y cliente) */}
      {tieneContacto && (
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          <Divider style={styles.divider} />
          
          {usuario.telefono ? (
            <List.Item
              title="Teléfono"
              description={usuario.telefono}
              left={(props) => <List.Icon {...props} icon="phone" color={colors.primary} />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          ) : (
            <Text style={styles.emptyFieldText}>Sin teléfono registrado</Text>
          )}
          {usuario.cuit_dni ? (
            <List.Item
              title="CUIT/DNI"
              description={usuario.cuit_dni}
              left={(props) => <List.Icon {...props} icon="card-account-details" color={colors.primary} />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          ) : (
            <Text style={styles.emptyFieldText}>Sin CUIT/DNI registrado</Text>
          )}
        </Surface>
      )}

      {/* Ubicación (solo cliente) */}
      {esCliente && (
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <Divider style={styles.divider} />
          
          {direccionCompleta ? (
            <List.Item
              title="Dirección"
              description={direccionCompleta}
              left={(props) => <List.Icon {...props} icon="map-marker" color={colors.primary} />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          ) : (
            <Text style={styles.emptyFieldText}>Sin dirección registrada</Text>
          )}
          {usuario.descripcion_ubicacion && (
            <List.Item
              title="Descripción de ubicación"
              description={usuario.descripcion_ubicacion}
              left={(props) => <List.Icon {...props} icon="information" color={colors.primary} />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
              descriptionNumberOfLines={3}
            />
          )}
        </Surface>
      )}

      {/* Horarios de Atención (solo cliente) */}
      {esCliente && (
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Horarios de Atención</Text>
          <Divider style={styles.divider} />
          
          {usuario.horarios && usuario.horarios.length > 0 ? (
            <View style={styles.horariosContainer}>
              {DIAS_SEMANA.map((dia, index) => {
                const horariosDia = usuario.horarios?.filter(h => h.dia_semana === index) || [];
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
            </View>
          ) : (
            <Text style={styles.emptyFieldText}>Sin horarios registrados</Text>
          )}
        </Surface>
      )}

      {/* Configuración Comercial (solo cliente con lista asignada) */}
      {esCliente && usuario.lista_precio_nombre && (
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Configuración Comercial</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="Lista de Precios"
            description={usuario.lista_precio_nombre}
            left={(props) => <List.Icon {...props} icon="tag" color={colors.primary} />}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
        </Surface>
      )}

      {/* Estadísticas (solo cliente) */}
      {esCliente && (
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <Divider style={styles.divider} />
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Icon name="package-variant" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{pedidos.length}</Text>
              <Text style={styles.statLabel}>Pedidos</Text>
            </View>
            <View style={styles.statBox}>
              <Icon name="cash-multiple" size={32} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.accent }]}>
                ${(() => {
                  const total = pedidos.reduce((acc, p) => {
                    const num = parseFloat(p.total);
                    return acc + (isNaN(num) ? 0 : num);
                  }, 0);
                  return total.toLocaleString('es-AR', { minimumFractionDigits: 2 });
                })()}
              </Text>
              <Text style={styles.statLabel}>Total Comprado</Text>
            </View>
          </View>
        </Surface>
      )}

      {/* Historial de Pedidos (solo cliente) */}
      {esCliente && (
        <Surface style={[styles.section, styles.lastSection]} elevation={1}>
          <Text style={styles.sectionTitle}>
            Historial de Pedidos ({pedidos.length})
          </Text>
          <Divider style={styles.divider} />
          
          {pedidos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="clipboard-off" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                Este cliente aún no tiene pedidos
              </Text>
            </View>
          ) : (
            <View style={styles.pedidosList}>
              {pedidos.slice(0, 5).map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onPress={() => navigation.navigate('PedidoAdminDetalle', { pedidoId: pedido.id })}
                />
              ))}
              {pedidos.length > 5 && (
                <Text style={styles.moreText}>
                  Y {pedidos.length - 5} pedido(s) más...
                </Text>
              )}
            </View>
          )}
        </Surface>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  nombre: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
    color: colors.text,
  },
  rolChip: {
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  zonaChip: {
    backgroundColor: colors.primarySurface,
  },
  statusChip: {},
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    borderColor: colors.error,
  },
  section: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  lastSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    marginBottom: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  listTitle: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  listDescription: {
    fontSize: 14,
    color: colors.text,
  },
  horariosContainer: {
    marginTop: spacing.xs,
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
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  statBox: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: spacing.xs,
    color: colors.primary,
  },
  statLabel: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  emptyFieldText: {
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  pedidosList: {
    marginTop: spacing.sm,
  },
  moreText: {
    textAlign: 'center',
    marginTop: spacing.md,
    color: colors.primary,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.error,
  },
  errorSubtext: {
    color: colors.textSecondary,
  },
});

export default UsuarioDetalleScreen;


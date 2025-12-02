import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Divider, List, Avatar, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { useFetch } from '@/hooks';
import { clientesAPI, pedidosAPI } from '@/services/api';
import { LoadingOverlay, PedidoCard } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList, 'ClienteDetalle'>;

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * ClienteDetalleScreen
 * 
 * Muestra información detallada de un cliente incluyendo:
 * - Datos personales
 * - Ubicación y zona
 * - Horarios de atención
 * - Historial de pedidos
 */
const ClienteDetalleScreen = ({ route, navigation }: Props) => {
  const { clienteId } = route.params;

  const { data: cliente, loading: loadingCliente, error: errorCliente } = useFetch(
    () => clientesAPI.getById(clienteId)
  );

  const { data: pedidosData, loading: loadingPedidos } = useFetch(
    () => pedidosAPI.getAll({ cliente: clienteId })
  );

  const loading = loadingCliente || loadingPedidos;
  const pedidos = pedidosData?.results || [];

  if (errorCliente) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color={colors.error} />
        <Text variant="titleMedium" style={styles.errorText}>
          Error al cargar el cliente
        </Text>
        <Text variant="bodySmall" style={styles.errorSubtext}>{errorCliente}</Text>
      </View>
    );
  }

  if (loading || !cliente) {
    return <LoadingOverlay visible message="Cargando información del cliente..." />;
  }

  const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`;
  const iniciales = `${cliente.nombre.charAt(0)}${cliente.apellido.charAt(0)}`;

  // Construir dirección completa
  const getDireccionCompleta = () => {
    const parts = [];
    if (cliente.calle) parts.push(cliente.calle);
    if (cliente.numero) parts.push(cliente.numero);
    if (cliente.entre_calles) parts.push(`(entre ${cliente.entre_calles})`);
    return parts.join(' ') || null;
  };

  const direccionCompleta = getDireccionCompleta();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <Avatar.Text label={iniciales} size={80} style={styles.avatar} />
        <Text variant="headlineSmall" style={styles.nombre}>
          {nombreCompleto}
        </Text>
        {cliente.zona_nombre && (
          <Chip icon="map-marker" style={styles.zonaChip}>
            {cliente.zona_nombre}
          </Chip>
        )}
        <Chip
          icon={cliente.is_active ? 'check-circle' : 'close-circle'}
          style={[
            styles.statusChip,
            { backgroundColor: cliente.is_active ? colors.successLight : colors.errorLight },
          ]}
          textStyle={{ color: cliente.is_active ? colors.success : colors.error }}
        >
          {cliente.is_active ? 'Activo' : 'Inactivo'}
        </Chip>
      </Surface>

      {/* Información de Contacto */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Información de Contacto</Text>
        <Divider style={styles.divider} />
        
        <List.Item
          title="Email"
          description={cliente.email}
          left={(props) => <List.Icon {...props} icon="email" color={colors.primary} />}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDescription}
        />
        {cliente.telefono && (
          <List.Item
            title="Teléfono"
            description={cliente.telefono}
            left={(props) => <List.Icon {...props} icon="phone" color={colors.primary} />}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
        )}
        {cliente.cuit_dni && (
          <List.Item
            title="CUIT/DNI"
            description={cliente.cuit_dni}
            left={(props) => <List.Icon {...props} icon="card-account-details" color={colors.primary} />}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
        )}
      </Surface>

      {/* Ubicación */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Ubicación</Text>
        <Divider style={styles.divider} />
        
        {direccionCompleta && (
          <List.Item
            title="Dirección"
            description={direccionCompleta}
            left={(props) => <List.Icon {...props} icon="map-marker" color={colors.primary} />}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
        )}
        {cliente.descripcion_ubicacion && (
          <List.Item
            title="Descripción"
            description={cliente.descripcion_ubicacion}
            left={(props) => <List.Icon {...props} icon="information" color={colors.primary} />}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
            descriptionNumberOfLines={3}
          />
        )}
        {!direccionCompleta && !cliente.descripcion_ubicacion && (
          <Text style={styles.emptyFieldText}>Sin información de ubicación</Text>
        )}
      </Surface>

      {/* Horarios de Atención */}
      {cliente.horarios && cliente.horarios.length > 0 && (
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Horarios de Atención</Text>
          <Divider style={styles.divider} />
          
          <View style={styles.horariosContainer}>
            {DIAS_SEMANA.map((dia, index) => {
              const horariosDia = cliente.horarios?.filter(h => h.dia_semana === index) || [];
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
        </Surface>
      )}

      {/* Lista de Precios */}
      {cliente.lista_precio_nombre && (
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Configuración Comercial</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="Lista de Precios"
            description={cliente.lista_precio_nombre}
            left={(props) => <List.Icon {...props} icon="tag" color={colors.primary} />}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
        </Surface>
      )}

      {/* Estadísticas */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <Divider style={styles.divider} />
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Icon name="package-variant" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{pedidos.length}</Text>
            <Text style={styles.statLabel}>Pedidos Totales</Text>
          </View>
          <View style={styles.statBox}>
            <Icon name="cash-multiple" size={32} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.accent }]}>
              ${(() => {
                const total = pedidos.reduce((acc, p) => {
                  const num = parseFloat(p.total);
                  return acc + (isNaN(num) ? 0 : num);
                }, 0);
                return total.toFixed(2);
              })()}
            </Text>
            <Text style={styles.statLabel}>Total Gastado</Text>
          </View>
        </View>
      </Surface>

      {/* Historial de Pedidos */}
      <Surface style={styles.section} elevation={1}>
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
                onPress={() => navigation.navigate('PedidoDetalle', { pedidoId: pedido.id })}
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
  zonaChip: {
    marginBottom: spacing.xs,
    backgroundColor: colors.primarySurface,
  },
  statusChip: {
    marginTop: spacing.xs,
  },
  section: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
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

export default ClienteDetalleScreen;

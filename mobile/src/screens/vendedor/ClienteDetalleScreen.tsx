import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Divider, List, Avatar, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { useFetch } from '@/hooks';
import { clientesAPI, pedidosAPI } from '@/services/api';
import { LoadingOverlay, PedidoCard } from '@/components';
import { theme, spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList, 'ClienteDetalle'>;

/**
 * ClienteDetalleScreen
 * 
 * Muestra información detallada de un cliente:
 * - Datos personales
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
        <Icon name="alert-circle" size={64} color={theme.colors.error} />
        <Text variant="titleMedium" style={styles.errorText}>
          Error al cargar el cliente
        </Text>
        <Text variant="bodySmall">{errorCliente}</Text>
      </View>
    );
  }

  if (loading || !cliente) {
    return <LoadingOverlay visible message="Cargando información del cliente..." />;
  }

  const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`;
  const iniciales = `${cliente.nombre.charAt(0)}${cliente.apellido.charAt(0)}`;

  return (
    <ScrollView style={styles.container}>
      {/* Header con Avatar */}
      <Surface style={styles.header} elevation={2}>
        <Avatar.Text label={iniciales} size={80} />
        <Text variant="headlineSmall" style={styles.nombre}>
          {nombreCompleto}
        </Text>
        <Chip
          icon={cliente.is_active ? 'check-circle' : 'close-circle'}
          style={[
            styles.statusChip,
            { backgroundColor: cliente.is_active ? theme.colors.tertiaryContainer : theme.colors.errorContainer },
          ]}
        >
          {cliente.is_active ? 'Activo' : 'Inactivo'}
        </Chip>
      </Surface>

      {/* Información Personal */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Información Personal</Text>
        <Divider style={styles.divider} />
        
        <List.Item
          title="Email"
          description={cliente.email}
          left={(props) => <List.Icon {...props} icon="email" />}
        />
        {cliente.telefono && (
          <List.Item
            title="Teléfono"
            description={cliente.telefono}
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
        )}
        {cliente.direccion && (
          <List.Item
            title="Dirección"
            description={cliente.direccion}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
          />
        )}
        {cliente.ciudad && (
          <List.Item
            title="Ciudad"
            description={cliente.ciudad}
            left={(props) => <List.Icon {...props} icon="city" />}
          />
        )}
      </Surface>

      {/* Estadísticas */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Estadísticas</Text>
        <Divider style={styles.divider} />
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Icon name="package-variant" size={32} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.statValue}>{pedidos.length}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Pedidos Totales</Text>
          </View>
          <View style={styles.statBox}>
            <Icon name="cash-multiple" size={32} color={theme.colors.secondary} />
            <Text variant="headlineSmall" style={styles.statValue}>
              ${(() => {
                const total = pedidos.reduce((acc, p) => {
                  const num = parseFloat(p.total);
                  return acc + (isNaN(num) ? 0 : num);
                }, 0);
                return total.toFixed(2);
              })()}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Total Gastado</Text>
          </View>
        </View>
      </Surface>

      {/* Historial de Pedidos */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Historial de Pedidos ({pedidos.length})
        </Text>
        <Divider style={styles.divider} />
        
        {pedidos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-off" size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={styles.emptyText}>
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
              <Text variant="bodySmall" style={styles.moreText}>
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
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  nombre: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  statusChip: {
    marginTop: spacing.xs,
  },
  section: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  divider: {
    marginBottom: spacing.sm,
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
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  statLabel: {
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  pedidosList: {
    marginTop: spacing.sm,
  },
  moreText: {
    textAlign: 'center',
    marginTop: spacing.md,
    color: theme.colors.primary,
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
    color: theme.colors.error,
  },
});

export default ClienteDetalleScreen;

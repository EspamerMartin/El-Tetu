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

/**
 * ClienteDetalleScreen
 * 
 * Muestra información detallada de un cliente
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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <Avatar.Text label={iniciales} size={80} style={styles.avatar} />
        <Text variant="headlineSmall" style={styles.nombre}>
          {nombreCompleto}
        </Text>
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

      {/* Información Personal */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
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
        {cliente.direccion && (
          <List.Item
            title="Dirección"
            description={cliente.direccion}
            left={(props) => <List.Icon {...props} icon="map-marker" color={colors.primary} />}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
        )}
      </Surface>

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
  statusChip: {
    marginTop: spacing.xs,
  },
  section: {
    margin: spacing.md,
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

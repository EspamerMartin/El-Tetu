import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable, Divider, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { useFetch } from '@/hooks';
import { pedidosAPI } from '@/services/api';
import { PedidoItem } from '@/types';
import { LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import { formatPrice, formatDate } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList, 'PedidoDetalle'>;

type EstadoPedido = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO';

/**
 * PedidoDetalleScreen
 * 
 * Muestra el detalle completo de un pedido.
 */
const PedidoDetalleScreen = ({ route, navigation }: Props) => {
  const { pedidoId } = route.params;

  const { data: pedido, loading, error } = useFetch(
    () => pedidosAPI.getById(pedidoId)
  );

  const getEstadoColor = (estado: EstadoPedido): string => {
    switch (estado) {
      case 'PENDIENTE': return theme.colors.secondary;
      case 'CONFIRMADO': return '#2196F3';
      case 'CANCELADO': return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  const getEstadoLabel = (estado: EstadoPedido): string => {
    const labels: Record<EstadoPedido, string> = {
      PENDIENTE: 'Pendiente',
      CONFIRMADO: 'Confirmado',
      CANCELADO: 'Cancelado',
    };
    return labels[estado] || estado;
  };

  // Early returns después de todos los hooks
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color={theme.colors.error} />
        <Text variant="titleMedium" style={styles.errorText}>
          Error al cargar el pedido
        </Text>
        <Text variant="bodySmall">{error}</Text>
      </View>
    );
  }

  if (loading || !pedido) {
    return <LoadingOverlay visible message="Cargando pedido..." />;
  }

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <Text variant="headlineSmall">Pedido #{pedido.id}</Text>
          <Chip
            icon="circle"
            style={{ backgroundColor: getEstadoColor(pedido.estado) }}
            textStyle={{ color: '#FFF' }}
          >
            {getEstadoLabel(pedido.estado)}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={styles.fecha}>
          {formatDate(pedido.fecha_creacion)}
        </Text>
      </Surface>

      {/* Cliente */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Cliente</Text>
        <Divider style={styles.divider} />
        <Text variant="bodyLarge">{pedido.cliente_nombre}</Text>
      </Surface>

      {/* Items */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Productos</Text>
        <Divider style={styles.divider} />
        
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Producto</DataTable.Title>
            <DataTable.Title numeric>Cant.</DataTable.Title>
            <DataTable.Title numeric>Precio</DataTable.Title>
            <DataTable.Title numeric>Subtotal</DataTable.Title>
          </DataTable.Header>

          {pedido.items.map((item: PedidoItem) => {
            const productoNombre = item.producto_nombre || item.producto_detalle?.nombre || 'Producto eliminado';
            return (
              <DataTable.Row key={item.id}>
                <DataTable.Cell>{productoNombre}</DataTable.Cell>
                <DataTable.Cell numeric>{item.cantidad}</DataTable.Cell>
                <DataTable.Cell numeric>{formatPrice(item.precio_unitario)}</DataTable.Cell>
                <DataTable.Cell numeric>{formatPrice(item.subtotal)}</DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>
      </Surface>


      {/* Totales */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Totales</Text>
        <Divider style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text variant="bodyLarge">Subtotal:</Text>
          <Text variant="bodyLarge">{formatPrice(pedido.subtotal)}</Text>
        </View>
        {parseFloat(pedido.descuento_total || '0') > 0 && (
          <View style={styles.totalRow}>
            <Text variant="bodyLarge">Descuento:</Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
              -{formatPrice(pedido.descuento_total)}
            </Text>
          </View>
        )}
        <Divider style={styles.divider} />
        <View style={styles.totalRow}>
          <Text variant="titleLarge" style={styles.totalLabel}>Total:</Text>
          <Text variant="titleLarge" style={styles.totalValue}>{formatPrice(pedido.total)}</Text>
        </View>
      </Surface>

      {/* Notas */}
      {pedido.notas && (
        <Surface style={[styles.section, styles.notasSection]} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Notas</Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium">{pedido.notas}</Text>
        </Surface>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fecha: {
    opacity: 0.7,
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
    marginBottom: spacing.md,
  },
  secondaryText: {
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  // Estilos de promociones eliminados
  _removed_promocionesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Estilo promoChip eliminado (no se usa)
  _removed_promoChip: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  notasSection: {
    backgroundColor: theme.colors.surfaceVariant,
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

export default PedidoDetalleScreen;

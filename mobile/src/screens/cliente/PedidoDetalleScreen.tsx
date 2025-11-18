import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Chip, Divider, DataTable } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteStackParamList } from '@/navigation/ClienteStack';
import { pedidosAPI } from '@/services/api';
import { Pedido } from '@/types';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { theme, spacing, colors, getEstadoColor as getEstadoColorHelper, getColorWithOpacity } from '@/theme';
import { formatPrice, formatDateTime } from '@/utils';

type Props = NativeStackScreenProps<ClienteStackParamList, 'PedidoDetalle'>;

/**
 * PedidoDetalleScreen
 * 
 * Pantalla de detalle de pedido con:
 * - Todos los ítems del pedido
 * - Subtotal, descuentos y total
 * - Estado del pedido
 */
const PedidoDetalleScreen = ({ route }: Props) => {
  const { pedidoId } = route.params;
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPedido();
  }, [pedidoId]);

  const fetchPedido = async () => {
    try {
      setError(null);
      const data = await pedidosAPI.getById(pedidoId);
      setPedido(data);
    } catch (err: any) {
      setError('Error al cargar el pedido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible message="Cargando pedido..." />;
  }

  if (error || !pedido) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error || 'Pedido no encontrado'}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const getEstadoColor = (estado: string) => {
    return getEstadoColorHelper(estado);
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'CONFIRMADO':
        return 'Confirmado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.title}>
              Pedido #{pedido.id}
            </Text>
            <Text variant="bodyMedium" style={styles.date}>
              {formatDateTime(pedido.fecha_creacion)}
            </Text>
          </View>
          <Chip
            style={[
              styles.estadoChip,
              { backgroundColor: getColorWithOpacity(getEstadoColor(pedido.estado), 0.2) },
            ]}
            textStyle={[
              styles.estadoText,
              { color: getEstadoColor(pedido.estado) },
            ]}
          >
            {getEstadoLabel(pedido.estado)}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {/* Cliente Info */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Cliente
          </Text>
          <Text variant="bodyLarge">{pedido.cliente_nombre}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Productos
          </Text>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Producto</DataTable.Title>
              <DataTable.Title numeric>Cant.</DataTable.Title>
              <DataTable.Title numeric>Precio</DataTable.Title>
              <DataTable.Title numeric>Subtotal</DataTable.Title>
            </DataTable.Header>

            {pedido.items.map((item) => (
              <DataTable.Row key={item.id}>
                <DataTable.Cell>
                  {item.producto_detalle?.nombre || item.producto_nombre || 'Producto eliminado'}
                </DataTable.Cell>
                <DataTable.Cell numeric>{item.cantidad}</DataTable.Cell>
                <DataTable.Cell numeric>
                  {formatPrice(item.precio_unitario)}
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  {formatPrice(item.subtotal)}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </View>


        <Divider style={styles.divider} />

        {/* Totales */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text variant="bodyLarge">Subtotal:</Text>
            <Text variant="bodyLarge">{formatPrice(pedido.subtotal)}</Text>
          </View>

          {parseFloat(pedido.descuento_total) > 0 && (
            <View style={styles.totalRow}>
              <Text variant="bodyLarge" style={styles.discountText}>
                Descuento:
              </Text>
              <Text variant="bodyLarge" style={styles.discountText}>
                -{formatPrice(pedido.descuento_total)}
              </Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.totalRow}>
            <Text variant="headlineSmall" style={styles.totalLabel}>
              Total:
            </Text>
            <Text variant="headlineMedium" style={styles.totalPrice}>
              {formatPrice(pedido.total)}
            </Text>
          </View>
        </View>

        {/* Notas */}
        {pedido.notas && (
          <View style={styles.notesSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Notas
            </Text>
            <Text variant="bodyMedium">{pedido.notas}</Text>
          </View>
        )}

        {/* Fechas */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Fechas
          </Text>
          <View style={styles.dateRow}>
            <Text variant="bodyMedium">Creado:</Text>
            <Text variant="bodyMedium">{formatDateTime(pedido.fecha_creacion)}</Text>
          </View>
          {pedido.fecha_confirmacion && (
            <View style={styles.dateRow}>
              <Text variant="bodyMedium">Confirmado:</Text>
              <Text variant="bodyMedium">
                {formatDateTime(pedido.fecha_confirmacion)}
              </Text>
            </View>
          )}
          {pedido.fecha_entrega && (
            <View style={styles.dateRow}>
              <Text variant="bodyMedium">Entregado:</Text>
              <Text variant="bodyMedium">
                {formatDateTime(pedido.fecha_entrega)}
              </Text>
            </View>
          )}
        </View>
      </Surface>
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
  surface: {
    padding: spacing.lg,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  date: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  estadoChip: {
    height: 36,
  },
  estadoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  // Estilo promoChip eliminado (no se usa)
  _removed_promoChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: getColorWithOpacity(colors.success, 0.2),
  },
  totalsSection: {
    marginBottom: spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  discountText: {
    color: colors.success,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalPrice: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  notesSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});

export default PedidoDetalleScreen;

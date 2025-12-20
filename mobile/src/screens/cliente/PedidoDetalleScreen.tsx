import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Chip, Divider, DataTable } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteStackParamList } from '@/navigation/ClienteStack';
import { pedidosAPI } from '@/services/api';
import { Pedido } from '@/types';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';
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

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return { color: colors.warning, bgColor: colors.warningLight, label: 'Pendiente' };
      case 'EN_PREPARACION':
        return { color: colors.info, bgColor: colors.infoLight, label: 'En Preparación' };
      case 'FACTURADO':
        return { color: colors.invoice, bgColor: colors.invoiceLight, label: 'Facturado' };
      case 'ENTREGADO':
        return { color: colors.success, bgColor: colors.successLight, label: 'Entregado' };
      case 'RECHAZADO':
        return { color: colors.error, bgColor: colors.errorLight, label: 'Rechazado' };
      default:
        return { color: colors.textSecondary, bgColor: colors.borderLight, label: estado };
    }
  };

  const estadoConfig = getEstadoConfig(pedido.estado);

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Pedido #{pedido.id}</Text>
              <Text style={styles.date}>{formatDateTime(pedido.fecha_creacion)}</Text>
            </View>
            <Chip
              style={[styles.estadoChip, { backgroundColor: estadoConfig.bgColor }]}
              textStyle={[styles.estadoText, { color: estadoConfig.color }]}
            >
              {estadoConfig.label}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          {/* Cliente Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.clienteName}>{pedido.cliente_nombre}</Text>
          </View>

          {/* Items Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <DataTable>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title textStyle={styles.tableHeaderText}>Producto</DataTable.Title>
                <DataTable.Title numeric textStyle={styles.tableHeaderText}>Cant.</DataTable.Title>
                <DataTable.Title numeric textStyle={styles.tableHeaderText}>Precio</DataTable.Title>
                <DataTable.Title numeric textStyle={styles.tableHeaderText}>Subtotal</DataTable.Title>
              </DataTable.Header>

              {pedido.items.map((item) => (
                <DataTable.Row key={item.id} style={styles.tableRow}>
                  <DataTable.Cell textStyle={styles.tableCellText}>
                    {item.producto_detalle?.nombre || item.producto_nombre || 'Producto eliminado'}
                  </DataTable.Cell>
                  <DataTable.Cell numeric textStyle={styles.tableCellText}>{item.cantidad}</DataTable.Cell>
                  <DataTable.Cell numeric textStyle={styles.tableCellText}>
                    {formatPrice(item.precio_unitario)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric textStyle={styles.tableCellTextBold}>
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
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatPrice(pedido.subtotal)}</Text>
            </View>

            {parseFloat(pedido.descuento_total) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.discountLabel}>Descuento:</Text>
                <Text style={styles.discountValue}>-{formatPrice(pedido.descuento_total)}</Text>
              </View>
            )}

            <View style={styles.totalRowFinal}>
              <Text style={styles.totalFinalLabel}>Total:</Text>
              <Text style={styles.totalFinalValue}>{formatPrice(pedido.total)}</Text>
            </View>
          </View>

          {/* Notas */}
          {pedido.notas && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>📝 Notas</Text>
              <Text style={styles.notesText}>{pedido.notas}</Text>
            </View>
          )}

          {/* Fechas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fechas</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Creado:</Text>
              <Text style={styles.dateValue}>{formatDateTime(pedido.fecha_creacion)}</Text>
            </View>
            {pedido.fecha_confirmacion && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Confirmado:</Text>
                <Text style={styles.dateValue}>{formatDateTime(pedido.fecha_confirmacion)}</Text>
              </View>
            )}
            {pedido.fecha_entrega && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Entregado:</Text>
                <Text style={styles.dateValue}>{formatDateTime(pedido.fecha_entrega)}</Text>
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
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  date: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  estadoChip: {
    height: 32,
    borderRadius: borderRadius.lg,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.md,
    backgroundColor: colors.borderLight,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clienteName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  tableHeader: {
    backgroundColor: colors.primarySurface,
  },
  tableHeaderText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  tableRow: {
    borderBottomColor: colors.borderLight,
  },
  tableCellText: {
    fontSize: 12,
    color: colors.text,
  },
  tableCellTextBold: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  totalsSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  totalValue: {
    color: colors.text,
    fontSize: 14,
  },
  discountLabel: {
    color: colors.success,
    fontSize: 14,
  },
  discountValue: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalFinalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalFinalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  notesSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.sm,
  },
  notesText: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dateLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  dateValue: {
    color: colors.text,
    fontSize: 14,
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

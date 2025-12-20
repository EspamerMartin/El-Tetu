import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface, Chip, Divider, DataTable } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { pedidosAPI } from '@/services/api';
import { Pedido, PedidoItem } from '@/types';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { formatPrice, formatDateTime, formatDate } from '@/utils';

interface PedidoDetalleScreenProps {
  route: { params: { pedidoId: number } };
  navigation: any;
}

/**
 * PedidoDetalleScreen - Pantalla unificada para ver detalle de pedido
 * 
 * Funciona para admin y vendedor con:
 * - Admin: Puede aprobar/rechazar pedidos pendientes
 * - Vendedor: Solo visualización
 * - Ambos: Ven toda la información del pedido
 */
const PedidoDetalleScreen = ({ route, navigation }: PedidoDetalleScreenProps) => {
  const { pedidoId } = route.params;
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.rol === 'admin';
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
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

  const handleAprobar = async () => {
    if (!pedido) return;

    Alert.alert(
      'Aprobar Pedido',
      `¿Confirmar el pedido #${pedido.id}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Aprobar',
          onPress: async () => {
            try {
              setProcessing(true);
              await pedidosAPI.updateEstado(pedido.id, 'EN_PREPARACION');
              Alert.alert('Éxito', 'Pedido aprobado y pasado a preparación');
              await fetchPedido();
            } catch (err: any) {
              const errorMessage = 
                err.response?.data?.error || 
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'No se pudo aprobar el pedido';
              
              console.error('Error al aprobar pedido:', err);
              Alert.alert('Error al aprobar pedido', errorMessage, [{ text: 'OK' }]);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleRechazar = async () => {
    if (!pedido) return;

    Alert.alert(
      'Rechazar Pedido',
      `¿Está seguro que desea rechazar el pedido #${pedido.id}?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              await pedidosAPI.rechazar(pedido.id);
              Alert.alert('Pedido Rechazado', 'El pedido ha sido rechazado');
              await fetchPedido();
            } catch (err: any) {
              const errorMessage = 
                err.response?.data?.error || 
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'No se pudo rechazar el pedido';
              
              console.error('Error al rechazar pedido:', err);
              Alert.alert('Error al rechazar pedido', errorMessage, [{ text: 'OK' }]);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!pedido) return;

    const estadoLabels: Record<string, string> = {
      'FACTURADO': 'facturado',
      'ENTREGADO': 'entregado',
    };

    const label = estadoLabels[nuevoEstado] || nuevoEstado.toLowerCase();

    Alert.alert(
      'Cambiar Estado',
      `¿Marcar el pedido #${pedido.id} como ${label}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setProcessing(true);
              await pedidosAPI.updateEstado(pedido.id, nuevoEstado);
              Alert.alert('Éxito', `Pedido marcado como ${label}`);
              await fetchPedido();
            } catch (err: any) {
              const errorMessage = 
                err.response?.data?.error || 
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'No se pudo actualizar el pedido';
              
              console.error('Error al actualizar pedido:', err);
              Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
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
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            Volver
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return colors.secondary;
      case 'EN_PREPARACION':
        return colors.info;
      case 'FACTURADO':
        return colors.invoice;
      case 'ENTREGADO':
        return colors.success;
      case 'RECHAZADO':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EN_PREPARACION':
        return 'En Preparación';
      case 'FACTURADO':
        return 'Facturado';
      case 'ENTREGADO':
        return 'Entregado';
      case 'RECHAZADO':
        return 'Rechazado';
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
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall" style={styles.title}>
                Pedido #{pedido.id}
              </Text>
              <Text variant="bodyMedium" style={styles.date}>
                {isAdmin ? formatDateTime(pedido.fecha_creacion) : formatDate(pedido.fecha_creacion)}
              </Text>
            </View>
            <Chip
              style={[styles.estadoChip, { backgroundColor: getEstadoColor(pedido.estado) }]}
              textStyle={styles.estadoChipText}
            >
              {getEstadoLabel(pedido.estado)}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          {/* Información del Cliente */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Cliente
            </Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>Nombre:</Text>
              <Text variant="bodyMedium" style={styles.value}>{pedido.cliente_nombre || 'N/A'}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Items del Pedido */}
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

              {pedido.items && pedido.items.map((item: PedidoItem) => {
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
          </View>

          <Divider style={styles.divider} />

          {/* Resumen de Precios */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Resumen
            </Text>
            
            <View style={styles.priceRow}>
              <Text variant="bodyLarge">Subtotal:</Text>
              <Text variant="bodyLarge">{formatPrice(pedido.subtotal)}</Text>
            </View>

            {parseFloat(pedido.descuento_total) > 0 && (
              <View style={styles.priceRow}>
                <Text variant="bodyLarge" style={styles.discountText}>Descuento:</Text>
                <Text variant="bodyLarge" style={styles.discountText}>
                  -{formatPrice(pedido.descuento_total)}
                </Text>
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.priceRow}>
              <Text variant="headlineSmall" style={styles.totalLabel}>Total:</Text>
              <Text variant="headlineSmall" style={styles.totalValue}>
                {formatPrice(pedido.total)}
              </Text>
            </View>
          </View>

          {/* Notas */}
          {pedido.notas && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Notas</Text>
                <Text variant="bodyMedium">{pedido.notas}</Text>
              </View>
            </>
          )}

          {/* Botones de Acción (Solo Admin) */}
          {isAdmin && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.actionsSection}>
                {pedido.estado === 'PENDIENTE' && (
                  <>
                    <Button
                      mode="contained"
                      onPress={handleAprobar}
                      disabled={processing}
                      loading={processing}
                      style={styles.aprobarButton}
                      icon="check-circle"
                    >
                      Aprobar Pedido
                    </Button>

                    <Button
                      mode="contained"
                      onPress={handleRechazar}
                      disabled={processing}
                      loading={processing}
                      style={styles.rechazarButton}
                      buttonColor={colors.error}
                      icon="close-circle"
                    >
                      Rechazar Pedido
                    </Button>
                  </>
                )}

                {pedido.estado === 'EN_PREPARACION' && (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => handleCambiarEstado('FACTURADO')}
                      disabled={processing}
                      loading={processing}
                      style={[styles.aprobarButton, { backgroundColor: colors.invoice }]}
                      icon="file-document-outline"
                    >
                      Marcar como Facturado
                    </Button>

                    <Button
                      mode="contained"
                      onPress={handleRechazar}
                      disabled={processing}
                      loading={processing}
                      style={styles.rechazarButton}
                      buttonColor={colors.error}
                      icon="close-circle"
                    >
                      Rechazar Pedido
                    </Button>
                  </>
                )}

                {pedido.estado === 'FACTURADO' && (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => handleCambiarEstado('ENTREGADO')}
                      disabled={processing}
                      loading={processing}
                      style={[styles.aprobarButton, { backgroundColor: colors.success }]}
                      icon="truck-check"
                    >
                      Marcar como Entregado
                    </Button>

                    <Button
                      mode="contained"
                      onPress={handleRechazar}
                      disabled={processing}
                      loading={processing}
                      style={styles.rechazarButton}
                      buttonColor={colors.error}
                      icon="close-circle"
                    >
                      Rechazar Pedido
                    </Button>
                  </>
                )}

                {(pedido.estado === 'ENTREGADO' || pedido.estado === 'RECHAZADO') && (
                  <View style={styles.estadoInfo}>
                    <Text variant="bodyLarge" style={styles.estadoInfoText}>
                      Este pedido está {getEstadoLabel(pedido.estado).toLowerCase()}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </Surface>
      </ScrollView>
      <LoadingOverlay visible={processing} message="Procesando..." />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  date: {
    color: colors.onSurfaceVariant,
  },
  estadoChip: {
    marginLeft: spacing.sm,
  },
  estadoChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  label: {
    fontWeight: 'bold',
    width: 80,
    color: colors.onSurfaceVariant,
  },
  value: {
    flex: 1,
    color: colors.onSurface,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  discountText: {
    color: colors.tertiary,
  },
  totalLabel: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalValue: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionsSection: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  aprobarButton: {
    backgroundColor: colors.tertiary,
  },
  rechazarButton: {
    // buttonColor prop se usa en el componente
  },
  estadoInfo: {
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    alignItems: 'center',
  },
  estadoInfoText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default PedidoDetalleScreen;


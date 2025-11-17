import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface, Chip, Divider, DataTable } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { pedidosAPI } from '@/services/api';
import { Pedido } from '@/types';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { theme, spacing } from '@/theme';
import { formatPrice, formatDateTime } from '@/utils';

type Props = NativeStackScreenProps<AdminStackParamList, 'PedidoAdminDetalle'>;

/**
 * PedidoAdminDetalleScreen
 * 
 * Pantalla de detalle de pedido para administrador con opciones de:
 * - Ver todos los detalles del pedido
 * - Aprobar pedido (cambiar estado a CONFIRMADO)
 * - Eliminar pedido
 */
const PedidoAdminDetalleScreen = ({ route, navigation }: Props) => {
  const { pedidoId } = route.params;
  
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
              await pedidosAPI.updateEstado(pedido.id, 'CONFIRMADO');
              Alert.alert('Éxito', 'Pedido aprobado correctamente');
              await fetchPedido();
            } catch (err: any) {
              // Extraer mensaje de error del backend
              const errorMessage = 
                err.response?.data?.error || 
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'No se pudo aprobar el pedido';
              
              console.error('Error al aprobar pedido:', err);
              console.error('Error response:', err.response?.data);
              
              Alert.alert(
                'Error al aprobar pedido',
                errorMessage,
                [{ text: 'OK' }]
              );
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
      `¿Está seguro que desea rechazar el pedido #${pedido.id}? El pedido quedará marcado como cancelado.`,
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
              Alert.alert('Pedido Rechazado', 'El pedido ha sido rechazado y marcado como cancelado');
              await fetchPedido();
            } catch (err: any) {
              // Extraer mensaje de error del backend
              const errorMessage = 
                err.response?.data?.error || 
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'No se pudo rechazar el pedido';
              
              console.error('Error al rechazar pedido:', err);
              console.error('Error response:', err.response?.data);
              
              Alert.alert(
                'Error al rechazar pedido',
                errorMessage,
                [{ text: 'OK' }]
              );
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
        return theme.colors.secondary;
      case 'CONFIRMADO':
        return '#2196F3';
      case 'CANCELADO':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
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
          <View style={styles.headerInfo}>
            <Text variant="headlineSmall" style={styles.title}>
              Pedido #{pedido.id}
            </Text>
            <Text variant="bodyMedium" style={styles.date}>
              {formatDateTime(pedido.fecha_creacion)}
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

            {pedido.items && pedido.items.map((item) => (
              <DataTable.Row key={item.id}>
                <DataTable.Cell>{item.producto_detalle?.nombre || 'Producto'}</DataTable.Cell>
                <DataTable.Cell numeric>{item.cantidad}</DataTable.Cell>
                <DataTable.Cell numeric>{formatPrice(item.precio_unitario)}</DataTable.Cell>
                <DataTable.Cell numeric>{formatPrice(item.subtotal)}</DataTable.Cell>
              </DataTable.Row>
            ))}
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


        <Divider style={styles.divider} />

        {/* Botones de Acción */}
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
                buttonColor={theme.colors.error}
                icon="close-circle"
              >
                Rechazar Pedido
              </Button>
            </>
          )}

          {pedido.estado !== 'PENDIENTE' && (
            <View style={styles.estadoInfo}>
              <Text variant="bodyLarge" style={styles.estadoInfoText}>
                Este pedido ya ha sido procesado ({getEstadoLabel(pedido.estado)})
              </Text>
            </View>
          )}
        </View>
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
    backgroundColor: theme.colors.surface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: theme.colors.error,
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
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  date: {
    color: theme.colors.onSurfaceVariant,
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
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  label: {
    fontWeight: 'bold',
    width: 80,
    color: theme.colors.onSurfaceVariant,
  },
  value: {
    flex: 1,
    color: theme.colors.onSurface,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  discountText: {
    color: theme.colors.tertiary,
  },
  totalLabel: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  totalValue: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  // Estilo promoChip eliminado (no se usa)
  _removed_promoChip: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  actionsSection: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  aprobarButton: {
    backgroundColor: theme.colors.tertiary,
  },
  rechazarButton: {
    // buttonColor prop se usa en el componente
  },
  estadoInfo: {
    padding: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    alignItems: 'center',
  },
  estadoInfoText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default PedidoAdminDetalleScreen;

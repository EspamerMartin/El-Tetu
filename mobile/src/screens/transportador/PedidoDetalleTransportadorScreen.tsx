import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Button, Surface, Chip, Divider, DataTable } from 'react-native-paper';
import { pedidosTransportadorAPI } from '@/services/api';
import { PedidoTransportador, PedidoItem, HorarioCliente } from '@/types';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { formatPrice, formatDateTime } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PedidoDetalleTransportadorScreenProps {
  route: { params: { pedidoId: number } };
  navigation: any;
}

/**
 * PedidoDetalleTransportadorScreen
 * 
 * Pantalla de detalle de pedido para el transportador.
 * Muestra información completa del cliente, dirección, horarios y productos.
 * Permite marcar el pedido como entregado.
 */
const PedidoDetalleTransportadorScreen = ({ 
  route, 
  navigation 
}: PedidoDetalleTransportadorScreenProps) => {
  const { pedidoId } = route.params;
  
  const [pedido, setPedido] = useState<PedidoTransportador | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPedido();
  }, [pedidoId]);

  const fetchPedido = async () => {
    try {
      setError(null);
      const data = await pedidosTransportadorAPI.getById(pedidoId);
      setPedido(data);
    } catch (err: any) {
      setError('Error al cargar el pedido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEntregar = async () => {
    if (!pedido) return;

    Alert.alert(
      'Confirmar Entrega',
      `¿Confirmar que el pedido #${pedido.id} fue entregado a ${pedido.cliente_nombre}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar Entrega',
          onPress: async () => {
            try {
              setProcessing(true);
              await pedidosTransportadorAPI.entregar(pedido.id);
              Alert.alert(
                '¡Entrega Confirmada!',
                'El pedido ha sido marcado como entregado.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (err: any) {
              const errorMessage = 
                err.response?.data?.error || 
                err.response?.data?.message ||
                err.message ||
                'No se pudo confirmar la entrega';
              
              console.error('Error al entregar pedido:', err);
              Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleLlamarCliente = () => {
    if (pedido?.cliente_info?.telefono) {
      Linking.openURL(`tel:${pedido.cliente_info.telefono}`);
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
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            Volver
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  const clienteInfo = pedido.cliente_info;
  
  // Construir dirección completa
  const direccionCompleta = [
    clienteInfo?.calle,
    clienteInfo?.numero,
    clienteInfo?.entre_calles ? `(entre ${clienteInfo.entre_calles})` : null,
  ].filter(Boolean).join(' ');

  // Nombres de días de la semana
  const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'FACTURADO':
        return colors.invoice;
      case 'ENTREGADO':
        return colors.success;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'FACTURADO':
        return 'Listo para Entregar';
      case 'ENTREGADO':
        return 'Entregado';
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
              <Icon name="account" size={20} color={colors.primary} /> Cliente
            </Text>
            
            <View style={styles.clienteCard}>
              <Text variant="titleMedium" style={styles.clienteNombre}>
                {clienteInfo?.full_name || pedido.cliente_nombre}
              </Text>
              
              {clienteInfo?.telefono && (
                <View style={styles.infoRow}>
                  <Icon name="phone" size={18} color={colors.primary} />
                  <Text 
                    variant="bodyMedium" 
                    style={styles.phoneLink}
                    onPress={handleLlamarCliente}
                  >
                    {clienteInfo.telefono}
                  </Text>
                  <Button
                    mode="text"
                    compact
                    onPress={handleLlamarCliente}
                    icon="phone"
                  >
                    Llamar
                  </Button>
                </View>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Dirección de Entrega */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              <Icon name="map-marker" size={20} color={colors.primary} /> Dirección de Entrega
            </Text>
            
            <View style={styles.direccionCard}>
              {direccionCompleta && (
                <Text variant="bodyLarge" style={styles.direccionPrincipal}>
                  {direccionCompleta}
                </Text>
              )}
              
              {clienteInfo?.zona_nombre && (
                <View style={styles.infoRow}>
                  <Icon name="map" size={16} color={colors.textSecondary} />
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    Zona: {clienteInfo.zona_nombre}
                  </Text>
                </View>
              )}
              
              {clienteInfo?.descripcion_ubicacion && (
                <View style={styles.descripcionUbicacion}>
                  <Icon name="information" size={16} color={colors.info} />
                  <Text variant="bodySmall" style={styles.descripcionText}>
                    {clienteInfo.descripcion_ubicacion}
                  </Text>
                </View>
              )}
              
              {clienteInfo?.direccion && !direccionCompleta && (
                <Text variant="bodyMedium">{clienteInfo.direccion}</Text>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Horarios de Atención */}
          {clienteInfo?.horarios && clienteInfo.horarios.length > 0 && (
            <>
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  <Icon name="clock-outline" size={20} color={colors.primary} /> Horarios de Atención
                </Text>
                
                <View style={styles.horariosContainer}>
                  {clienteInfo.horarios.map((horario: HorarioCliente, index: number) => (
                    <View key={index} style={styles.horarioRow}>
                      <Text variant="bodyMedium" style={styles.horarioDia}>
                        {DIAS_SEMANA[horario.dia_semana]}
                      </Text>
                      <Text variant="bodyMedium" style={styles.horarioHoras}>
                        {horario.hora_desde} - {horario.hora_hasta}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <Divider style={styles.divider} />
            </>
          )}

          {/* Items del Pedido */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              <Icon name="package-variant" size={20} color={colors.primary} /> Productos
            </Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Producto</DataTable.Title>
                <DataTable.Title numeric>Cant.</DataTable.Title>
                <DataTable.Title numeric>Subtotal</DataTable.Title>
              </DataTable.Header>

              {pedido.items && pedido.items.map((item: PedidoItem) => {
                const productoNombre = item.producto_nombre || item.producto_detalle?.nombre || 'Producto';
                return (
                  <DataTable.Row key={item.id}>
                    <DataTable.Cell>{productoNombre}</DataTable.Cell>
                    <DataTable.Cell numeric>{item.cantidad}</DataTable.Cell>
                    <DataTable.Cell numeric>{formatPrice(item.subtotal)}</DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          </View>

          <Divider style={styles.divider} />

          {/* Resumen de Precios */}
          <View style={styles.section}>
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
              <Text variant="headlineSmall" style={styles.totalLabel}>Total a Cobrar:</Text>
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
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  <Icon name="note-text" size={20} color={colors.primary} /> Notas
                </Text>
                <Text variant="bodyMedium">{pedido.notas}</Text>
              </View>
            </>
          )}

          {/* Botón de Entregar */}
          {pedido.estado === 'FACTURADO' && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.actionsSection}>
                <Button
                  mode="contained"
                  onPress={handleEntregar}
                  disabled={processing}
                  loading={processing}
                  style={styles.entregarButton}
                  icon="truck-check"
                  contentStyle={styles.entregarButtonContent}
                >
                  Confirmar Entrega
                </Button>
              </View>
            </>
          )}

          {pedido.estado === 'ENTREGADO' && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.entregadoInfo}>
                <Icon name="check-circle" size={24} color={colors.success} />
                <Text variant="bodyLarge" style={styles.entregadoText}>
                  Pedido entregado
                </Text>
                {pedido.fecha_entrega && (
                  <Text variant="bodySmall" style={styles.entregadoFecha}>
                    {formatDateTime(pedido.fecha_entrega)}
                  </Text>
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
    paddingBottom: spacing.xxl,
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
  clienteCard: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  clienteNombre: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  infoValue: {
    color: colors.text,
    flex: 1,
  },
  phoneLink: {
    color: colors.primary,
    flex: 1,
  },
  direccionCard: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  direccionPrincipal: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  descripcionUbicacion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.infoLight,
    padding: spacing.sm,
    borderRadius: borderRadius.xs,
  },
  descripcionText: {
    flex: 1,
    color: colors.info,
  },
  horariosContainer: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  horarioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  horarioDia: {
    fontWeight: '600',
    color: colors.text,
  },
  horarioHoras: {
    color: colors.primary,
    fontWeight: '500',
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
    color: colors.success,
  },
  actionsSection: {
    marginTop: spacing.md,
  },
  entregarButton: {
    backgroundColor: colors.success,
  },
  entregarButtonContent: {
    paddingVertical: spacing.sm,
  },
  entregadoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
  },
  entregadoText: {
    color: colors.success,
    fontWeight: '600',
  },
  entregadoFecha: {
    color: colors.success,
  },
});

export default PedidoDetalleTransportadorScreen;


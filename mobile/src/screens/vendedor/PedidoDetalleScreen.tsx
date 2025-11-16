import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, DataTable, Divider, Chip, Button, Menu } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { useFetch } from '@/hooks';
import { pedidosAPI } from '@/services/api';
import { LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import { formatPrice, formatDate } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList, 'PedidoDetalle'>;

type EstadoPedido = 'PENDIENTE' | 'CONFIRMADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

/**
 * PedidoDetalleScreen
 * 
 * Muestra el detalle completo de un pedido y permite cambiar su estado.
 */
const PedidoDetalleScreen = ({ route, navigation }: Props) => {
  const { pedidoId } = route.params;
  const [updating, setUpdating] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: pedido, loading, error, refetch } = useFetch(
    () => pedidosAPI.getById(pedidoId)
  );

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

  const getEstadoColor = (estado: EstadoPedido): string => {
    switch (estado) {
      case 'PENDIENTE': return theme.colors.secondary;
      case 'CONFIRMADO': return '#2196F3';
      case 'EN_CAMINO': return '#FF9800';
      case 'ENTREGADO': return theme.colors.tertiary;
      case 'CANCELADO': return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  const getEstadoLabel = (estado: EstadoPedido): string => {
    const labels: Record<EstadoPedido, string> = {
      PENDIENTE: 'En preparación',
      CONFIRMADO: 'Confirmado',
      EN_CAMINO: 'Enviado',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
    };
    return labels[estado] || estado;
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenMenu = useCallback(() => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    menuTimeoutRef.current = setTimeout(() => {
      setMenuVisible(true);
      menuTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleCloseMenu = useCallback(() => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setMenuVisible(false);
  }, []);

  const handleUpdateEstado = async (nuevoEstado: EstadoPedido) => {
    try {
      setUpdating(true);
      setMenuVisible(false);
      await pedidosAPI.updateEstado(pedido.id, nuevoEstado);
      Alert.alert('Éxito', `Estado actualizado a "${getEstadoLabel(nuevoEstado)}"`);
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'No se pudo actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const estadosDisponibles: EstadoPedido[] = ['PENDIENTE', 'CONFIRMADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'];

  return (
    <ScrollView style={styles.container}>
      {updating && <LoadingOverlay visible message="Actualizando estado..." />}

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
          {formatDate(pedido.fecha_pedido)}
        </Text>
      </Surface>

      {/* Cliente */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Cliente</Text>
        <Divider style={styles.divider} />
        <Text variant="bodyLarge">{pedido.cliente.nombre_completo}</Text>
        <Text variant="bodyMedium" style={styles.secondaryText}>{pedido.cliente.email}</Text>
        {pedido.cliente.telefono && (
          <Text variant="bodyMedium" style={styles.secondaryText}>{pedido.cliente.telefono}</Text>
        )}
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

          {pedido.items.map((item: any) => (
            <DataTable.Row key={item.id}>
              <DataTable.Cell>{item.producto.nombre}</DataTable.Cell>
              <DataTable.Cell numeric>{item.cantidad}</DataTable.Cell>
              <DataTable.Cell numeric>{formatPrice(item.precio_unitario)}</DataTable.Cell>
              <DataTable.Cell numeric>{formatPrice(item.subtotal)}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Surface>

      {/* Promociones */}
      {pedido.promociones_aplicadas && pedido.promociones_aplicadas.length > 0 && (
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Promociones Aplicadas</Text>
          <Divider style={styles.divider} />
          <View style={styles.promocionesContainer}>
            {pedido.promociones_aplicadas.map((promo: any) => (
              <Chip key={promo.id} icon="gift" style={styles.promoChip}>
                {promo.nombre}
              </Chip>
            ))}
          </View>
        </Surface>
      )}

      {/* Totales */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Totales</Text>
        <Divider style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text variant="bodyLarge">Subtotal:</Text>
          <Text variant="bodyLarge">{formatPrice(pedido.subtotal)}</Text>
        </View>
        {parseFloat(pedido.descuento) > 0 && (
          <View style={styles.totalRow}>
            <Text variant="bodyLarge">Descuento:</Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
              -{formatPrice(pedido.descuento)}
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

      {/* Cambiar Estado */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Cambiar Estado</Text>
        <Divider style={styles.divider} />
        
        <Menu
          visible={menuVisible}
          onDismiss={handleCloseMenu}
          anchor={
            <Button
              mode="contained"
              icon="swap-horizontal"
              onPress={handleOpenMenu}
              disabled={pedido.estado === 'ENTREGADO' || pedido.estado === 'CANCELADO'}
            >
              Cambiar a...
            </Button>
          }
        >
          {estadosDisponibles
            .filter(e => e !== pedido.estado)
            .map((estado) => (
              <Menu.Item
                key={estado}
                onPress={() => handleUpdateEstado(estado)}
                title={getEstadoLabel(estado)}
                leadingIcon="circle"
              />
            ))}
        </Menu>
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
  promocionesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  promoChip: {
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

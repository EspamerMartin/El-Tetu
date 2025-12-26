import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, IconButton, Divider, Surface, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  removeFromCart,
  removePromocionFromCart,
  updateQuantity,
  updatePromocionQuantity,
  clearCart
} from '@/store/slices/cartSlice';
import { pedidosAPI } from '@/services/api';
import { CartItem, CreatePedidoItemData } from '@/types';
import { LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<ClienteTabParamList, 'Carrito'>;

/**
 * CarritoScreen
 * 
 * Pantalla del carrito de compras con:
 * - Lista de productos agregados
 * - Control de cantidades
 * - Cálculo de totales
 * - Botón de realizar pedido
 */
const CarritoScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((acc, item) => {
    let precio = 0;
    if (item.tipo === 'producto' && item.producto) {
      precio = parseFloat(item.producto.precio);
    } else if (item.tipo === 'promocion' && item.promocion) {
      precio = parseFloat(item.promocion.precio);
    }
    if (isNaN(precio)) return acc;
    return acc + (precio * item.cantidad);
  }, 0);

  const total = subtotal;

  // Handlers para productos
  const handleIncrement = (productoId: number, currentQty: number) => {
    if (currentQty < 99) {
      dispatch(updateQuantity({ productoId, cantidad: currentQty + 1 }));
    }
  };

  const handleDecrement = (productoId: number, currentQty: number) => {
    if (currentQty > 1) {
      dispatch(updateQuantity({ productoId, cantidad: currentQty - 1 }));
    }
  };

  const handleRemove = (productoId: number, nombre: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Deseas eliminar "${nombre}" del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => dispatch(removeFromCart(productoId)),
        },
      ]
    );
  };

  // Handlers para promociones
  const handlePromocionIncrement = (promocionId: number, currentQty: number) => {
    if (currentQty < 99) {
      dispatch(updatePromocionQuantity({ promocionId, cantidad: currentQty + 1 }));
    }
  };

  const handlePromocionDecrement = (promocionId: number, currentQty: number) => {
    if (currentQty > 1) {
      dispatch(updatePromocionQuantity({ promocionId, cantidad: currentQty - 1 }));
    }
  };

  const handlePromocionRemove = (promocionId: number, nombre: string) => {
    Alert.alert(
      'Eliminar promoción',
      `¿Deseas eliminar "${nombre}" del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => dispatch(removePromocionFromCart(promocionId)),
        },
      ]
    );
  };

  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos antes de realizar un pedido');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para realizar un pedido');
      return;
    }

    try {
      setLoading(true);

      // Construir items para el pedido (productos y promociones)
      const pedidoItems: CreatePedidoItemData[] = items.map((item) => {
        if (item.tipo === 'producto' && item.producto) {
          return {
            producto: item.producto.id,
            cantidad: item.cantidad,
          };
        } else if (item.tipo === 'promocion' && item.promocion) {
          return {
            promocion: item.promocion.id,
            cantidad: item.cantidad,
          };
        }
        // Fallback (no debería ocurrir)
        return { cantidad: item.cantidad };
      });

      const pedidoData = {
        cliente: user.id,
        lista_precio: user.lista_precio || 1,
        items: pedidoItems,
      };

      const pedido = await pedidosAPI.create(pedidoData);
      dispatch(clearCart());

      Alert.alert(
        'Pedido realizado',
        `Tu pedido #${pedido?.id || 'N/A'} ha sido creado exitosamente`,
        [
          {
            text: 'Ver pedidos',
            onPress: () => navigation.navigate('MisPedidos'),
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || error.response?.data?.detail
        || 'Error al crear el pedido';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    // Item de PRODUCTO
    if (item.tipo === 'producto' && item.producto) {
      const precio = parseFloat(item.producto.precio);
      if (isNaN(precio)) return null;
      const subtotalItem = precio * item.cantidad;

      return (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <Text variant="titleMedium" style={styles.itemNombre}>
                  {item.producto.nombre}
                </Text>
                <Text variant="bodySmall" style={styles.itemCodigo}>
                  Código: {item.producto.codigo_barra}
                </Text>
                <Text variant="titleMedium" style={styles.itemPrecio}>
                  {formatPrice(precio)} c/u
                </Text>
              </View>
              <IconButton
                icon="delete"
                size={20}
                iconColor={colors.error}
                onPress={() => handleRemove(item.producto!.id, item.producto!.nombre)}
              />
            </View>

            <View style={styles.quantityContainer}>
              <Text variant="bodyMedium" style={styles.quantityLabel}>Cantidad:</Text>
              <View style={styles.quantityControls}>
                <IconButton
                  icon="minus"
                  size={20}
                  onPress={() => handleDecrement(item.producto!.id, item.cantidad)}
                  disabled={item.cantidad <= 1}
                  iconColor={colors.error}
                  style={styles.quantityButton}
                />
                <Surface style={styles.quantityBox}>
                  <Text variant="titleMedium" style={styles.quantityText}>{item.cantidad}</Text>
                </Surface>
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={() => handleIncrement(item.producto!.id, item.cantidad)}
                  disabled={item.cantidad >= 99}
                  iconColor={colors.primary}
                  style={styles.quantityButton}
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.subtotalRow}>
              <Text variant="bodyMedium" style={styles.subtotalLabel}>Subtotal:</Text>
              <Text variant="titleMedium" style={styles.subtotalPrice}>
                {formatPrice(subtotalItem)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    // Item de PROMOCIÓN
    if (item.tipo === 'promocion' && item.promocion) {
      const precio = parseFloat(item.promocion.precio);
      if (isNaN(precio)) return null;
      const subtotalItem = precio * item.cantidad;

      return (
        <Card style={[styles.card, styles.promoCard]} mode="elevated">
          <Card.Content>
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <View style={styles.promoHeader}>
                  <Chip
                    icon="fire"
                    style={styles.promoBadge}
                    textStyle={styles.promoBadgeText}
                    compact
                  >
                    PROMO
                  </Chip>
                </View>
                <Text variant="titleMedium" style={styles.itemNombre}>
                  {item.promocion.nombre}
                </Text>
                {item.promocion.descripcion && (
                  <Text variant="bodySmall" style={styles.itemDescripcion} numberOfLines={2}>
                    {item.promocion.descripcion}
                  </Text>
                )}
                <Text variant="bodySmall" style={styles.promoItemsCount}>
                  {item.promocion.items_count} productos incluidos
                </Text>
                <Text variant="titleMedium" style={styles.itemPrecioPromo}>
                  {formatPrice(precio)} c/u
                </Text>
              </View>
              <IconButton
                icon="delete"
                size={20}
                iconColor={colors.error}
                onPress={() => handlePromocionRemove(item.promocion!.id, item.promocion!.nombre)}
              />
            </View>

            <View style={styles.quantityContainer}>
              <Text variant="bodyMedium" style={styles.quantityLabel}>Cantidad:</Text>
              <View style={styles.quantityControls}>
                <IconButton
                  icon="minus"
                  size={20}
                  onPress={() => handlePromocionDecrement(item.promocion!.id, item.cantidad)}
                  disabled={item.cantidad <= 1}
                  iconColor={colors.error}
                  style={styles.quantityButton}
                />
                <Surface style={styles.quantityBox}>
                  <Text variant="titleMedium" style={styles.quantityText}>{item.cantidad}</Text>
                </Surface>
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={() => handlePromocionIncrement(item.promocion!.id, item.cantidad)}
                  disabled={item.cantidad >= 99}
                  iconColor={colors.primary}
                  style={styles.quantityButton}
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.subtotalRow}>
              <Text variant="bodyMedium" style={styles.subtotalLabel}>Subtotal:</Text>
              <Text variant="titleMedium" style={styles.subtotalPricePromo}>
                {formatPrice(subtotalItem)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    return null;
  };

  if (loading) {
    return <LoadingOverlay visible message="Procesando pedido..." />;
  }

  if (items.length === 0) {
    return (
      <ScreenContainer edges={[]}>
        <EmptyState
          icon="cart-off"
          title="Carrito vacío"
          message="Agrega productos desde el catálogo"
          actionLabel="Ir al catálogo"
          onAction={() => navigation.navigate('Catalogo')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={[]}>
      <View style={styles.content}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => {
            if (item.tipo === 'producto' && item.producto) {
              return `producto-${item.producto.id}`;
            }
            if (item.tipo === 'promocion' && item.promocion) {
              return `promocion-${item.promocion.id}`;
            }
            return `item-${Math.random()}`;
          }}
          contentContainerStyle={styles.list}
        />

        <Surface style={styles.totalsContainer} elevation={4}>
          <View style={styles.totalRow}>
            <Text variant="bodyMedium" style={styles.totalRowLabel}>Subtotal:</Text>
            <Text variant="bodyMedium" style={styles.totalRowValue}>{formatPrice(subtotal)}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.totalRow}>
            <Text variant="titleLarge" style={styles.totalLabel}>
              Total:
            </Text>
            <Text variant="titleLarge" style={styles.totalPrice}>
              {formatPrice(total)}
            </Text>
          </View>

          <Button
            mode="contained"
            icon="check"
            onPress={handleConfirmOrder}
            style={styles.confirmButton}
            contentStyle={styles.confirmButtonContent}
          >
            Confirmar Pedido
          </Button>
        </Surface>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  promoCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.promo,
  },
  promoHeader: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  promoBadge: {
    backgroundColor: colors.promo,
  },
  promoBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemDescripcion: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  promoItemsCount: {
    color: colors.promo,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  itemPrecioPromo: {
    color: colors.promo,
    fontWeight: 'bold',
  },
  subtotalPricePromo: {
    fontWeight: '600',
    color: colors.promo,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontWeight: '600',
    color: colors.text,
  },
  itemCodigo: {
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  itemPrecio: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  quantityLabel: {
    color: colors.textSecondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    margin: 0,
  },
  quantityBox: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySurface,
    ...shadows.sm,
  },
  quantityText: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtotalLabel: {
    color: colors.textSecondary,
  },
  subtotalPrice: {
    fontWeight: '600',
    color: colors.text,
  },
  totalsContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  totalRowLabel: {
    color: colors.textSecondary,
  },
  totalRowValue: {
    color: colors.text,
    fontWeight: '500',
  },
  totalLabel: {
    fontWeight: '700',
    color: colors.text,
  },
  totalPrice: {
    fontWeight: '700',
    color: colors.primary,
  },
  confirmButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  confirmButtonContent: {
    paddingVertical: spacing.xs,
  },
});

export default CarritoScreen;

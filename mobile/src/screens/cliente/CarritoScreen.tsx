import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, IconButton, Divider, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { useAppSelector, useAppDispatch } from '@/store';
import { removeFromCart, updateQuantity, clearCart } from '@/store/slices/cartSlice';
import { pedidosAPI } from '@/services/api';
import { CartItem } from '@/types';
import { LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { formatPrice } from '@/utils';

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
    const precio = parseFloat(item.producto.precio);
    if (isNaN(precio)) return acc;
    return acc + (precio * item.cantidad);
  }, 0);

  const total = subtotal;

  const handleIncrement = (productoId: number, currentQty: number) => {
    // Límite máximo de 99 unidades
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
      
      const pedidoData = {
        cliente: user.id,
        lista_precio: user.lista_precio || 1,
        items: items.map((item) => ({
          producto: item.producto.id,
          cantidad: item.cantidad,
        })),
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
              onPress={() => handleRemove(item.producto.id, item.producto.nombre)}
            />
          </View>

          <View style={styles.quantityContainer}>
            <Text variant="bodyMedium" style={styles.quantityLabel}>Cantidad:</Text>
            <View style={styles.quantityControls}>
              <IconButton
                icon="minus"
                size={20}
                onPress={() => handleDecrement(item.producto.id, item.cantidad)}
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
                onPress={() => handleIncrement(item.producto.id, item.cantidad)}
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
          keyExtractor={(item) => item.producto.id.toString()}
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

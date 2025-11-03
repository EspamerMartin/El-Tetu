import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, IconButton, Divider, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { useAppSelector, useAppDispatch } from '@/store';
import { removeFromCart, updateQuantity, clearCart } from '@/store/slices/cartSlice';
import { pedidosAPI } from '@/services/api';
import { LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';

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
  const { items, total } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);

  // Calcular subtotal y descuento localmente
  const subtotal = total;
  const descuento = 0; // Por ahora sin descuentos en el carrito

  const handleIncrement = (productoId: number, currentQty: number, stock: number) => {
    if (currentQty < stock) {
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

    try {
      setLoading(true);
      
      const pedidoData = {
        cliente: user!.id,
        lista_precio: 'lista_3' as const,
        items: items.map((item) => ({
          producto: item.producto.id,
          cantidad: item.cantidad,
        })),
      };

      console.log('Enviando pedido:', JSON.stringify(pedidoData, null, 2));
      const pedido = await pedidosAPI.create(pedidoData);
      console.log('Pedido recibido:', JSON.stringify(pedido, null, 2));
      
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
      console.error('Error al crear pedido:', error);
      console.error('Response data:', error.response?.data);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message
        || error.response?.data?.detail
        || 'Error al crear el pedido';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (isNaN(price)) {
      return '$0.00';
    }
    return `$${price.toFixed(2)}`;
  };

  const renderItem = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text variant="titleMedium" style={styles.itemNombre}>
              {item.producto.nombre}
            </Text>
            <Text variant="bodySmall" style={styles.itemCodigo}>
              Código: {item.producto.codigo}
            </Text>
            <Text variant="titleMedium" style={styles.itemPrecio}>
              {formatPrice(parseFloat(item.producto.precio_lista_3))}
            </Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            iconColor={theme.colors.error}
            onPress={() => handleRemove(item.producto.id, item.producto.nombre)}
          />
        </View>

        <View style={styles.quantityContainer}>
          <Text variant="bodyMedium">Cantidad:</Text>
          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={20}
              onPress={() => handleDecrement(item.producto.id, item.cantidad)}
              disabled={item.cantidad <= 1}
            />
            <Surface style={styles.quantityBox}>
              <Text variant="titleMedium">{item.cantidad}</Text>
            </Surface>
            <IconButton
              icon="plus"
              size={20}
              onPress={() =>
                handleIncrement(item.producto.id, item.cantidad, item.producto.stock)
              }
              disabled={item.cantidad >= item.producto.stock}
            />
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.subtotalRow}>
          <Text variant="bodyMedium">Subtotal:</Text>
          <Text variant="titleMedium" style={styles.subtotalPrice}>
            {formatPrice(parseFloat(item.producto.precio_lista_3) * item.cantidad)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <LoadingOverlay visible message="Procesando pedido..." />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineMedium" style={styles.emptyTitle}>
          Carrito vacío
        </Text>
        <Text variant="bodyLarge" style={styles.emptyText}>
          Agrega productos desde el catálogo
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Home')}
          style={styles.emptyButton}
        >
          Ir al catálogo
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.producto.id.toString()}
        contentContainerStyle={styles.list}
      />

      <Surface style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <Text variant="bodyLarge">Subtotal:</Text>
          <Text variant="bodyLarge">{formatPrice(subtotal)}</Text>
        </View>

        {descuento > 0 && (
          <View style={styles.totalRow}>
            <Text variant="bodyLarge" style={styles.discountText}>
              Descuento:
            </Text>
            <Text variant="bodyLarge" style={styles.discountText}>
              -{formatPrice(descuento)}
            </Text>
          </View>
        )}

        <Divider style={styles.divider} />

        <View style={styles.totalRow}>
          <Text variant="headlineSmall" style={styles.totalLabel}>
            Total:
          </Text>
          <Text variant="headlineMedium" style={styles.totalPrice}>
            {formatPrice(total)}
          </Text>
        </View>

        <Button
          mode="contained"
          icon="check"
          onPress={handleConfirmOrder}
          style={styles.confirmButton}
        >
          Confirmar Pedido
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    elevation: 2,
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
    marginBottom: spacing.xs,
  },
  itemCodigo: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  itemPrecio: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBox: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
    elevation: 1,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtotalPrice: {
    fontWeight: '600',
  },
  totalsContainer: {
    padding: spacing.lg,
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  discountText: {
    color: theme.colors.tertiary,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalPrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  confirmButton: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
});

export default CarritoScreen;

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Surface, Chip, IconButton, Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ClienteStackParamList } from '@/navigation/ClienteStack';
import { productosAPI } from '@/services/api';
import { Producto } from '@/types';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCart } from '@/store/slices/cartSlice';
import { theme, spacing } from '@/theme';
import { formatPrice } from '@/utils';

type Props = NativeStackScreenProps<ClienteStackParamList, 'ProductoDetalle'>;

/**
 * ProductoDetalleScreen
 * 
 * Pantalla de detalle de producto con:
 * - Información completa del producto
 * - Selector de cantidad (1-10)
 * - Botón agregar al carrito
 * - Snackbar de confirmación
 */
const ProductoDetalleScreen = ({ route, navigation }: Props) => {
  const { productoId } = route.params;
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [cantidadAgregada, setCantidadAgregada] = useState(1);
  
  // Obtener cantidad actual en el carrito
  const cantidadEnCarrito = producto 
    ? cartItems.find(item => item.producto.id === producto.id)?.cantidad || 0
    : 0;

  useEffect(() => {
    fetchProducto();
  }, [productoId]);

  // Recargar producto cuando la pantalla vuelve al foco
  useFocusEffect(
    useCallback(() => {
      fetchProducto();
    }, [productoId])
  );

  const fetchProducto = async () => {
    try {
      setError(null);
      const data = await productosAPI.getById(productoId);
      setProducto(data);
    } catch (err: any) {
      setError('Error al cargar el producto');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = () => {
    if (producto && cantidad < Math.min(10, producto.stock)) {
      setCantidad(cantidad + 1);
    }
  };

  const handleDecrement = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  const handleAddToCart = () => {
    if (producto) {
      setCantidadAgregada(cantidad); // Guardar la cantidad antes de resetear
      dispatch(addToCart({ producto, cantidad }));
      setSnackbarVisible(true);
      setCantidad(1);
    }
  };

  if (loading) {
    return <LoadingOverlay visible message="Cargando producto..." />;
  }

  if (error || !producto) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error || 'Producto no encontrado'}
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Volver
          </Button>
        </View>
      </ScreenContainer>
    );
  }


  const maxCantidad = Math.min(10, producto.stock);

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface}>
          {producto.imagen && (
            <Image
              source={{ uri: producto.imagen }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.nombre}>
              {producto.nombre}
            </Text>
            <Text variant="bodyMedium" style={styles.codigo}>
              Código: {producto.codigo}
            </Text>
          </View>

          {producto.descripcion && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Descripción
              </Text>
              <Text variant="bodyMedium">{producto.descripcion}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Categoría
            </Text>
            <View style={styles.chipRow}>
              <Chip icon="tag" style={styles.chip}>
                {producto.categoria_nombre}
              </Chip>
              {producto.subcategoria_nombre && (
                <Chip icon="tag-outline" style={styles.chip}>
                  {producto.subcategoria_nombre}
                </Chip>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Precio
            </Text>
            <View style={styles.pricesContainer}>
              <View style={styles.priceBox}>
                <Text variant="headlineLarge" style={styles.price}>
                  {formatPrice(producto.precio)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Stock Disponible
            </Text>
            {producto.tiene_stock ? (
              <Chip
                icon="check-circle"
                style={[
                  styles.stockChip,
                  producto.stock_bajo ? styles.chipWarning : styles.chipSuccess,
                ]}
              >
                {producto.stock_bajo
                  ? `Stock bajo: ${producto.stock} unidades`
                  : `${producto.stock} unidades disponibles`}
              </Chip>
            ) : (
              <Chip icon="alert-circle" style={[styles.stockChip, styles.chipError]}>
                Sin stock
              </Chip>
            )}
          </View>

          {producto.tiene_stock && (
            <>
              {/* Indicador de cantidad en carrito */}
              {cantidadEnCarrito > 0 && (
                <View style={styles.cartIndicator}>
                  <Surface style={styles.cartIndicatorSurface}>
                    <Icon name="cart" size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.cartIndicatorText}>
                      Tienes <Text style={styles.cartIndicatorBold}>{cantidadEnCarrito}</Text> {cantidadEnCarrito === 1 ? 'unidad' : 'unidades'} en el carrito
                    </Text>
                  </Surface>
                </View>
              )}

              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Cantidad a agregar
                </Text>
                <View style={styles.quantityContainer}>
                  <IconButton
                    icon="minus"
                    size={24}
                    onPress={handleDecrement}
                    disabled={cantidad <= 1}
                    mode="contained"
                  />
                  <Surface style={styles.quantityBox}>
                    <Text variant="headlineMedium">{cantidad}</Text>
                  </Surface>
                  <IconButton
                    icon="plus"
                    size={24}
                    onPress={handleIncrement}
                    disabled={cantidad >= maxCantidad}
                    mode="contained"
                  />
                </View>
                <Text variant="bodySmall" style={styles.quantityHint}>
                  Máximo: {maxCantidad} unidades
                </Text>
              </View>

              <Button
                mode="contained"
                icon="cart-plus"
                onPress={handleAddToCart}
                style={styles.addButton}
              >
                {cantidadEnCarrito > 0 ? 'Agregar más al carrito' : 'Agregar al carrito'}
              </Button>
            </>
          )}
        </Surface>
      </ScrollView>

      {/* Snackbar flotante por encima de todo */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Ver',
          onPress: () => {
            setSnackbarVisible(false);
            navigation.navigate('ClienteTabs', { screen: 'Carrito' } as any);
          },
          labelStyle: { color: '#FFFFFF', fontWeight: '600' },
        }}
        style={styles.snackbar}
        wrapperStyle={styles.snackbarWrapperStyle}
      >
        <View style={styles.snackbarContent}>
          <Icon name="check-circle" size={18} color="#FFFFFF" style={styles.snackbarIcon} />
          <Text style={styles.snackbarText}>
            {cantidadAgregada} {cantidadAgregada === 1 ? 'unidad agregada' : 'unidades agregadas'}
          </Text>
        </View>
      </Snackbar>
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
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  header: {
    marginBottom: spacing.md,
  },
  nombre: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  codigo: {
    color: theme.colors.onSurfaceVariant,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  pricesContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceBox: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    alignItems: 'center',
  },
  price: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  priceSecondary: {
    color: theme.colors.secondary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  stockChip: {
    alignSelf: 'flex-start',
  },
  chipSuccess: {
    backgroundColor: theme.colors.tertiary + '20',
  },
  chipWarning: {
    backgroundColor: theme.colors.secondary + '20',
  },
  chipError: {
    backgroundColor: theme.colors.error + '20',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBox: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    borderRadius: 8,
    elevation: 1,
  },
  quantityHint: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  addButton: {
    marginTop: spacing.md,
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
  snackbarWrapperStyle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: spacing.md,
  },
  snackbar: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    width: '80%',
    maxWidth: '80%',
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  snackbarIcon: {
    marginRight: spacing.xs,
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  cartIndicator: {
    marginBottom: spacing.md,
  },
  cartIndicatorSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryContainer,
    elevation: 1,
  },
  cartIndicatorText: {
    marginLeft: spacing.sm,
    color: theme.colors.onPrimaryContainer,
    flex: 1,
  },
  cartIndicatorBold: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
});

export default ProductoDetalleScreen;

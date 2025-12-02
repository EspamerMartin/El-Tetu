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
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { formatPrice } from '@/utils';

type Props = NativeStackScreenProps<ClienteStackParamList, 'ProductoDetalle'>;

/**
 * ProductoDetalleScreen
 * 
 * Pantalla de detalle de producto con:
 * - Información completa del producto
 * - Selector de cantidad
 * - Botón agregar al carrito
 */
const ProductoDetalleScreen = ({ route, navigation }: Props) => {
  const { productoId } = route.params;
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user);
  
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [cantidadAgregada, setCantidadAgregada] = useState(1);
  
  const isCliente = user?.rol === 'cliente';
  
  const cantidadEnCarrito = producto 
    ? cartItems.find(item => item.producto.id === producto.id)?.cantidad || 0
    : 0;

  useEffect(() => {
    fetchProducto();
  }, [productoId]);

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
    // Límite máximo de 99 unidades por pedido
    if (producto && cantidad < 99) {
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
      setCantidadAgregada(cantidad);
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

  const maxCantidad = 99; // Límite máximo por pedido

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface}>
          {producto.url_imagen && (
            <Image
              source={{ uri: producto.url_imagen }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.nombre}>
              {producto.nombre}
            </Text>
            {!isCliente && (
              <Text variant="bodyMedium" style={styles.codigo}>
                Código de Barra: {producto.codigo_barra}
              </Text>
            )}
          </View>

          {producto.descripcion && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text variant="bodyMedium" style={styles.descripcion}>{producto.descripcion}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Marca</Text>
            <Chip icon="tag-heart" style={styles.chip} textStyle={styles.chipText}>
              {producto.marca_nombre}
            </Chip>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoría</Text>
            <View style={styles.chipRow}>
              <Chip icon="tag" style={styles.chip} textStyle={styles.chipText}>
                {producto.categoria_nombre}
              </Chip>
              {producto.subcategoria_nombre && (
                <Chip icon="tag-outline" style={styles.chipSecondary} textStyle={styles.chipText}>
                  {producto.subcategoria_nombre}
                </Chip>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especificaciones</Text>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Tamaño:</Text>
              <Text style={styles.specValue}>
                {producto.tamaño} {producto.unidad_tamaño_display}
              </Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Unidades por Caja:</Text>
              <Text style={styles.specValue}>{producto.unidades_caja}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Precio</Text>
            <View style={styles.priceBox}>
              <Text style={styles.price}>{formatPrice(producto.precio)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>
            {producto.tiene_stock ? (
              <Chip
                icon="check-circle"
                style={[styles.stockChip, styles.chipSuccess]}
                textStyle={styles.stockChipText}
              >
                Disponible
              </Chip>
            ) : (
              <Chip icon="alert-circle" style={[styles.stockChip, styles.chipError]} textStyle={styles.stockChipText}>
                Sin stock
              </Chip>
            )}
          </View>

          {producto.tiene_stock && (
            <>
              {cantidadEnCarrito > 0 && (
                <View style={styles.cartIndicator}>
                  <Surface style={styles.cartIndicatorSurface}>
                    <Icon name="cart" size={20} color={colors.primary} />
                    <Text style={styles.cartIndicatorText}>
                      Tienes <Text style={styles.cartIndicatorBold}>{cantidadEnCarrito}</Text> {cantidadEnCarrito === 1 ? 'unidad' : 'unidades'} en el carrito
                    </Text>
                  </Surface>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cantidad a agregar</Text>
                <View style={styles.quantityContainer}>
                  <IconButton
                    icon="minus"
                    size={24}
                    onPress={handleDecrement}
                    disabled={cantidad <= 1}
                    mode="contained"
                    iconColor={colors.error}
                  />
                  <Surface style={styles.quantityBox}>
                    <Text style={styles.quantityText}>{cantidad}</Text>
                  </Surface>
                  <IconButton
                    icon="plus"
                    size={24}
                    onPress={handleIncrement}
                    disabled={cantidad >= maxCantidad}
                    mode="contained"
                    iconColor={colors.primary}
                  />
                </View>
                <Text style={styles.quantityHint}>
                  Máximo: {maxCantidad} unidades
                </Text>
              </View>

              <Button
                mode="contained"
                icon="cart-plus"
                onPress={handleAddToCart}
                style={styles.addButton}
                contentStyle={styles.addButtonContent}
              >
                {cantidadEnCarrito > 0 ? 'Agregar más al carrito' : 'Agregar al carrito'}
              </Button>
            </>
          )}
        </Surface>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Ver',
          onPress: () => {
            setSnackbarVisible(false);
            navigation.navigate('ClienteTabs', { screen: 'Carrito' });
          },
          labelStyle: { color: colors.white, fontWeight: '600' },
        }}
        style={styles.snackbar}
        wrapperStyle={styles.snackbarWrapperStyle}
      >
        <View style={styles.snackbarContent}>
          <Icon name="check-circle" size={18} color={colors.white} style={styles.snackbarIcon} />
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
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primarySurface,
  },
  header: {
    marginBottom: spacing.md,
  },
  nombre: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  codigo: {
    color: colors.textTertiary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descripcion: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.primarySurface,
  },
  chipSecondary: {
    backgroundColor: colors.accentLight + '30',
  },
  chipText: {
    color: colors.text,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  specLabel: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  specValue: {
    color: colors.text,
    fontWeight: '600',
  },
  priceBox: {
    padding: spacing.md,
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  price: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: 'bold',
  },
  stockChip: {
    alignSelf: 'flex-start',
  },
  stockChipText: {
    fontWeight: '600',
  },
  chipSuccess: {
    backgroundColor: colors.successLight,
  },
  chipWarning: {
    backgroundColor: colors.warningLight,
  },
  chipError: {
    backgroundColor: colors.errorLight,
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
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySurface,
    ...shadows.sm,
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  quantityHint: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  addButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  addButtonContent: {
    paddingVertical: spacing.xs,
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
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    ...shadows.md,
    width: '80%',
    maxWidth: '80%',
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  snackbarIcon: {
    marginRight: spacing.xs,
  },
  snackbarText: {
    color: colors.white,
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
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySurface,
    ...shadows.sm,
  },
  cartIndicatorText: {
    marginLeft: spacing.sm,
    color: colors.text,
    flex: 1,
  },
  cartIndicatorBold: {
    fontWeight: '700',
    color: colors.primary,
  },
});

export default ProductoDetalleScreen;

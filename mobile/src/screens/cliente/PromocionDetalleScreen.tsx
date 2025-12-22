import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Surface, Divider, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteStackParamList } from '@/navigation/ClienteStack';
import { promocionesAPI } from '@/services/api';
import { Promocion } from '@/types';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '@/store';
import { addPromocionToCart } from '@/store/slices/cartSlice';

type Props = NativeStackScreenProps<ClienteStackParamList, 'PromocionDetalle'>;

/**
 * PromocionDetalleScreen
 * Muestra el detalle de una promoción para el cliente
 */
const PromocionDetalleScreen = ({ route, navigation }: Props) => {
  const { promocionId } = route.params;
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const cartItems = useAppSelector(state => state.cart.items);
  
  const [promocion, setPromocion] = useState<Promocion | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  // Verificar si la promoción ya está en el carrito
  const promocionEnCarrito = cartItems.find(
    item => item.tipo === 'promocion' && item.promocion?.id === promocionId
  );
  const cantidadEnCarrito = promocionEnCarrito?.cantidad || 0;

  useEffect(() => {
    loadPromocion();
  }, [promocionId]);

  const loadPromocion = async () => {
    try {
      setLoading(true);
      const data = await promocionesAPI.getById(promocionId);
      setPromocion(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la promoción');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarAlCarrito = () => {
    if (!promocion) return;

    setAdding(true);
    try {
      dispatch(addPromocionToCart({ promocion, cantidad: 1 }));
      Alert.alert(
        'Promoción agregada',
        `"${promocion.nombre}" se agregó al carrito.`,
        [
          { text: 'Seguir viendo', style: 'cancel' },
          { text: 'Ir al carrito', onPress: () => navigation.navigate('ClienteTabs', { screen: 'Carrito' }) },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'No se pudo agregar al carrito');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible message="Cargando promoción..." />;
  }

  if (!promocion) {
    return null;
  }

  const precioOriginal = parseFloat(promocion.precio_original);
  const precioPromo = parseFloat(promocion.precio);
  const ahorro = precioOriginal - precioPromo;
  const porcentajeDescuento = parseFloat(promocion.porcentaje_descuento);

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Imagen principal */}
        <View style={styles.imageContainer}>
          {promocion.url_imagen ? (
            <Image source={{ uri: promocion.url_imagen }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="tag-multiple" size={80} color={colors.promo} />
            </View>
          )}
          
          {/* Badge de descuento */}
          {porcentajeDescuento > 0 && (
            <View style={styles.descuentoBadge}>
              <Text style={styles.descuentoText}>-{porcentajeDescuento.toFixed(0)}%</Text>
            </View>
          )}

          {/* Badge promo */}
          <View style={styles.promoBadge}>
            <Icon name="fire" size={16} color={colors.white} />
            <Text style={styles.promoBadgeText}>PROMOCIÓN</Text>
          </View>
        </View>

        {/* Info de la promoción */}
        <Surface style={styles.infoCard}>
          <Text style={styles.nombre}>{promocion.nombre}</Text>
          
          {promocion.descripcion && (
            <Text style={styles.descripcion}>{promocion.descripcion}</Text>
          )}

          {/* Precios */}
          <View style={styles.preciosContainer}>
            {ahorro > 0 && (
              <View style={styles.precioOriginalContainer}>
                <Text style={styles.precioOriginalLabel}>Precio normal:</Text>
                <Text style={styles.precioOriginal}>{formatPrice(promocion.precio_original)}</Text>
              </View>
            )}
            
            <View style={styles.precioPromoContainer}>
              <Text style={styles.precioPromoLabel}>Precio promoción:</Text>
              <Text style={styles.precioPromo}>{formatPrice(promocion.precio)}</Text>
            </View>

            {ahorro > 0 && (
              <View style={styles.ahorroContainer}>
                <Icon name="piggy-bank" size={20} color={colors.success} />
                <Text style={styles.ahorroText}>
                  ¡Ahorrás {formatPrice(ahorro.toString())}!
                </Text>
              </View>
            )}
          </View>
        </Surface>

        {/* Productos incluidos */}
        <Surface style={styles.productosCard}>
          <Text style={styles.productosTitle}>
            Productos incluidos ({promocion.items_count})
          </Text>
          
          <Divider style={styles.divider} />

          {promocion.items.map((item, index) => (
            <View key={item.id} style={styles.productoItem}>
              <View style={styles.productoImageContainer}>
                {item.producto_imagen ? (
                  <Image 
                    source={{ uri: item.producto_imagen }} 
                    style={styles.productoImage}
                  />
                ) : (
                  <View style={styles.productoImagePlaceholder}>
                    <Icon name="package-variant" size={20} color={colors.textTertiary} />
                  </View>
                )}
              </View>
              
              <View style={styles.productoInfo}>
                <Text style={styles.productoNombre} numberOfLines={2}>
                  {item.producto_nombre}
                </Text>
                <Text style={styles.productoPrecio}>
                  {formatPrice(item.producto_precio)} x {item.cantidad}
                </Text>
              </View>

              <Text style={styles.productoSubtotal}>
                {formatPrice(item.subtotal)}
              </Text>
            </View>
          ))}

          <Divider style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total productos:</Text>
            <Text style={styles.totalValorOriginal}>{formatPrice(promocion.precio_original)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelPromo}>Precio promoción:</Text>
            <Text style={styles.totalValorPromo}>{formatPrice(promocion.precio)}</Text>
          </View>
        </Surface>

        {/* Vigencia */}
        {(promocion.fecha_inicio || promocion.fecha_fin) && (
          <Surface style={styles.vigenciaCard}>
            <View style={styles.vigenciaRow}>
              <Icon name="calendar-clock" size={20} color={colors.textSecondary} />
              <Text style={styles.vigenciaText}>
                {promocion.fecha_inicio && promocion.fecha_fin
                  ? `Válida del ${formatFecha(promocion.fecha_inicio)} al ${formatFecha(promocion.fecha_fin)}`
                  : promocion.fecha_fin
                    ? `Válida hasta ${formatFecha(promocion.fecha_fin)}`
                    : `Válida desde ${formatFecha(promocion.fecha_inicio!)}`
                }
              </Text>
            </View>
          </Surface>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Botón fijo de agregar al carrito */}
      <Surface style={[styles.bottomBar, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.bottomBarLabel}>Precio:</Text>
            <Text style={styles.bottomBarPrecio}>{formatPrice(promocion.precio)}</Text>
            {cantidadEnCarrito > 0 && (
              <Text style={styles.enCarritoText}>
                {cantidadEnCarrito} en carrito
              </Text>
            )}
          </View>
          <Button
            mode="contained"
            onPress={handleAgregarAlCarrito}
            loading={adding}
            disabled={adding}
            icon={cantidadEnCarrito > 0 ? "cart-check" : "cart-plus"}
            buttonColor={colors.promo}
            style={styles.addButton}
          >
            {cantidadEnCarrito > 0 ? 'Agregar otra' : 'Agregar'}
          </Button>
        </View>
      </Surface>
    </ScreenContainer>
  );
};

const formatFecha = (fecha: string): string => {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-AR', { 
    day: '2-digit', 
    month: 'long',
    year: 'numeric'
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    backgroundColor: colors.promoLight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descuentoBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  descuentoText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  promoBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.promo,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  promoBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  nombre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  descripcion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  preciosContainer: {
    gap: spacing.sm,
  },
  precioOriginalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  precioOriginalLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  precioOriginal: {
    fontSize: 16,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  precioPromoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  precioPromoLabel: {
    color: colors.promo,
    fontSize: 14,
    fontWeight: '600',
  },
  precioPromo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.promo,
  },
  ahorroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  ahorroText: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 14,
  },
  productosCard: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  productosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  divider: {
    marginVertical: spacing.md,
  },
  productoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  productoImageContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  productoImage: {
    width: '100%',
    height: '100%',
  },
  productoImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productoInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  productoNombre: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  productoPrecio: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productoSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalValorOriginal: {
    fontSize: 14,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  totalLabelPromo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.promo,
  },
  totalValorPromo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.promo,
  },
  vigenciaCard: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  vigenciaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vigenciaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomBarPrecio: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.promo,
  },
  addButton: {
    borderRadius: borderRadius.md,
  },
  enCarritoText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default PromocionDetalleScreen;


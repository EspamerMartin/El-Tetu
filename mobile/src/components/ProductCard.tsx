import React, { memo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Producto } from '@/types';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { formatPrice } from '@/utils';

interface ProductCardProps {
  producto: Producto;
  onPress?: () => void;
  onAddToCart?: () => void;
  showAddButton?: boolean;
}

/**
 * ProductCard
 * Tarjeta reutilizable para mostrar productos en el catálogo
 * Diseño optimizado con colores de marca El Tetu
 */
const ProductCard: React.FC<ProductCardProps> = memo(({
  producto,
  onPress,
}) => {
  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <View style={styles.cardContent}>
        {/* Imagen del producto */}
        <View style={styles.imageContainer}>
          {producto.url_imagen ? (
            <Image
              source={{ uri: producto.url_imagen }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderIcon}>📦</Text>
            </View>
          )}
        </View>

        {/* Información del producto */}
        <View style={styles.infoContainer}>
          {/* Nombre del producto */}
          <Text style={styles.nombre} numberOfLines={2}>
            {producto.nombre}
          </Text>

          {/* Categoría y Subcategoría */}
          <View style={styles.infoRow}>
            <Text style={styles.categoryValue} numberOfLines={1}>
              {producto.categoria_nombre}
              {producto.subcategoria_nombre && (
                <Text style={styles.subcategoryValue}>
                  {' • '}{producto.subcategoria_nombre}
                </Text>
              )}
            </Text>
          </View>

          {/* Precio */}
          <Text style={styles.price}>
            {formatPrice(producto.precio)}
          </Text>
        </View>
      </View>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadows.md,
  },
  cardContent: {
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: colors.primarySurface,
    overflow: 'hidden',
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
    backgroundColor: colors.primarySurface,
  },
  placeholderIcon: {
    fontSize: 40,
    opacity: 0.3,
  },
  infoContainer: {
    padding: spacing.sm + 2,
    paddingBottom: 50, // Espacio para el botón "Agregar" overlay
  },
  nombre: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 13,
    lineHeight: 17,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryValue: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 10,
  },
  subcategoryValue: {
    color: colors.accent,
    fontWeight: '500',
    fontSize: 10,
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginTop: spacing.xs,
  },
});

export default ProductCard;

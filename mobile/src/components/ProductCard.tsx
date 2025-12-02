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
  const getStockStyles = () => {
    if (!producto.tiene_stock) {
      return { badge: styles.stockBadgeError, text: 'Sin stock' };
    }
    return { badge: styles.stockBadgeSuccess, text: 'Disponible' };
  };

  const stockInfo = getStockStyles();

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
          
          {/* Badge de stock */}
          <View style={[styles.stockBadge, stockInfo.badge]}>
            <Text style={styles.stockBadgeText} numberOfLines={1}>
              {stockInfo.text}
            </Text>
          </View>
        </View>
        
        {/* Información del producto */}
        <View style={styles.infoContainer}>
          {/* Marca */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Marca: </Text>
            <Text style={styles.marcaValue} numberOfLines={1}>
              {producto.marca_nombre}
            </Text>
          </View>
          
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
          
          {/* Nombre del producto */}
          <Text style={styles.nombre} numberOfLines={2}>
            {producto.nombre}
          </Text>
          
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
  stockBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    maxWidth: '85%',
    borderWidth: 1.5,
    ...shadows.sm,
  },
  stockBadgeSuccess: {
    backgroundColor: colors.success,
    borderColor: '#1B5E20',
  },
  stockBadgeWarning: {
    backgroundColor: colors.warning,
    borderColor: '#E65100',
  },
  stockBadgeError: {
    backgroundColor: colors.error,
    borderColor: '#B71C1C',
  },
  stockBadgeText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  infoContainer: {
    padding: spacing.sm + 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoLabel: {
    color: colors.textTertiary,
    fontWeight: '600',
    fontSize: 10,
  },
  marcaValue: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 10,
    flex: 1,
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
  nombre: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 12,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginTop: spacing.xs,
  },
});

export default ProductCard;

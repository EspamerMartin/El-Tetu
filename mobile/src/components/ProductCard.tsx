import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { Producto } from '@/types';
import { theme, spacing, colors, shadows } from '@/theme';
import { formatPrice } from '@/utils';

interface ProductCardProps {
  producto: Producto;
  onPress?: () => void;
  onAddToCart?: () => void;
  showAddButton?: boolean;
}

/**
 * ProductCard
 * Tarjeta reutilizable para mostrar productos
 */
const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  onPress,
  onAddToCart,
  showAddButton = true,
}) => {

  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <Card.Content style={styles.cardContent}>
        {/* Imagen del producto o placeholder */}
        <View style={styles.imageContainer}>
          {producto.imagen ? (
            <Image
              source={{ uri: producto.imagen }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text variant="displaySmall" style={styles.placeholderIcon}>📦</Text>
            </View>
          )}
          
          {/* Stock badge en la imagen */}
          <View style={[
            styles.stockBadge,
            producto.tiene_stock 
              ? (producto.stock_bajo ? styles.stockBadgeWarning : styles.stockBadgeSuccess)
              : styles.stockBadgeError
          ]}>
            <Text variant="labelSmall" style={styles.stockBadgeText} numberOfLines={1}>
              {producto.tiene_stock 
                ? `Stock: ${producto.stock}` 
                : 'Sin stock'}
            </Text>
          </View>
        </View>
        
        {/* Info del producto */}
        <View style={styles.infoContainer}>
          {/* Categoría y Subcategoría */}
          <View style={styles.infoRow}>
            <Text variant="labelSmall" style={styles.infoLabel}>Categoría: </Text>
            <Text variant="labelSmall" style={styles.categoryValue}>
              {producto.categoria_nombre}
            </Text>
            {producto.subcategoria_nombre && (
              <>
                <Text variant="labelSmall" style={styles.categorySeparator}> • </Text>
                <Text variant="labelSmall" style={styles.subcategoryValue}>
                  {producto.subcategoria_nombre}
                </Text>
              </>
            )}
          </View>
          
          {/* Nombre del producto */}
          <View style={styles.infoRow}>
            <Text variant="labelSmall" style={styles.infoLabel}>Producto: </Text>
            <Text variant="bodySmall" style={styles.nombre} numberOfLines={2}>
              {producto.nombre}
            </Text>
          </View>
          
          {/* Código */}
          <Text variant="labelSmall" style={styles.codigo} numberOfLines={1}>
            Cód: {producto.codigo}
          </Text>
          
          {/* Precio */}
          <Text variant="titleMedium" style={styles.price}>
            {formatPrice(producto.precio)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    elevation: 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardContent: {
    padding: 0,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: colors.surfaceVariant,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  placeholderIcon: {
    opacity: 0.3,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    ...shadows.medium,
    maxWidth: '85%',
    borderWidth: 1.5,
  },
  stockBadgeSuccess: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stockBadgeWarning: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  stockBadgeError: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  stockBadgeText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  infoContainer: {
    padding: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  infoLabel: {
    color: colors.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 10,
  },
  categoryValue: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 10,
  },
  subcategoryValue: {
    color: colors.secondary,
    fontWeight: '500',
    fontSize: 10,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  categoryLabel: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  categorySeparator: {
    color: colors.outline,
    fontSize: 10,
  },
  subcategoryLabel: {
    color: colors.secondary,
    fontWeight: '500',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  nombre: {
    fontWeight: '600',
    color: colors.onSurface,
    flex: 1,
    fontSize: 12,
  },
  codigo: {
    color: colors.onSurfaceVariant,
    marginBottom: 6,
    fontSize: 10,
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  // Estilos legacy para compatibilidad
  header: {
    marginBottom: spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    color: colors.onSurfaceVariant,
  },
  priceSecondary: {
    color: colors.secondary,
    fontWeight: '600',
  },
  stockContainer: {
    marginBottom: spacing.sm,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  chipSuccess: {
    backgroundColor: colors.successContainer,
  },
  chipWarning: {
    backgroundColor: colors.warningContainer,
  },
  chipError: {
    backgroundColor: colors.errorContainer,
  },
  chipText: {
    fontSize: 12,
  },
  button: {
    marginTop: spacing.xs,
  },
});

export default ProductCard;

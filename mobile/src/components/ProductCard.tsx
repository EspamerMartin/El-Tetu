import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { Producto } from '@/types';
import { theme, spacing } from '@/theme';

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
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      return '$0.00';
    }
    return `$${numPrice.toFixed(2)}`;
  };

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
    backgroundColor: 'white',
  },
  cardContent: {
    padding: 0,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: theme.colors.surfaceVariant,
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
    backgroundColor: '#f0f0f0',
  },
  placeholderIcon: {
    opacity: 0.3,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 2,
    maxWidth: '90%',
  },
  stockBadgeSuccess: {
    backgroundColor: '#4CAF50',
  },
  stockBadgeWarning: {
    backgroundColor: '#FF9800',
  },
  stockBadgeError: {
    backgroundColor: '#F44336',
  },
  stockBadgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 10,
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
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 10,
  },
  categoryValue: {
    color: theme.colors.primary,
    fontWeight: '500',
    fontSize: 10,
  },
  subcategoryValue: {
    color: theme.colors.secondary,
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
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  categorySeparator: {
    color: theme.colors.outline,
    fontSize: 10,
  },
  subcategoryLabel: {
    color: theme.colors.secondary,
    fontWeight: '500',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  nombre: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    fontSize: 12,
  },
  codigo: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 6,
    fontSize: 10,
  },
  price: {
    color: theme.colors.primary,
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
    color: theme.colors.onSurfaceVariant,
  },
  priceSecondary: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  stockContainer: {
    marginBottom: spacing.sm,
  },
  chip: {
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
  chipText: {
    fontSize: 12,
  },
  button: {
    marginTop: spacing.xs,
  },
});

export default ProductCard;

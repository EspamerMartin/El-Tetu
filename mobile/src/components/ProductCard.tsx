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
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        {producto.imagen && (
          <Image
            source={{ uri: producto.imagen }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.nombre} numberOfLines={2}>
            {producto.nombre}
          </Text>
          <Text variant="bodySmall" style={styles.codigo}>
            Código: {producto.codigo}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <View>
            <Text variant="headlineMedium" style={styles.price}>
              {formatPrice(producto.precio)}
            </Text>
          </View>
        </View>

        <View style={styles.stockContainer}>
          {producto.tiene_stock ? (
            <Chip
              icon="check-circle"
              style={[
                styles.chip,
                producto.stock_bajo
                  ? styles.chipWarning
                  : styles.chipSuccess,
              ]}
              textStyle={styles.chipText}
            >
              {producto.stock_bajo
                ? `Stock bajo (${producto.stock})`
                : `Stock: ${producto.stock}`}
            </Chip>
          ) : (
            <Chip
              icon="alert-circle"
              style={[styles.chip, styles.chipError]}
              textStyle={styles.chipText}
            >
              Sin stock
            </Chip>
          )}
        </View>

        {showAddButton && producto.tiene_stock && (
          <Button
            mode="contained"
            icon="eye"
            onPress={onPress}
            style={styles.button}
          >
            Ver producto
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
  },
  header: {
    marginBottom: spacing.sm,
  },
  nombre: {
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  codigo: {
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
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
  price: {
    color: theme.colors.primary,
    fontWeight: 'bold',
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

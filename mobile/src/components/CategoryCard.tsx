import React, { memo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CategoryCardProps {
  nombre: string;
  descripcion?: string;
  url_imagen?: string;
  onPress: () => void;
  /** Cantidad de items (subcategorías o productos) */
  itemCount?: number;
  /** Texto para el contador (ej: "subcategorías", "productos") */
  itemLabel?: string;
}

/**
 * CategoryCard
 * Tarjeta reutilizable para mostrar categorías y subcategorías
 * Diseño similar a ProductCard para consistencia visual
 */
const CategoryCard: React.FC<CategoryCardProps> = memo(({
  nombre,
  descripcion,
  url_imagen,
  onPress,
  itemCount,
  itemLabel,
}) => {
  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <View style={styles.cardContent}>
        {/* Imagen de la categoría */}
        <View style={styles.imageContainer}>
          {url_imagen ? (
            <Image
              source={{ uri: url_imagen }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="shape" size={48} color={colors.primary} style={styles.placeholderIcon} />
            </View>
          )}
          
          {/* Badge con contador de items */}
          {itemCount !== undefined && itemCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {itemCount} {itemLabel || 'items'}
              </Text>
            </View>
          )}
        </View>
        
        {/* Información de la categoría */}
        <View style={styles.infoContainer}>
          {/* Nombre de la categoría */}
          <Text style={styles.nombre} numberOfLines={2}>
            {nombre}
          </Text>
          
          {/* Descripción si existe */}
          {descripcion && (
            <Text style={styles.descripcion} numberOfLines={1}>
              {descripcion}
            </Text>
          )}
          
          {/* Indicador de navegación */}
          <View style={styles.navIndicator}>
            <Text style={styles.navText}>Ver más</Text>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </View>
        </View>
      </View>
    </Card>
  );
});

CategoryCard.displayName = 'CategoryCard';

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
    height: 120,
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
    opacity: 0.4,
  },
  countBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    ...shadows.sm,
  },
  countBadgeText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  infoContainer: {
    padding: spacing.sm + 2,
  },
  nombre: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  descripcion: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  navIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  navText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CategoryCard;




import React, { memo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Promocion } from '@/types';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PromocionCardProps {
  promocion: Promocion;
  onPress?: () => void;
  compact?: boolean; // Versión compacta para scroll horizontal
  /** Versión estilo producto para grilla (similar a ProductCard) */
  gridStyle?: boolean;
}

/**
 * PromocionCard
 * Tarjeta para mostrar promociones con múltiples estilos:
 * - compact: scroll horizontal en catálogo
 * - gridStyle: estilo similar a ProductCard para grillas
 * - default: versión completa para gestión
 */
const PromocionCard: React.FC<PromocionCardProps> = memo(({ 
  promocion, 
  onPress,
  compact = false,
  gridStyle = false,
}) => {
  const ahorro = parseFloat(promocion.ahorro);
  const tieneAhorro = ahorro > 0;
  const porcentajeDescuento = parseFloat(promocion.porcentaje_descuento);

  // Versión estilo grilla (similar a ProductCard)
  if (gridStyle) {
    return (
      <Card style={styles.cardGrid} onPress={onPress} mode="elevated">
        <View style={styles.cardGridContent}>
          {/* Imagen */}
          <View style={styles.imageContainerGrid}>
            {promocion.url_imagen ? (
              <Image
                source={{ uri: promocion.url_imagen }}
                style={styles.imageGrid}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholderGrid}>
                <Icon name="tag-multiple" size={40} color={colors.promo} style={{ opacity: 0.5 }} />
              </View>
            )}
            
            {/* Badge descuento */}
            {porcentajeDescuento > 0 && (
              <View style={styles.descuentoBadgeGrid}>
                <Text style={styles.descuentoTextGrid}>
                  -{porcentajeDescuento.toFixed(0)}%
                </Text>
              </View>
            )}
          </View>
          
          {/* Info */}
          <View style={styles.infoContainerGrid}>
            <Text style={styles.nombreGrid} numberOfLines={2}>
              {promocion.nombre}
            </Text>
            
            <View style={styles.infoRowGrid}>
              <Text style={styles.itemsCountGrid}>
                {promocion.items_count} producto{promocion.items_count !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Precios */}
            <View style={styles.preciosContainerGrid}>
              {tieneAhorro && (
                <Text style={styles.precioOriginalGrid}>
                  {formatPrice(promocion.precio_original)}
                </Text>
              )}
              <Text style={styles.priceGrid}>
                {formatPrice(promocion.precio)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  // Versión compacta para scroll horizontal
  if (compact) {
    return (
      <Card style={styles.cardCompact} onPress={onPress}>
        {/* Imagen */}
        <View style={styles.imageContainerCompact}>
          {promocion.url_imagen ? (
            <Image 
              source={{ uri: promocion.url_imagen }} 
              style={styles.imageCompact}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholderCompact}>
              <Icon name="tag-multiple" size={32} color={colors.promo} />
            </View>
          )}
        </View>

        <Card.Content style={styles.contentCompact}>
          <Text 
            variant="titleSmall" 
            style={styles.nombreCompact}
            numberOfLines={2}
          >
            {promocion.nombre}
          </Text>

          {/* Precio y descuento */}
          <View style={styles.precioContainerCompact}>
            {tieneAhorro && (
              <Text style={styles.precioOriginalCompact}>
                {formatPrice(promocion.precio_original)}
              </Text>
            )}
            <Text style={styles.precioPromoCompact}>
              {formatPrice(promocion.precio)}
            </Text>
          </View>

          {/* Badge de descuento */}
          {porcentajeDescuento > 0 && (
            <View style={styles.descuentoBadgeCompact}>
              <Text style={styles.descuentoTextCompact}>
                -{porcentajeDescuento.toFixed(0)}%
              </Text>
            </View>
          )}

          {/* Cantidad de productos */}
          <Text style={styles.itemsCountCompact}>
            {promocion.items_count} producto{promocion.items_count !== 1 ? 's' : ''}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  // Versión completa para gestión (admin/vendedor)
  return (
    <Card style={styles.card} onPress={onPress}>
      {/* Header con badge */}
      <View style={styles.header}>
        <View style={styles.promoBadgeLarge}>
          <Icon name="fire" size={16} color={colors.white} />
          <Text style={styles.promoBadgeTextLarge}>PROMOCIÓN</Text>
        </View>
        
        {!promocion.activo && (
          <Chip 
            style={styles.inactivoChip}
            textStyle={styles.inactivoText}
          >
            Inactivo
          </Chip>
        )}

        {porcentajeDescuento > 0 && (
          <View style={styles.descuentoBadge}>
            <Text style={styles.descuentoText}>
              -{porcentajeDescuento.toFixed(0)}% OFF
            </Text>
          </View>
        )}
      </View>

      <View style={styles.mainContent}>
        {/* Imagen */}
        <View style={styles.imageContainer}>
          {promocion.url_imagen ? (
            <Image 
              source={{ uri: promocion.url_imagen }} 
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="tag-multiple" size={48} color={colors.promo} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text variant="titleMedium" style={styles.nombre} numberOfLines={2}>
            {promocion.nombre}
          </Text>

          {promocion.descripcion && (
            <Text 
              variant="bodySmall" 
              style={styles.descripcion}
              numberOfLines={2}
            >
              {promocion.descripcion}
            </Text>
          )}

          {/* Productos incluidos */}
          <View style={styles.productosContainer}>
            <Icon name="package-variant" size={14} color={colors.textSecondary} />
            <Text style={styles.productosText}>
              {promocion.items_count} producto{promocion.items_count !== 1 ? 's' : ''} incluido{promocion.items_count !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Vigencia */}
          {(promocion.fecha_inicio || promocion.fecha_fin) && (
            <View style={styles.vigenciaContainer}>
              <Icon name="calendar-clock" size={14} color={colors.textSecondary} />
              <Text style={styles.vigenciaText}>
                {promocion.fecha_inicio && promocion.fecha_fin
                  ? `Del ${formatFecha(promocion.fecha_inicio)} al ${formatFecha(promocion.fecha_fin)}`
                  : promocion.fecha_fin
                    ? `Hasta ${formatFecha(promocion.fecha_fin)}`
                    : `Desde ${formatFecha(promocion.fecha_inicio!)}`
                }
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer con precios */}
      <View style={styles.footer}>
        <View style={styles.precioContainer}>
          {tieneAhorro && (
            <View style={styles.precioOriginalContainer}>
              <Text style={styles.precioOriginal}>
                {formatPrice(promocion.precio_original)}
              </Text>
              <View style={styles.ahorroContainer}>
                <Text style={styles.ahorroText}>
                  Ahorrás {formatPrice(promocion.ahorro)}
                </Text>
              </View>
            </View>
          )}
          <Text style={styles.precioPromo}>
            {formatPrice(promocion.precio)}
          </Text>
        </View>

        <Icon name="chevron-right" size={24} color={colors.promo} />
      </View>
    </Card>
  );
});

PromocionCard.displayName = 'PromocionCard';

// Helper para formatear fechas
const formatFecha = (fecha: string): string => {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-AR', { 
    day: '2-digit', 
    month: 'short' 
  });
};

const styles = StyleSheet.create({
  // ========== Card estilo grilla (similar a ProductCard) ==========
  cardGrid: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.promo,
    ...shadows.md,
  },
  cardGridContent: {
    overflow: 'hidden',
  },
  imageContainerGrid: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: colors.promoLight,
    overflow: 'hidden',
  },
  imageGrid: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholderGrid: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.promoLight,
  },
  promoBadgeGrid: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.promo,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    gap: 2,
  },
  promoBadgeTextGrid: {
    color: colors.white,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  descuentoBadgeGrid: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  descuentoTextGrid: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainerGrid: {
    padding: spacing.sm + 2,
    paddingBottom: 50, // Espacio para botón overlay
  },
  nombreGrid: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 13,
    lineHeight: 17,
    marginBottom: spacing.xs,
  },
  infoRowGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemsCountGrid: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 10,
  },
  preciosContainerGrid: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  precioOriginalGrid: {
    fontSize: 11,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  priceGrid: {
    color: colors.promo,
    fontWeight: '700',
    fontSize: 16,
  },

  // ========== Card completa (gestión) ==========
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.promo,
    ...shadows.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  promoBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.promo,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  promoBadgeTextLarge: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  inactivoChip: {
    backgroundColor: colors.errorLight,
    height: 24,
  },
  inactivoText: {
    color: colors.error,
    fontSize: 10,
  },
  descuentoBadge: {
    marginLeft: 'auto',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  descuentoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainContent: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.promoLight,
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
    backgroundColor: colors.promoLight,
  },
  infoContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  nombre: {
    fontWeight: 'bold',
    color: colors.text,
  },
  descripcion: {
    color: colors.textSecondary,
  },
  productosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productosText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  vigenciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vigenciaText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.promoLight,
    borderTopWidth: 1,
    borderTopColor: colors.promo + '30',
  },
  precioContainer: {
    gap: 2,
  },
  precioOriginalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  precioOriginal: {
    fontSize: 13,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  ahorroContainer: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  ahorroText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: 'bold',
  },
  precioPromo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.promo,
  },

  // ========== Card compacta (scroll horizontal) ==========
  cardCompact: {
    width: 160,
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.promo,
    ...shadows.sm,
    overflow: 'hidden',
  },
  promoBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.promo,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    gap: 2,
  },
  promoBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  imageContainerCompact: {
    height: 100,
    backgroundColor: colors.promoLight,
  },
  imageCompact: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholderCompact: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCompact: {
    padding: spacing.sm,
  },
  nombreCompact: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  precioContainerCompact: {
    marginBottom: spacing.xs,
  },
  precioOriginalCompact: {
    fontSize: 11,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  precioPromoCompact: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.promo,
  },
  descuentoBadgeCompact: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  descuentoTextCompact: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemsCountCompact: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});

export default PromocionCard;


import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Promocion } from '@/types';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PromocionCardProps {
  promocion: Promocion;
  onPress?: () => void;
  compact?: boolean; // Versión compacta para catálogo
}

/**
 * PromocionCard
 * Tarjeta atractiva para mostrar promociones con diseño de marketing
 */
const PromocionCard: React.FC<PromocionCardProps> = ({ 
  promocion, 
  onPress,
  compact = false 
}) => {
  const ahorro = parseFloat(promocion.ahorro);
  const tieneAhorro = ahorro > 0;
  const porcentajeDescuento = parseFloat(promocion.porcentaje_descuento);

  if (compact) {
    // Versión compacta para mostrar en el catálogo
    return (
      <Card style={styles.cardCompact} onPress={onPress}>
        {/* Badge de promoción */}
        <View style={styles.promoBadge}>
          <Icon name="fire" size={12} color={colors.white} />
          <Text style={styles.promoBadgeText}>PROMO</Text>
        </View>

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

  // Versión completa para gestión
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
};

// Helper para formatear fechas
const formatFecha = (fecha: string): string => {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-AR', { 
    day: '2-digit', 
    month: 'short' 
  });
};

const styles = StyleSheet.create({
  // Card completa
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

  // Card compacta
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


import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Divider } from 'react-native-paper';
import { Pedido } from '@/types';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { formatPrice, formatDate } from '@/utils';

interface PedidoCardProps {
  pedido: Pedido;
  onPress?: () => void;
}

/**
 * PedidoCard
 * Tarjeta reutilizable para mostrar pedidos con diseño de marca
 */
const PedidoCard: React.FC<PedidoCardProps> = ({ pedido, onPress }) => {

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return {
          color: colors.warning,
          bgColor: colors.warningLight,
          label: 'Pendiente',
          icon: '⏳'
        };
      case 'EN_PREPARACION':
        return {
          color: colors.info,
          bgColor: colors.infoLight,
          label: 'En Preparación',
          icon: '🔧'
        };
      case 'FACTURADO':
        return {
          color: colors.invoice,
          bgColor: colors.invoiceLight,
          label: 'Facturado',
          icon: '📄'
        };
      case 'ENTREGADO':
        return {
          color: colors.success,
          bgColor: colors.successLight,
          label: 'Entregado',
          icon: '✓'
        };
      case 'RECHAZADO':
        return {
          color: colors.error,
          bgColor: colors.errorLight,
          label: 'Rechazado',
          icon: '✕'
        };
      default:
        return {
          color: colors.textSecondary,
          bgColor: colors.borderLight,
          label: estado,
          icon: '?'
        };
    }
  };

  const estadoConfig = getEstadoConfig(pedido.estado);

  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.id}>
              Pedido #{pedido.id}
            </Text>
            <Text style={styles.date}>
              {formatDate(pedido.fecha_creacion, 'short')}
            </Text>
          </View>
          <Chip
            style={[styles.estadoChip, { backgroundColor: estadoConfig.bgColor }]}
            textStyle={[styles.estadoText, { color: estadoConfig.color }]}
            compact
          >
            {estadoConfig.label}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {/* Detalles */}
        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.label}>Items</Text>
            <Text style={styles.value}>{pedido.items.length} producto{pedido.items.length !== 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>{formatPrice(pedido.subtotal)}</Text>
          </View>

          {parseFloat(pedido.descuento_total) > 0 && (
            <View style={styles.row}>
              <Text style={[styles.label, styles.discountLabel]}>Descuento</Text>
              <Text style={styles.discountValue}>
                -{formatPrice(pedido.descuento_total)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatPrice(pedido.total)}
            </Text>
          </View>
        </View>

        {/* Notas */}
        {pedido.notas && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>📝 Notas:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {pedido.notas}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  id: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  date: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  estadoChip: {
    borderRadius: borderRadius.lg,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  details: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  discountLabel: {
    color: colors.success,
  },
  discountValue: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  notesContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.sm,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default PedidoCard;

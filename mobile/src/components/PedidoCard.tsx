import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Divider } from 'react-native-paper';
import { Pedido } from '@/types';
import { theme, spacing, colors, getEstadoColor as getEstadoColorHelper } from '@/theme';
import { formatPrice, formatDate } from '@/utils';

interface PedidoCardProps {
  pedido: Pedido;
  onPress?: () => void;
}

/**
 * PedidoCard
 * Tarjeta reutilizable para mostrar pedidos
 */
const PedidoCard: React.FC<PedidoCardProps> = ({ pedido, onPress }) => {

  const getEstadoColor = (estado: string) => {
    return getEstadoColorHelper(estado);
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'CONFIRMADO':
        return 'Confirmado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium" style={styles.id}>
              Pedido #{pedido.id}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(pedido.fecha_creacion, 'short')}
            </Text>
          </View>
          <Chip
            style={[
              styles.estadoChip,
              { backgroundColor: getEstadoColor(pedido.estado) + '20' },
            ]}
            textStyle={[
              styles.estadoText,
              { color: getEstadoColor(pedido.estado) },
            ]}
          >
            {getEstadoLabel(pedido.estado)}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.details}>
          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>
              Items:
            </Text>
            <Text variant="bodyMedium">{pedido.items.length}</Text>
          </View>

          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>
              Subtotal:
            </Text>
            <Text variant="bodyMedium">{formatPrice(pedido.subtotal)}</Text>
          </View>

          {parseFloat(pedido.descuento_total) > 0 && (
            <View style={styles.row}>
              <Text variant="bodyMedium" style={[styles.label, styles.discount]}>
                Descuento:
              </Text>
              <Text variant="bodyMedium" style={styles.discount}>
                -{formatPrice(pedido.descuento_total)}
              </Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Text variant="titleMedium" style={styles.totalLabel}>
              Total:
            </Text>
            <Text variant="titleLarge" style={styles.total}>
              {formatPrice(pedido.total)}
            </Text>
          </View>
        </View>

        {pedido.notas && (
          <View style={styles.notes}>
            <Text variant="bodySmall" style={styles.notesLabel}>
              Notas:
            </Text>
            <Text variant="bodySmall" numberOfLines={2}>
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
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  id: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  date: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  estadoChip: {
    height: 32,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  details: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.onSurfaceVariant,
  },
  discount: {
    color: colors.success,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  total: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  notes: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  notesLabel: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
});

export default PedidoCard;

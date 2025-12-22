import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, Avatar, Button } from 'react-native-paper';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { TransportadorDrawerParamList, TransportadorStackParamList } from '@/navigation/TransportadorStack';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFetch } from '@/hooks';
import { pedidosTransportadorAPI } from '@/services/api';
import { LoadingOverlay, ScreenContainer, EmptyState, PedidoCard } from '@/components';
import { useAppSelector } from '@/store';
import { colors, spacing, borderRadius } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PedidoTransportador } from '@/types';

type Props = CompositeScreenProps<
  DrawerScreenProps<TransportadorDrawerParamList, 'TransportadorHome'>,
  NativeStackScreenProps<TransportadorStackParamList>
>;

/**
 * TransportadorHomeScreen
 * 
 * Dashboard del transportador con lista de pedidos asignados para entregar.
 */
const TransportadorHomeScreen = ({ navigation }: Props) => {
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = React.useState(false);

  const { 
    data: pedidosData, 
    loading, 
    refetch 
  } = useFetch(() => pedidosTransportadorAPI.getMisPedidos());

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const pedidos: PedidoTransportador[] = Array.isArray(pedidosData) 
    ? pedidosData 
    : (pedidosData?.results || []);

  const iniciales = user ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}` : 'TR';

  const handlePedidoPress = (pedidoId: number) => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('PedidoDetalle', { pedidoId });
    }
  };

  return (
    <ScreenContainer>
      {loading && !refreshing && <LoadingOverlay visible message="Cargando pedidos..." />}
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium" style={styles.title}>Entregas</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>Hola, {user?.nombre}</Text>
          </View>
          <Avatar.Text size={48} label={iniciales} style={styles.avatar} />
        </View>

        {/* Resumen */}
        <Surface style={styles.summaryCard} elevation={2}>
          <View style={styles.summaryHeader}>
            <Icon name="truck-delivery" size={32} color={colors.primary} />
            <Text variant="headlineSmall" style={styles.summaryValue}>
              {pedidos.length}
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.summaryLabel}>
            Pedidos por entregar
          </Text>
          <Text variant="bodySmall" style={styles.summaryDescription}>
            Pedidos facturados asignados a ti
          </Text>
        </Surface>

        {/* Lista de Pedidos */}
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Pedidos Asignados
        </Text>

        {pedidos.length === 0 ? (
          <EmptyState
            icon="truck-check"
            title="Sin pedidos pendientes"
            message="No tienes pedidos asignados para entregar en este momento."
          />
        ) : (
          <View style={styles.pedidosList}>
            {pedidos.map((pedido) => (
              <PedidoCardTransportador
                key={pedido.id}
                pedido={pedido}
                onPress={() => handlePedidoPress(pedido.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

/**
 * Card personalizada para mostrar pedido con info de cliente.
 */
interface PedidoCardTransportadorProps {
  pedido: PedidoTransportador;
  onPress: () => void;
}

const PedidoCardTransportador = ({ pedido, onPress }: PedidoCardTransportadorProps) => {
  const clienteInfo = pedido.cliente_info;
  
  // Construir dirección completa
  const direccionCompleta = [
    clienteInfo?.calle,
    clienteInfo?.numero,
    clienteInfo?.entre_calles ? `(${clienteInfo.entre_calles})` : null,
  ].filter(Boolean).join(' ');

  return (
    <Surface style={styles.pedidoCard} elevation={1}>
      <View style={styles.pedidoHeader}>
        <View>
          <Text variant="titleMedium" style={styles.pedidoTitle}>
            Pedido #{pedido.id}
          </Text>
          <Text variant="bodySmall" style={styles.pedidoCliente}>
            {pedido.cliente_nombre}
          </Text>
        </View>
        <Text variant="titleMedium" style={styles.pedidoTotal}>
          ${parseFloat(pedido.total).toLocaleString('es-AR')}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Información de entrega */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={18} color={colors.primary} />
          <Text variant="bodySmall" style={styles.infoText}>
            {direccionCompleta || clienteInfo?.direccion || 'Sin dirección'}
          </Text>
        </View>
        
        {clienteInfo?.zona_nombre && (
          <View style={styles.infoRow}>
            <Icon name="map" size={18} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.infoText}>
              Zona: {clienteInfo.zona_nombre}
            </Text>
          </View>
        )}
        
        {clienteInfo?.telefono && (
          <View style={styles.infoRow}>
            <Icon name="phone" size={18} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.infoText}>
              {clienteInfo.telefono}
            </Text>
          </View>
        )}
      </View>

      <Button
        mode="contained"
        onPress={onPress}
        style={styles.verDetalleButton}
        icon="eye"
      >
        Ver Detalle
      </Button>
    </Surface>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySurface,
    marginBottom: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryValue: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryLabel: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  summaryDescription: {
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
    color: colors.text,
  },
  pedidosList: {
    gap: spacing.md,
  },
  pedidoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  pedidoTitle: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  pedidoCliente: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pedidoTotal: {
    fontWeight: 'bold',
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  infoSection: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    color: colors.text,
    flex: 1,
  },
  verDetalleButton: {
    backgroundColor: colors.primary,
  },
});

export default TransportadorHomeScreen;


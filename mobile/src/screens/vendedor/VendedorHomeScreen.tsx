import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, Avatar } from 'react-native-paper';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { VendedorDrawerParamList, VendedorStackParamList } from '@/navigation/VendedorStack';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFetch } from '@/hooks';
import { pedidosAPI, productosAPI } from '@/services/api';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { useAppSelector } from '@/store';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = CompositeScreenProps<
  DrawerScreenProps<VendedorDrawerParamList, 'VendedorHome'>,
  NativeStackScreenProps<VendedorStackParamList>
>;

interface DashboardStats {
  totalPedidos: number;
  ventasDelDia: number;
  productosSinStock: number;
}

/**
 * VendedorHomeScreen
 * 
 * Dashboard del vendedor con KPIs principales
 */
const VendedorHomeScreen = ({ navigation }: Props) => {
  const { user } = useAppSelector((state) => state.auth);

  const { data: pedidos, loading: loadingPedidos, refetch: refetchPedidos } = useFetch(
    () => pedidosAPI.getAll({ estado__in: 'PENDIENTE,CONFIRMADO' })
  );

  const { data: ventasHoy, loading: loadingVentas, refetch: refetchVentas } = useFetch(
    () => pedidosAPI.getAll({ fecha_pedido__gte: new Date().toISOString().split('T')[0] })
  );

  const { data: productosSinStock, loading: loadingProductos, refetch: refetchProductos } = useFetch(
    () => productosAPI.getAll({ tiene_stock: false, activo: true })
  );

  useFocusEffect(
    React.useCallback(() => {
      refetchPedidos();
      refetchVentas();
      refetchProductos();
    }, [])
  );

  const loading = loadingPedidos || loadingVentas || loadingProductos;

  const pedidosArray = Array.isArray(pedidos) ? pedidos : (pedidos?.results || []);
  const ventasHoyArray = Array.isArray(ventasHoy) ? ventasHoy : (ventasHoy?.results || []);
  const productosSinStockArray = Array.isArray(productosSinStock) 
    ? productosSinStock 
    : (productosSinStock?.results || []);

  const stats: DashboardStats = {
    totalPedidos: pedidosArray.length,
    ventasDelDia: ventasHoyArray.reduce((acc, p) => {
      const total = parseFloat(p.total);
      return acc + (isNaN(total) ? 0 : total);
    }, 0),
    productosSinStock: productosSinStockArray.length,
  };

  const iniciales = user ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}` : 'VE';

  return (
    <ScreenContainer>
      {loading && <LoadingOverlay visible message="Cargando estadísticas..." />}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium" style={styles.title}>Dashboard</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>Hola, {user?.nombre}</Text>
          </View>
          <Avatar.Text size={48} label={iniciales} style={styles.avatar} />
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <Surface style={[styles.kpiCard, styles.kpiCardPrimary]} elevation={2}>
            <View style={styles.kpiHeader}>
              <Icon name="package-variant" size={32} color={colors.primary} />
              <Text variant="headlineSmall" style={[styles.kpiValue, { color: colors.primary }]}>
                {stats.totalPedidos}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Pedidos Activos</Text>
            <Text variant="bodySmall" style={styles.kpiDescription}>
              Pendientes y confirmados
            </Text>
          </Surface>

          <Surface style={[styles.kpiCard, styles.kpiCardSecondary]} elevation={2}>
            <View style={styles.kpiHeader}>
              <Icon name="cash-multiple" size={32} color={colors.accent} />
              <Text variant="headlineSmall" style={[styles.kpiValue, { color: colors.accent }]}>
                {formatPrice(stats.ventasDelDia)}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Ventas del Día</Text>
            <Text variant="bodySmall" style={styles.kpiDescription}>
              Total de pedidos de hoy
            </Text>
          </Surface>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('ProductosSinStock')}
          >
            <Surface style={[styles.kpiCard, styles.kpiCardError]} elevation={2}>
              <View style={styles.kpiHeader}>
                <Icon name="alert-circle-outline" size={32} color={colors.error} />
                <Text variant="headlineSmall" style={[styles.kpiValue, { color: colors.error }]}>
                  {stats.productosSinStock}
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.kpiLabel}>Sin Stock</Text>
              <Text variant="bodySmall" style={styles.kpiDescription}>
                Productos sin disponibilidad
              </Text>
            </Surface>
          </TouchableOpacity>
        </View>

        {/* Accesos Rápidos */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Clientes')}
            style={styles.actionTouchable}
          >
            <Surface style={styles.actionCard} elevation={1}>
              <Icon name="account-group" size={40} color={colors.primary} />
              <Text variant="titleMedium" style={styles.actionTitle}>Clientes</Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Ver listado de clientes
              </Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Pedidos')}
            style={styles.actionTouchable}
          >
            <Surface style={styles.actionCard} elevation={1}>
              <Icon name="clipboard-list" size={40} color={colors.primary} />
              <Text variant="titleMedium" style={styles.actionTitle}>Pedidos</Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Gestionar pedidos
              </Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('NuevoPedido')}
            style={styles.nuevoPedidoButton}
          >
            <Surface style={styles.actionCardFull} elevation={1}>
              <Icon name="plus-circle" size={40} color={colors.accent} />
              <Text variant="titleMedium" style={styles.actionTitle}>Nuevo Pedido</Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Crear pedido manual
              </Text>
            </Surface>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
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
  kpiContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  kpiCardPrimary: {
    backgroundColor: colors.primarySurface,
  },
  kpiCardSecondary: {
    backgroundColor: colors.accentLight + '30',
  },
  kpiCardError: {
    backgroundColor: colors.errorLight,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  kpiValue: {
    fontWeight: 'bold',
  },
  kpiLabel: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  kpiDescription: {
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
    color: colors.text,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionTouchable: {
    flex: 1,
    minWidth: '45%',
  },
  actionCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  nuevoPedidoButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  actionCardFull: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  actionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '600',
    color: colors.text,
  },
  actionDescription: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
});

export default VendedorHomeScreen;

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Avatar } from 'react-native-paper';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { VendedorDrawerParamList, VendedorStackParamList } from '@/navigation/VendedorStack';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFetch } from '@/hooks';
import { pedidosAPI, productosAPI } from '@/services/api';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { useAppSelector } from '@/store';
import { spacing, colors as themeColors } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = CompositeScreenProps<
  DrawerScreenProps<VendedorDrawerParamList, 'VendedorHome'>,
  NativeStackScreenProps<VendedorStackParamList>
>;

interface DashboardStats {
  totalPedidos: number;
  ventasDelDia: number;
  productosConBajoStock: number;
}

/**
 * VendedorHomeScreen
 * 
 * Dashboard del vendedor con KPIs principales:
 * - Total de pedidos activos
 * - Ventas del día
 * - Productos con bajo stock
 */
const VendedorHomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  // Fetch pedidos activos (no cancelados)
  const { data: pedidos, loading: loadingPedidos, refetch: refetchPedidos } = useFetch(
    () => pedidosAPI.getAll({ estado__in: 'PENDIENTE,CONFIRMADO' })
  );

  // Fetch ventas del día (pedidos confirmados de hoy)
  const { data: ventasHoy, loading: loadingVentas, refetch: refetchVentas } = useFetch(
    () => pedidosAPI.getAll({ fecha_pedido__gte: new Date().toISOString().split('T')[0] })
  );

  // Fetch productos con stock bajo (< 10)
  const { data: productosBajoStock, loading: loadingProductos, refetch: refetchProductos } = useFetch(
    () => productosAPI.getAll({ stock__lt: 10, activo: true })
  );

  useFocusEffect(
    React.useCallback(() => {
      refetchPedidos();
      refetchVentas();
      refetchProductos();
    }, [])
  );

  const loading = loadingPedidos || loadingVentas || loadingProductos;

  // Filtrar productos con stock < 10 (doble verificación)
  const productosBajoStockFiltrados = productosBajoStock?.results?.filter(
    (p: any) => p.stock < 10
  ) || [];

  const stats: DashboardStats = {
    totalPedidos: pedidos?.results?.length || 0,
    ventasDelDia: ventasHoy?.results?.reduce((acc, p) => acc + parseFloat(p.total), 0) || 0,
    productosConBajoStock: productosBajoStockFiltrados.length,
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
          <Avatar.Text size={48} label={iniciales} style={{ backgroundColor: colors.tertiary }} />
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          {/* Total Pedidos Activos */}
          <Surface style={[styles.kpiCard, { backgroundColor: colors.primaryContainer }]} elevation={2}>
            <View style={styles.kpiHeader}>
              <Icon name="package-variant" size={32} color={colors.primary} />
              <Text variant="headlineSmall" style={[styles.kpiValue, { color: colors.primary }]}>
                {stats.totalPedidos}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Pedidos Activos</Text>
            <Text variant="bodySmall" style={styles.kpiDescription}>
              Pendientes, confirmados y en camino
            </Text>
          </Surface>

          {/* Ventas del Día */}
          <Surface style={[styles.kpiCard, { backgroundColor: themeColors.successContainer }]} elevation={2}>
            <View style={styles.kpiHeader}>
              <Icon name="cash-multiple" size={32} color={themeColors.success} />
              <Text variant="headlineSmall" style={[styles.kpiValue, { color: themeColors.success }]}>
                {formatPrice(stats.ventasDelDia)}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Ventas del Día</Text>
            <Text variant="bodySmall" style={styles.kpiDescription}>
              Total de pedidos de hoy
            </Text>
          </Surface>

          {/* Productos con Bajo Stock */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('ProductosBajoStock')}
          >
            <Surface 
              style={[styles.kpiCard, { backgroundColor: colors.errorContainer }]} 
              elevation={2}
            >
            <View style={styles.kpiHeader}>
              <Icon name="alert-circle-outline" size={32} color={colors.error} />
              <Text variant="headlineSmall" style={[styles.kpiValue, { color: colors.error }]}>
                {stats.productosConBajoStock}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Stock Bajo</Text>
            <Text variant="bodySmall" style={styles.kpiDescription}>
              Productos con menos de 10 unidades
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
              <Icon name="plus-circle" size={40} color={colors.secondary} />
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
  },
  subtitle: {
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  kpiContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    padding: spacing.lg,
    borderRadius: 12,
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
  },
  kpiDescription: {
    opacity: 0.7,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  nuevoPedidoButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  actionCardFull: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  actionDescription: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default VendedorHomeScreen;

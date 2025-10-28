import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { useFetch } from '@/hooks';
import { pedidosAPI, productosAPI } from '@/services/api';
import { LoadingOverlay } from '@/components';
import { spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList, 'VendedorHome'>;

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

  // Fetch pedidos activos (no cancelados ni entregados)
  const { data: pedidos, loading: loadingPedidos } = useFetch(
    () => pedidosAPI.getAll({ estado__in: 'PENDIENTE,CONFIRMADO,EN_CAMINO' })
  );

  // Fetch ventas del día (pedidos confirmados de hoy)
  const { data: ventasHoy, loading: loadingVentas } = useFetch(
    () => pedidosAPI.getAll({ fecha_pedido__gte: new Date().toISOString().split('T')[0] })
  );

  // Fetch productos con stock bajo (< 10)
  const { data: productosBajoStock, loading: loadingProductos } = useFetch(
    () => productosAPI.getAll({ stock__lt: 10 })
  );

  const loading = loadingPedidos || loadingVentas || loadingProductos;

  const stats: DashboardStats = {
    totalPedidos: pedidos?.results?.length || 0,
    ventasDelDia: ventasHoy?.results?.reduce((acc, p) => acc + parseFloat(p.total), 0) || 0,
    productosConBajoStock: productosBajoStock?.results?.length || 0,
  };

  return (
    <View style={styles.container}>
      {loading && <LoadingOverlay visible message="Cargando estadísticas..." />}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>Dashboard</Text>

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
          <Surface style={[styles.kpiCard, { backgroundColor: colors.secondaryContainer }]} elevation={2}>
            <View style={styles.kpiHeader}>
              <Icon name="cash-multiple" size={32} color={colors.secondary} />
              <Text variant="headlineSmall" style={[styles.kpiValue, { color: colors.secondary }]}>
                ${stats.ventasDelDia.toFixed(2)}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Ventas del Día</Text>
            <Text variant="bodySmall" style={styles.kpiDescription}>
              Total de pedidos de hoy
            </Text>
          </Surface>

          {/* Productos con Bajo Stock */}
          <Surface style={[styles.kpiCard, { backgroundColor: colors.errorContainer }]} elevation={2}>
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
        </View>

        {/* Accesos Rápidos */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <View style={styles.quickActionsContainer}>
          <Surface
            style={styles.actionCard}
            elevation={1}
            onTouchEnd={() => navigation.navigate('ClientesList')}
          >
            <Icon name="account-group" size={40} color={colors.primary} />
            <Text variant="titleMedium" style={styles.actionTitle}>Clientes</Text>
            <Text variant="bodySmall" style={styles.actionDescription}>
              Ver listado de clientes
            </Text>
          </Surface>

          <Surface
            style={styles.actionCard}
            elevation={1}
            onTouchEnd={() => navigation.navigate('PedidosList')}
          >
            <Icon name="clipboard-list" size={40} color={colors.primary} />
            <Text variant="titleMedium" style={styles.actionTitle}>Pedidos</Text>
            <Text variant="bodySmall" style={styles.actionDescription}>
              Gestionar pedidos
            </Text>
          </Surface>

          <Surface
            style={styles.actionCard}
            elevation={1}
            onTouchEnd={() => navigation.navigate('NuevoPedido')}
          >
            <Icon name="plus-circle" size={40} color={colors.secondary} />
            <Text variant="titleMedium" style={styles.actionTitle}>Nuevo Pedido</Text>
            <Text variant="bodySmall" style={styles.actionDescription}>
              Crear pedido manual
            </Text>
          </Surface>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  title: {
    marginBottom: spacing.lg,
    fontWeight: 'bold',
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

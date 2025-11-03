import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useFetch } from '@/hooks';
import { clientesAPI, productosAPI, pedidosAPI } from '@/services/api';
import { LoadingOverlay } from '@/components';
import { spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * AdminHomeScreen - Dashboard del administrador
 * KPIs globales: usuarios, productos, pedidos del mes
 */
const AdminHomeScreen = () => {
  const { colors } = useTheme();

  const { data: usuarios, loading: loadingUsuarios } = useFetch(() => clientesAPI.getAll());
  const { data: productos, loading: loadingProductos } = useFetch(() => productosAPI.getAll());
  const { data: pedidos, loading: loadingPedidos } = useFetch(() => pedidosAPI.getAll());

  const loading = loadingUsuarios || loadingProductos || loadingPedidos;

  const stats = {
    totalUsuarios: usuarios?.count || 0,
    productosActivos: productos?.results?.filter((p: any) => p.activo).length || 0,
    pedidosMes: pedidos?.results?.filter((p: any) => {
      const fechaPedido = new Date(p.fecha_pedido);
      const hoy = new Date();
      return fechaPedido.getMonth() === hoy.getMonth() && fechaPedido.getFullYear() === hoy.getFullYear();
    }).length || 0,
    ventasMes: pedidos?.results?.reduce((acc: number, p: any) => acc + parseFloat(p.total), 0) || 0,
  };

  return (
    <View style={styles.container}>
      {loading && <LoadingOverlay visible message="Cargando estadísticas..." />}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>Dashboard Administrativo</Text>

        <View style={styles.kpiContainer}>
          <Surface style={[styles.kpiCard, { backgroundColor: colors.primaryContainer }]} elevation={2}>
            <Icon name="account-group" size={40} color={colors.primary} />
            <Text variant="headlineLarge" style={[styles.kpiValue, { color: colors.primary }]}>
              {stats.totalUsuarios}
            </Text>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Usuarios Totales</Text>
          </Surface>

          <Surface style={[styles.kpiCard, { backgroundColor: colors.secondaryContainer }]} elevation={2}>
            <Icon name="package-variant" size={40} color={colors.secondary} />
            <Text variant="headlineLarge" style={[styles.kpiValue, { color: colors.secondary }]}>
              {stats.productosActivos}
            </Text>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Productos Activos</Text>
          </Surface>

          <Surface style={[styles.kpiCard, { backgroundColor: colors.tertiaryContainer }]} elevation={2}>
            <Icon name="chart-line" size={40} color={colors.tertiary} />
            <Text variant="headlineLarge" style={[styles.kpiValue, { color: colors.tertiary }]}>
              {stats.pedidosMes}
            </Text>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Pedidos del Mes</Text>
          </Surface>

          <Surface style={[styles.kpiCard, { backgroundColor: '#E8F5E9' }]} elevation={2}>
            <Icon name="cash-multiple" size={40} color="#4CAF50" />
            <Text variant="headlineLarge" style={[styles.kpiValue, { color: '#4CAF50' }]}>
              ${!isNaN(stats.ventasMes) ? stats.ventasMes.toFixed(2) : '0.00'}
            </Text>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Ventas del Mes</Text>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  kpiValue: {
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  kpiLabel: {
    marginTop: spacing.xs,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default AdminHomeScreen;

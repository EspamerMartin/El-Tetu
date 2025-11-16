import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useFetch } from '@/hooks';
import { clientesAPI, productosAPI, pedidosAPI } from '@/services/api';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { useAppSelector } from '@/store';
import { spacing } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * AdminHomeScreen - Dashboard del administrador
 * KPIs globales: usuarios, productos, pedidos del mes
 */
const AdminHomeScreen = () => {
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  const { data: usuarios, loading: loadingUsuarios, refetch: refetchUsuarios } = useFetch(() => clientesAPI.getAll());
  const { data: productos, loading: loadingProductos, refetch: refetchProductos } = useFetch(() => productosAPI.getAll());
  const { data: pedidos, loading: loadingPedidos, refetch: refetchPedidos } = useFetch(() => pedidosAPI.getAll());

  useFocusEffect(
    React.useCallback(() => {
      refetchUsuarios();
      refetchProductos();
      refetchPedidos();
    }, [])
  );

  const loading = loadingUsuarios || loadingProductos || loadingPedidos;

  const hoy = new Date();
  
  // Pedidos del mes (todos los estados)
  const pedidosMes = pedidos?.results?.filter((p: any) => {
    const fechaPedido = new Date(p.fecha_creacion);
    return fechaPedido.getMonth() === hoy.getMonth() && 
           fechaPedido.getFullYear() === hoy.getFullYear();
  }) || [];

  // Pedidos aprobados del mes (solo CONFIRMADO, EN_CAMINO, ENTREGADO)
  const pedidosAprobadosMes = pedidosMes.filter((p: any) => 
    ['CONFIRMADO', 'EN_CAMINO', 'ENTREGADO'].includes(p.estado)
  );

  const stats = {
    totalUsuarios: usuarios?.count || 0,
    productosActivos: productos?.results?.filter((p: any) => p.activo).length || 0,
    pedidosMes: pedidosMes.length,
    ventasMes: pedidosAprobadosMes.reduce((acc: number, p: any) => {
      const total = parseFloat(p.total) || 0;
      return acc + total;
    }, 0),
  };

  const iniciales = user ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}` : 'AD';

  return (
    <ScreenContainer>
      {loading && <LoadingOverlay visible message="Cargando estadísticas..." />}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium" style={styles.title}>Dashboard</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>Bienvenido, {user?.nombre}</Text>
          </View>
          <Avatar.Text size={48} label={iniciales} style={{ backgroundColor: colors.primary }} />
        </View>

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
              {formatPrice(stats.ventasMes)}
            </Text>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Ventas del Mes</Text>
          </Surface>
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

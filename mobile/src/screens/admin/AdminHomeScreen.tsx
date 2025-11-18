import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminDrawerParamList } from '@/navigation/AdminStack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { clientesAPI, productosAPI, pedidosAPI } from '@/services/api';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { useAppSelector } from '@/store';
import { spacing, colors } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = CompositeScreenProps<
  DrawerScreenProps<AdminDrawerParamList, 'AdminHome'>,
  NativeStackScreenProps<AdminStackParamList>
>;

/**
 * AdminHomeScreen - Dashboard del administrador
 * KPIs globales: usuarios, productos, pedidos del mes, productos con bajo stock
 */
const AdminHomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  const { data: usuarios, loading: loadingUsuarios, refetch: refetchUsuarios } = useFetch(() => clientesAPI.getAll());
  const { data: productos, loading: loadingProductos, refetch: refetchProductos } = useFetch(() => productosAPI.getAll());
  const { data: pedidos, loading: loadingPedidos, refetch: refetchPedidos } = useFetch(() => pedidosAPI.getAll());
  const { data: productosBajoStock, loading: loadingBajoStock, refetch: refetchBajoStock } = useFetch(
    () => productosAPI.getAll({ stock__lt: 10, activo: true })
  );

  useFocusEffect(
    React.useCallback(() => {
      refetchUsuarios();
      refetchProductos();
      refetchPedidos();
      refetchBajoStock();
    }, [])
  );

  const loading = loadingUsuarios || loadingProductos || loadingPedidos || loadingBajoStock;

  const hoy = new Date();
  
  // Pedidos del mes (todos los estados)
  const pedidosMes = pedidos?.results?.filter((p: any) => {
    const fechaPedido = new Date(p.fecha_creacion);
    return fechaPedido.getMonth() === hoy.getMonth() && 
           fechaPedido.getFullYear() === hoy.getFullYear();
  }) || [];

  // Pedidos aprobados del mes (solo CONFIRMADO)
  const pedidosAprobadosMes = pedidosMes.filter((p: any) => 
    p.estado === 'CONFIRMADO'
  );

  // Filtrar productos con stock < 10 (doble verificación)
  const productosBajoStockFiltrados = productosBajoStock?.results?.filter(
    (p: any) => p.stock < 10
  ) || [];

  const stats = {
    totalUsuarios: usuarios?.count || 0,
    productosActivos: productos?.results?.filter((p: any) => p.activo).length || 0,
    pedidosMes: pedidosMes.length,
    ventasMes: pedidosAprobadosMes.reduce((acc: number, p: any) => {
      const total = parseFloat(p.total) || 0;
      return acc + total;
    }, 0),
    productosConBajoStock: productosBajoStockFiltrados.length,
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

          <Surface style={[styles.kpiCard, { backgroundColor: colors.successContainer }]} elevation={2}>
            <Icon name="cash-multiple" size={40} color={colors.success} />
            <Text variant="headlineLarge" style={[styles.kpiValue, { color: colors.success }]}>
              {formatPrice(stats.ventasMes)}
            </Text>
            <Text variant="bodyMedium" style={styles.kpiLabel}>Ventas del Mes</Text>
          </Surface>

          {/* Productos con Bajo Stock */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('ProductosBajoStock')}
            style={styles.kpiCardTouchableFull}
          >
            <Surface 
              style={[styles.kpiCardFull, { backgroundColor: colors.errorContainer }]} 
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
                {stats.productosConBajoStock === 0 
                  ? 'Todos los productos tienen stock suficiente'
                  : stats.productosConBajoStock === 1
                  ? '1 producto con menos de 10 unidades'
                  : `${stats.productosConBajoStock} productos con menos de 10 unidades`}
              </Text>
            </Surface>
          </TouchableOpacity>
        </View>

        {/* Accesos Rápidos */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Usuarios')}
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
  kpiCardFull: {
    width: '100%',
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
  kpiCardTouchableFull: {
    width: '100%',
  },
  sectionTitle: {
    marginTop: spacing.lg,
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

export default AdminHomeScreen;

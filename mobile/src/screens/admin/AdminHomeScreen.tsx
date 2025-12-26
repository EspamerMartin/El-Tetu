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
import { pedidosAPI } from '@/services/api';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { useAppSelector } from '@/store';
import { spacing } from '@/theme';
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

  // Usar el endpoint de estadísticas de admin
  const { data: estadisticas, loading, refetch } = useFetch(
    () => pedidosAPI.getEstadisticasAdmin()
  );

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  const stats = {
    totalUsuarios: estadisticas?.total_usuarios || 0,
    productosActivos: estadisticas?.productos_activos || 0,
    pedidosMes: estadisticas?.pedidos_mes || 0,
    ventasMes: estadisticas?.ventas_mes || 0,
    productosSinStock: estadisticas?.productos_sin_stock || 0,
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

          {/* Productos sin Stock */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('ProductosSinStock')}
            style={styles.kpiCardTouchableFull}
          >
            <Surface
              style={[styles.kpiCardFull, { backgroundColor: colors.errorContainer }]}
              elevation={2}
            >
              <View style={styles.kpiHeader}>
                <Icon name="alert-circle-outline" size={32} color={colors.error} />
                <Text variant="headlineSmall" style={[styles.kpiValue, { color: colors.error }]}>
                  {stats.productosSinStock}
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.kpiLabel}>Sin Stock</Text>
              <Text variant="bodySmall" style={styles.kpiDescription}>
                {stats.productosSinStock === 0
                  ? 'Todos los productos tienen stock disponible'
                  : stats.productosSinStock === 1
                    ? '1 producto sin stock disponible'
                    : `${stats.productosSinStock} productos sin stock disponible`}
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
              <Text variant="titleMedium" style={styles.actionTitle}>Usuarios</Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Ver listado de usuarios
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

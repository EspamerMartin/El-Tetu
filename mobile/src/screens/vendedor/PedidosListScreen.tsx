import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Chip, FAB } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { useFetch } from '@/hooks';
import { pedidosAPI } from '@/services/api';
import { PedidoCard, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList, 'PedidosList'>;

type EstadoFilter = 'TODOS' | 'PENDIENTE' | 'CONFIRMADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

/**
 * PedidosListScreen
 * 
 * Lista de todos los pedidos con filtros por estado.
 */
const PedidosListScreen = ({ navigation }: Props) => {
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS');

  const { data: pedidosData, loading, refetch } = useFetch(
    () => pedidosAPI.getAll(estadoFilter === 'TODOS' ? {} : { estado: estadoFilter })
  );

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  const pedidos = pedidosData?.results || [];

  const handlePedidoPress = (pedidoId: number) => {
    navigation.navigate('PedidoDetalle', { pedidoId });
  };

  const estados: { value: EstadoFilter; label: string; icon: string }[] = [
    { value: 'TODOS', label: 'Todos', icon: 'view-list' },
    { value: 'PENDIENTE', label: 'Pendiente', icon: 'clock-outline' },
    { value: 'CONFIRMADO', label: 'Confirmado', icon: 'check-circle' },
    { value: 'EN_CAMINO', label: 'En Camino', icon: 'truck-delivery' },
    { value: 'ENTREGADO', label: 'Entregado', icon: 'package-variant-closed' },
    { value: 'CANCELADO', label: 'Cancelado', icon: 'close-circle' },
  ];

  return (
    <View style={styles.container}>
      {/* Filtros por Estado */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={estados}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <Chip
              icon={item.icon}
              selected={estadoFilter === item.value}
              onPress={() => setEstadoFilter(item.value)}
              style={styles.filterChip}
            >
              {item.label}
            </Chip>
          )}
        />
      </View>

      {/* Lista de Pedidos */}
      {loading ? (
        <LoadingOverlay visible message="Cargando pedidos..." />
      ) : (
        <FlatList
          data={pedidos}
          renderItem={({ item }) => (
            <PedidoCard
              pedido={item}
              onPress={() => handlePedidoPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="clipboard-off" size={64} color={theme.colors.outline} />
              <Text variant="titleMedium" style={styles.emptyText}>
                No hay pedidos
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                {estadoFilter === 'TODOS' 
                  ? 'Aún no hay pedidos registrados'
                  : `No hay pedidos con estado "${estados.find(e => e.value === estadoFilter)?.label}"`
                }
              </Text>
            </View>
          }
        />
      )}

      {/* FAB para crear nuevo pedido */}
      <FAB
        icon="plus"
        label="Nuevo Pedido"
        style={styles.fab}
        onPress={() => navigation.navigate('NuevoPedido')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
    paddingVertical: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.xs,
  },
  list: {
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    color: theme.colors.outline,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
});

export default PedidosListScreen;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useFetch } from '@/hooks';
import { pedidosAPI } from '@/services/api';
import { PedidoCard, LoadingOverlay } from '@/components';
import { theme, spacing, colors } from '@/theme';

/**
 * PedidosAdminListScreen - Todos los pedidos con filtros (admin)
 */
const PedidosAdminListScreen = ({ navigation }: any) => {
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);

  const { data: pedidosData, loading, refetch } = useFetch(
    () => pedidosAPI.getAll(estadoFilter ? { estado: estadoFilter } : {})
  );

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  // Refetch cuando cambie el filtro de estado
  useEffect(() => {
    refetch();
  }, [estadoFilter]);

  const pedidos = pedidosData?.results || [];

  // Filtros para todos los estados
  const estados: { value: string | null; label: string; icon: string }[] = [
    { value: null, label: 'Todos', icon: 'view-list' },
    { value: 'PENDIENTE', label: 'Pendientes', icon: 'clock-outline' },
    { value: 'CONFIRMADO', label: 'Aprobados', icon: 'check-circle' },
    { value: 'CANCELADO', label: 'Cancelados', icon: 'close-circle' },
  ];

  return (
    <View style={styles.container}>
      {/* Filtros por Estado */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={estados}
          keyExtractor={(item) => item.value || 'todos'}
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

      {loading ? (
        <LoadingOverlay visible message="Cargando pedidos..." />
      ) : (
        <FlatList
          data={pedidos}
          renderItem={({ item }) => (
            <PedidoCard pedido={item} onPress={() => navigation.navigate('PedidoAdminDetalle', { pedidoId: item.id })} />
          )}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={refetch}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  filtersContainer: {
    backgroundColor: colors.surface,
    elevation: 2,
    paddingVertical: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: { marginRight: spacing.xs },
  list: { padding: spacing.md },
});

export default PedidosAdminListScreen;

import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useFetch } from '@/hooks';
import { pedidosAPI } from '@/services/api';
import { PedidoCard, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';

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

  const pedidos = pedidosData?.results || [];

  const estados = ['PENDIENTE', 'CONFIRMADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'];

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <Chip
          selected={!estadoFilter}
          onPress={() => setEstadoFilter(null)}
          style={styles.filterChip}
        >
          Todos
        </Chip>
        {estados.map((estado) => (
          <Chip
            key={estado}
            selected={estadoFilter === estado}
            onPress={() => setEstadoFilter(estado)}
            style={styles.filterChip}
          >
            {estado}
          </Chip>
        ))}
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
  container: { flex: 1, backgroundColor: theme.colors.background },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  filterChip: { marginRight: spacing.xs },
  list: { padding: spacing.md },
});

export default PedidosAdminListScreen;

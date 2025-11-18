import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Chip, Searchbar, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import { useFetch } from '@/hooks';
import { pedidosAPI } from '@/services/api';
import { PedidoCard, LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { theme, spacing } from '@/theme';
import { Pedido } from '@/types';

type EstadoFilter = 'TODOS' | 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO';

interface PedidosListScreenProps {
  navigation: any; // Navigation prop genérico que funciona con ambos stacks
}

/**
 * PedidosListScreen - Pantalla unificada para listar pedidos
 * 
 * Funciona para admin y vendedor con:
 * - Buscador general (client-side)
 * - Filtros por estado (backend)
 * - FAB para crear nuevo pedido
 */
const PedidosListScreen = ({ navigation }: PedidosListScreenProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.rol === 'admin';
  
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter | null>(isAdmin ? null : 'TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  const buildParams = () => {
    const params: { estado?: string } = {};
    // Para admin: null significa "todos", para vendedor: 'TODOS' significa "todos"
    const estadoValue = isAdmin 
      ? (estadoFilter === null ? undefined : estadoFilter)
      : (estadoFilter === 'TODOS' ? undefined : estadoFilter);
    if (estadoValue) {
      params.estado = estadoValue;
    }
    return params;
  };

  const { data: pedidosData, loading, refetch } = useFetch(
    () => pedidosAPI.getAll(buildParams())
  );

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  // Refetch cuando cambie el filtro de estado
  useEffect(() => {
    refetch();
  }, [estadoFilter, refetch]);

  const pedidos = pedidosData?.results || [];
  
  // Filtrado client-side para búsqueda de texto (más rápido que hacer múltiples requests)
  const pedidosFiltrados = searchQuery
    ? pedidos.filter((p: Pedido) => {
        const query = searchQuery.toLowerCase();
        return (
          p.id.toString().includes(query) ||
          p.cliente_nombre?.toLowerCase().includes(query) ||
          p.estado.toLowerCase().includes(query) ||
          p.total.toString().includes(query)
        );
      })
    : pedidos;

  const handlePedidoPress = (pedidoId: number) => {
    // Navegación condicional según rol
    if (isAdmin) {
      navigation.navigate('PedidoAdminDetalle', { pedidoId });
    } else {
      navigation.navigate('PedidoDetalle', { pedidoId });
    }
  };

  const estados: { value: EstadoFilter | null; label: string; icon: string }[] = isAdmin
    ? [
        { value: null, label: 'Todos', icon: 'view-list' },
        { value: 'PENDIENTE', label: 'Pendientes', icon: 'clock-outline' },
        { value: 'CONFIRMADO', label: 'Aprobados', icon: 'check-circle' },
        { value: 'CANCELADO', label: 'Cancelados', icon: 'close-circle' },
      ]
    : [
        { value: 'TODOS', label: 'Todos', icon: 'view-list' },
        { value: 'PENDIENTE', label: 'Pendiente', icon: 'clock-outline' },
        { value: 'CONFIRMADO', label: 'Confirmado', icon: 'check-circle' },
        { value: 'CANCELADO', label: 'Cancelado', icon: 'close-circle' },
      ];

  const getEmptyMessage = () => {
    const isTodos = isAdmin ? estadoFilter === null : estadoFilter === 'TODOS';
    if (isTodos) {
      return 'Aún no hay pedidos registrados';
    }
    const estado = estados.find(e => e.value === estadoFilter);
    return `No hay pedidos con estado "${estado?.label}"`;
  };

  return (
    <ScreenContainer>
      {/* Buscador General */}
      <Searchbar
        placeholder="Buscar pedidos por ID, cliente, estado..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

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

      {/* Lista de Pedidos */}
      {loading ? (
        <LoadingOverlay visible message="Cargando pedidos..." />
      ) : (
        <FlatList
          data={pedidosFiltrados}
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
            <EmptyState
              icon="clipboard-off"
              title="No hay pedidos"
              message={getEmptyMessage()}
            />
          }
        />
      )}

      {/* FAB para crear nuevo pedido */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('NuevoPedido')}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchbar: {
    margin: spacing.md,
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
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
});

export default PedidosListScreen;


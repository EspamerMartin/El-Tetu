import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Card, Chip, IconButton, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { AdminDrawerParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { ProductCard, LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { theme, spacing } from '@/theme';
import { formatPrice } from '@/utils';
import { Producto } from '@/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type EstadoFilter = 'TODOS' | 'ACTIVO' | 'INACTIVO';

type NavigationProp = DrawerNavigationProp<AdminDrawerParamList, 'Productos'>;

const ProductosListScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS');
  
  const { data: productosData, loading, refetch } = useFetch(
    () => productosAPI.getAll(estadoFilter === 'TODOS' ? {} : { activo: estadoFilter === 'ACTIVO' })
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

  const productos = productosData?.results || [];
  const productosFiltrados = searchQuery
    ? productos.filter((p: any) => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    : productos;

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Confirmar',
      '¿Desea eliminar este producto? Si tiene pedidos asociados, solo se desactivará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await productosAPI.delete(id);
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const estados: { value: EstadoFilter; label: string; icon: string }[] = [
    { value: 'TODOS', label: 'Todos', icon: 'view-list' },
    { value: 'ACTIVO', label: 'Activos', icon: 'check-circle' },
    { value: 'INACTIVO', label: 'Inactivos', icon: 'close-circle' },
  ];

  return (
    <ScreenContainer>
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

      <Searchbar placeholder="Buscar productos..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchbar} />

      {loading ? (
        <LoadingOverlay visible message="Cargando productos..." />
      ) : (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item: Producto) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Producto }) => (
            <Card style={styles.card}>
              <Card.Title
                title={item.nombre}
                subtitle={`Stock: ${item.stock}`}
                right={(props) => (
                  <View style={styles.actions}>
                    <IconButton {...props} icon="pencil" onPress={() => navigation.navigate('ProductoForm', { productoId: item.id })} />
                    <IconButton {...props} icon="delete" onPress={() => handleDelete(item.id)} />
                  </View>
                )}
              />
              <Card.Content>
                <Text variant="bodyLarge">{formatPrice(item.precio_base)}</Text>
                <Chip icon={item.activo ? 'check' : 'close'} compact style={styles.chip}>
                  {item.activo ? 'Activo' : 'Inactivo'}
                </Chip>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="package-variant-closed"
              title="No hay productos"
              message="Crea tu primer producto para comenzar"
            />
          }
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('ProductoForm')} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
    paddingVertical: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: { marginRight: spacing.xs },
  searchbar: { margin: spacing.md },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  actions: { flexDirection: 'row' },
  chip: { marginTop: spacing.sm },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default ProductosListScreen;

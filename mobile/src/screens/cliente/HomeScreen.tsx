import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { productosAPI } from '@/services/api';
import { Producto } from '@/types';
import { ProductCard, LoadingOverlay } from '@/components';
import { useAppDispatch } from '@/store';
import { addToCart } from '@/store/slices/cartSlice';
import { colors, spacing, borderRadius, shadows } from '@/theme';

type Props = NativeStackScreenProps<ClienteTabParamList, 'Home'>;

/**
 * HomeScreen (Cliente)
 * 
 * Pantalla principal con listado de productos y búsqueda
 */
const HomeScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async (search?: string) => {
    try {
      setError(null);
      const params: any = { activo: true };
      if (search) {
        params.search = search;
      }
      const data = await productosAPI.getAll(params);
      setProductos(Array.isArray(data) ? data : (data?.results || []));
    } catch (err: any) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProductos(searchQuery);
  };

  const handleSearch = () => {
    setLoading(true);
    fetchProductos(searchQuery);
  };

  const handleAddToCart = (producto: Producto) => {
    dispatch(addToCart({ producto, cantidad: 1 }));
  };

  const handleProductPress = (producto: Producto) => {
    navigation.navigate('ProductoDetalle', { productoId: producto.id });
  };

  const renderProduct = ({ item }: { item: Producto }) => (
    <ProductCard
      producto={item}
      onPress={() => handleProductPress(item)}
      onAddToCart={() => handleAddToCart(item)}
    />
  );

  if (loading && !refreshing) {
    return <LoadingOverlay visible message="Cargando productos..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Catálogo de Productos
        </Text>
        <Searchbar
          placeholder="Buscar productos..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No se encontraron productos
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="cart"
        style={styles.fab}
        onPress={() => navigation.navigate('Carrito')}
        color={colors.white}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  title: {
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.md,
  },
  list: {
    padding: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
});

export default HomeScreen;

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
import { theme, spacing } from '@/theme';

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
      // Asegurar que siempre tengamos un array, incluso si la respuesta es directa
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge">No se encontraron productos</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="cart"
        style={styles.fab}
        onPress={() => navigation.navigate('Carrito')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  searchbar: {
    elevation: 0,
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
    color: theme.colors.error,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default HomeScreen;

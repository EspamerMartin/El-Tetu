import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Chip, Menu, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { productosAPI } from '@/services/api';
import { Producto, Categoria, Subcategoria } from '@/types';
import { ProductCard, LoadingOverlay } from '@/components';
import { useAppDispatch } from '@/store';
import { addToCart } from '@/store/slices/cartSlice';
import { theme, spacing } from '@/theme';

type Props = NativeStackScreenProps<ClienteTabParamList, 'Catalogo'>;

/**
 * CatalogoScreen
 * 
 * Pantalla de catálogo con filtros por:
 * - Búsqueda de texto
 * - Categoría
 * - Subcategoría
 */
const CatalogoScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<number | null>(null);
  
  const [categoriaMenuVisible, setCategoriaMenuVisible] = useState(false);
  const [subcategoriaMenuVisible, setSubcategoriaMenuVisible] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [searchQuery, selectedCategoria, selectedSubcategoria]);

  const fetchInitialData = async () => {
    try {
      const [categoriasData, subcategoriasData] = await Promise.all([
        productosAPI.getCategorias(),
        productosAPI.getSubcategorias(),
      ]);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const params: any = { activo: true };
      
      if (searchQuery) params.search = searchQuery;
      if (selectedCategoria) params.categoria = selectedCategoria;
      if (selectedSubcategoria) params.subcategoria = selectedSubcategoria;
      
      const data = await productosAPI.getAll(params);
      setProductos(data.results);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (producto: Producto) => {
    dispatch(addToCart({ producto, cantidad: 1 }));
  };

  const handleProductPress = (producto: Producto) => {
    navigation.navigate('ProductoDetalle', { productoId: producto.id });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategoria(null);
    setSelectedSubcategoria(null);
  };

  const filteredSubcategorias = selectedCategoria
    ? subcategorias.filter((s) => s.categoria === selectedCategoria)
    : subcategorias;

  const renderProduct = ({ item }: { item: Producto }) => (
    <ProductCard
      producto={item}
      onPress={() => handleProductPress(item)}
      onAddToCart={() => handleAddToCart(item)}
    />
  );

  const selectedCategoriaName = selectedCategoria
    ? categorias.find((c) => c.id === selectedCategoria)?.nombre
    : null;

  const selectedSubcategoriaName = selectedSubcategoria
    ? subcategorias.find((s) => s.id === selectedSubcategoria)?.nombre
    : null;

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar productos..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {/* Categoría */}
        <Menu
          visible={categoriaMenuVisible}
          onDismiss={() => setCategoriaMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setCategoriaMenuVisible(true)}
              style={styles.filterButton}
            >
              {selectedCategoriaName || 'Categoría'}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedCategoria(null);
              setSelectedSubcategoria(null);
              setCategoriaMenuVisible(false);
            }}
            title="Todas"
          />
          {categorias.map((cat) => (
            <Menu.Item
              key={cat.id}
              onPress={() => {
                setSelectedCategoria(cat.id);
                setSelectedSubcategoria(null);
                setCategoriaMenuVisible(false);
              }}
              title={cat.nombre}
            />
          ))}
        </Menu>

        {/* Subcategoría */}
        <Menu
          visible={subcategoriaMenuVisible}
          onDismiss={() => setSubcategoriaMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setSubcategoriaMenuVisible(true)}
              disabled={!selectedCategoria}
              style={styles.filterButton}
            >
              {selectedSubcategoriaName || 'Subcategoría'}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedSubcategoria(null);
              setSubcategoriaMenuVisible(false);
            }}
            title="Todas"
          />
          {filteredSubcategorias.map((sub) => (
            <Menu.Item
              key={sub.id}
              onPress={() => {
                setSelectedSubcategoria(sub.id);
                setSubcategoriaMenuVisible(false);
              }}
              title={sub.nombre}
            />
          ))}
        </Menu>

        {/* Botón limpiar filtros */}
        {(selectedCategoria || selectedSubcategoria || searchQuery) && (
          <Button
            mode="text"
            onPress={handleClearFilters}
            compact
          >
            Limpiar
          </Button>
        )}
      </View>

      {/* Chips de filtros activos */}
      {(selectedCategoria || selectedSubcategoria) && (
        <View style={styles.activeFiltersContainer}>
          {selectedCategoriaName && (
            <Chip
              onClose={() => {
                setSelectedCategoria(null);
                setSelectedSubcategoria(null);
              }}
              style={styles.filterChip}
            >
              {selectedCategoriaName}
            </Chip>
          )}
          {selectedSubcategoriaName && (
            <Chip
              onClose={() => setSelectedSubcategoria(null)}
              style={styles.filterChip}
            >
              {selectedSubcategoriaName}
            </Chip>
          )}
        </View>
      )}

      {/* Lista de productos */}
      {loading ? (
        <LoadingOverlay visible message="Cargando productos..." />
      ) : (
        <FlatList
          data={productos}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge">No se encontraron productos</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  searchbar: {
    elevation: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  list: {
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
});

export default CatalogoScreen;

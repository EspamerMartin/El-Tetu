import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Text, Searchbar, Chip, Card, Button, IconButton, Surface, Badge, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClienteStackParamList } from '@/navigation/ClienteStack';
import { productosAPI } from '@/services/api';
import { Producto, Categoria, Subcategoria } from '@/types';
import { ProductCard, LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { useAppDispatch } from '@/store';
import { addToCart } from '@/store/slices/cartSlice';
import { theme, spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type NavigationProp = NativeStackNavigationProp<ClienteStackParamList>;

const screenWidth = Dimensions.get('window').width;

interface FilterState {
  search: string;
  categoria: number | null;
  subcategoria: number | null;
  disponible: boolean;
}

/**
 * CatalogoScreen - Versión Mejorada UX/UI
 * 
 * Catálogo profesional con:
 * - Filtros avanzados (categoría, subcategoría, disponibilidad)
 * - Vista de grid responsive
 * - Búsqueda inteligente
 * - Animaciones suaves
 * - Estadísticas en tiempo real
 * - Chips interactivos con contadores
 */
const CatalogoScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categoria: null,
    subcategoria: null,
    disponible: false,
  });

  const filterAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [filters]);

  useFocusEffect(
    useCallback(() => {
      fetchProductos();
    }, [filters])
  );

  useEffect(() => {
    Animated.timing(filterAnimation, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFilters]);

  const fetchInitialData = async () => {
    try {
      const [categoriasData, subcategoriasData] = await Promise.all([
        productosAPI.getCategorias(),
        productosAPI.getSubcategorias(),
      ]);
      setCategorias(categoriasData?.results || []);
      setSubcategorias(subcategoriasData?.results || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const params: any = { activo: true };
      
      if (filters.search) params.search = filters.search;
      if (filters.categoria) params.categoria = filters.categoria;
      if (filters.subcategoria) params.subcategoria = filters.subcategoria;
      if (filters.disponible) params.disponible = true;
      
      const data = await productosAPI.getAll(params);
      let filteredProducts = data?.results || [];
      
      setProductos(filteredProducts);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (producto: Producto) => {
    navigation.navigate('ProductoDetalle', { productoId: producto.id });
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Reset subcategoría si cambia categoría
      if (key === 'categoria') {
        newFilters.subcategoria = null;
      }
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      categoria: null,
      subcategoria: null,
      disponible: false,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categoria) count++;
    if (filters.subcategoria) count++;
    if (filters.disponible) count++;
    return count;
  };

  const getSubcategoriasFiltradas = () => {
    if (!filters.categoria) return [];
    return subcategorias.filter(s => s.categoria === filters.categoria && s.activo);
  };

  const renderProducto = ({ item }: { item: Producto }) => (
    <View style={styles.productWrapper}>
      <ProductCard producto={item} onPress={() => handleProductPress(item)} />
    </View>
  );


  const activeFiltersCount = getActiveFiltersCount();
  const subcategoriasFiltradas = getSubcategoriasFiltradas();

  return (
    <ScreenContainer>
      {/* Header con búsqueda y filtros */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Buscar productos..."
            onChangeText={(text) => updateFilter('search', text)}
            value={filters.search}
            style={styles.searchbar}
            icon="magnify"
          />
          <IconButton
            icon={showFilters ? 'filter-off' : 'filter-variant'}
            size={24}
            onPress={() => setShowFilters(!showFilters)}
            style={[
              styles.filterButton,
              activeFiltersCount > 0 && styles.filterButtonActive
            ]}
          />
          {activeFiltersCount > 0 && (
            <Badge style={styles.filterBadge}>{activeFiltersCount}</Badge>
          )}
        </View>

        {/* Panel de filtros expandible */}
        <Animated.View 
          style={[
            styles.filtersPanel, 
            { 
              maxHeight: filterAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 400],
              }), 
              overflow: 'hidden' 
            }
          ]}
        >
          <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
            {/* Categorías */}
            <View style={styles.filterSection}>
              <Text variant="titleSmall" style={styles.filterTitle}>
                Categorías
              </Text>
              <View style={styles.chipsRow}>
                <Chip
                  icon={!filters.categoria ? 'check' : undefined}
                  selected={!filters.categoria}
                  onPress={() => updateFilter('categoria', null)}
                  style={styles.filterChip}
                  compact
                >
                  Todas
                </Chip>
                {categorias.filter(c => c.activo).map((cat) => (
                  <Chip
                    key={cat.id}
                    icon={filters.categoria === cat.id ? 'check' : undefined}
                    selected={filters.categoria === cat.id}
                    onPress={() => updateFilter('categoria', cat.id)}
                    style={styles.filterChip}
                    compact
                  >
                    {cat.nombre}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Subcategorías (solo si hay categoría seleccionada) */}
            {filters.categoria && subcategoriasFiltradas.length > 0 && (
              <View style={styles.filterSection}>
                <Text variant="titleSmall" style={styles.filterTitle}>
                  Subcategorías
                </Text>
                <View style={styles.chipsRow}>
                  <Chip
                    icon={!filters.subcategoria ? 'check' : undefined}
                    selected={!filters.subcategoria}
                    onPress={() => updateFilter('subcategoria', null)}
                    style={styles.filterChip}
                    compact
                  >
                    Todas
                  </Chip>
                  {subcategoriasFiltradas.map((subcat) => (
                    <Chip
                      key={subcat.id}
                      icon={filters.subcategoria === subcat.id ? 'check' : undefined}
                      selected={filters.subcategoria === subcat.id}
                      onPress={() => updateFilter('subcategoria', subcat.id)}
                      style={styles.filterChip}
                      compact
                    >
                      {subcat.nombre}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <Divider style={styles.divider} />

            {/* Filtros rápidos */}
            <View style={styles.filterSection}>
              <Text variant="titleSmall" style={styles.filterTitle}>
                Filtros rápidos
              </Text>
              <View style={styles.quickFilters}>
                <Chip
                  icon={filters.disponible ? 'check-circle' : 'circle-outline'}
                  selected={filters.disponible}
                  onPress={() => updateFilter('disponible', !filters.disponible)}
                  style={styles.quickFilterChip}
                >
                  Solo disponibles
                </Chip>
              </View>
            </View>

            {activeFiltersCount > 0 && (
              <Button
                mode="text"
                icon="close-circle"
                onPress={clearAllFilters}
                style={styles.clearButton}
              >
                Limpiar filtros
              </Button>
            )}
          </ScrollView>
        </Animated.View>
      </Surface>

      {/* Estadísticas */}
      <Surface style={styles.statsBar} elevation={0}>
        <View style={styles.statItem}>
          <Icon name="package-variant" size={18} color={theme.colors.primary} />
          <Text variant="bodySmall" style={styles.statText}>
            {productos.length} producto{productos.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </Surface>

      {/* Lista de productos */}
      {loading ? (
        <LoadingOverlay visible message="Cargando productos..." />
      ) : productos.length === 0 ? (
        <EmptyState
          icon="package-variant-closed"
          title="No hay productos"
          message={filters.search ? 'Intenta con otra búsqueda' : 'Ajusta los filtros para ver más productos'}
          actionLabel={activeFiltersCount > 0 ? 'Limpiar filtros' : undefined}
          onAction={activeFiltersCount > 0 ? clearAllFilters : undefined}
        />
      ) : (
        <FlatList
          data={productos}
          renderItem={renderProducto}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          key="two-column-layout"
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchbar: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterButton: {
    marginLeft: 8,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
  filterBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: theme.colors.error,
  },
  filtersPanel: {
    marginTop: 12,
  },
  filterScroll: {
    maxHeight: 400,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  quickFilterChip: {
    flex: 1,
  },
  divider: {
    marginVertical: 12,
  },
  clearButton: {
    marginTop: 8,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: theme.colors.onSurfaceVariant,
  },
  statDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
    backgroundColor: '#e0e0e0',
  },
  productsList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  productWrapper: {
    flex: 1,
    margin: 6,
    maxWidth: (screenWidth - 48) / 2,
    minHeight: 220,
    position: 'relative',
  },
  promoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    padding: 5,
    elevation: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  list: {
    padding: spacing.md,
  },
});

export default CatalogoScreen;

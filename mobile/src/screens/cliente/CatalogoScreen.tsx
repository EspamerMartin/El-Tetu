import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Chip, Button, IconButton, Surface, Badge, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClienteStackParamList } from '@/navigation/ClienteStack';
import { productosAPI } from '@/services/api';
import { Producto, Categoria, Subcategoria, PaginatedResponse } from '@/types';
import { ProductCard, LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCart, updateQuantity } from '@/store/slices/cartSlice';
import { usePaginatedFetch } from '@/hooks';
import { colors, spacing, borderRadius } from '@/theme';
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
 * CatalogoScreen - Catálogo de productos con paginación infinita
 * 
 * Características:
 * - Paginación infinita con scroll
 * - Filtros avanzados (categoría, subcategoría, disponibilidad)
 * - Búsqueda inteligente con debounce
 * - Pull to refresh
 * - Animaciones suaves
 */
const CatalogoScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categoria: null,
    subcategoria: null,
    disponible: false,
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const filterAnimation = useState(new Animated.Value(0))[0];

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Función de fetch con filtros aplicados
  const fetchProductos = useCallback(async (page: number): Promise<PaginatedResponse<Producto>> => {
    const params: Record<string, any> = { 
      activo: true,
      page,
    };
    
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.categoria) params.categoria = filters.categoria;
    if (filters.subcategoria) params.subcategoria = filters.subcategoria;
    if (filters.disponible) params.disponible = true;
    
    return productosAPI.getAll(params);
  }, [debouncedSearch, filters.categoria, filters.subcategoria, filters.disponible]);

  // Hook de paginación infinita
  const {
    data: productos,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    reset,
  } = usePaginatedFetch<Producto>(fetchProductos, {
    pageSize: 20,
    autoFetch: true,
  });

  // Recargar cuando cambien los filtros (excepto search que tiene debounce)
  useEffect(() => {
    reset();
  }, [debouncedSearch, filters.categoria, filters.subcategoria, filters.disponible]);

  // Cargar categorías y subcategorías al montar
  useEffect(() => {
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
    fetchInitialData();
  }, []);

  // Refrescar al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Animación del panel de filtros
  useEffect(() => {
    Animated.timing(filterAnimation, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFilters, filterAnimation]);

  const handleProductPress = useCallback((producto: Producto) => {
    navigation.navigate('ProductoDetalle', { productoId: producto.id });
  }, [navigation]);

  const handleAddProducto = useCallback((producto: Producto) => {
    if (!producto.tiene_stock) return;

    const itemEnCarrito = cartItems.find(i => i.producto.id === producto.id);
    const cantidadActual = itemEnCarrito?.cantidad || 0;

    if (itemEnCarrito) {
      dispatch(updateQuantity({ productoId: producto.id, cantidad: cantidadActual + 1 }));
    } else {
      dispatch(addToCart({ producto, cantidad: 1 }));
    }
  }, [cartItems, dispatch]);

  const handleUpdateCantidad = useCallback((productoId: number, nuevaCantidad: number) => {
    dispatch(updateQuantity({ productoId, cantidad: Math.max(0, nuevaCantidad) }));
  }, [dispatch]);

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === 'categoria') {
        newFilters.subcategoria = null;
      }
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      categoria: null,
      subcategoria: null,
      disponible: false,
    });
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categoria) count++;
    if (filters.subcategoria) count++;
    if (filters.disponible) count++;
    return count;
  }, [filters]);

  const subcategoriasFiltradas = useMemo(() => {
    if (!filters.categoria) return [];
    return subcategorias.filter(s => s.categoria === filters.categoria && s.activo);
  }, [filters.categoria, subcategorias]);

  const renderProducto = useCallback(({ item }: { item: Producto }) => {
    const itemEnCarrito = cartItems.find(i => i.producto.id === item.id);
    const cantidadEnCarrito = itemEnCarrito?.cantidad || 0;
    
    return (
      <View style={styles.productWrapper}>
        <View style={styles.productCardContainer}>
          <ProductCard 
            producto={item} 
            onPress={() => handleProductPress(item)}
            showAddButton={false}
          />
          {cantidadEnCarrito > 0 && item.tiene_stock && (
            <View style={styles.addButtonOverlay}>
              <View style={styles.cantidadControlsOverlay}>
                <IconButton
                  icon="minus"
                  size={20}
                  iconColor={colors.white}
                  onPress={() => handleUpdateCantidad(item.id, cantidadEnCarrito - 1)}
                  style={styles.cantidadButtonOverlay}
                />
                <Text style={styles.cantidadTextOverlay}>
                  {cantidadEnCarrito}
                </Text>
                <IconButton
                  icon="plus"
                  size={20}
                  iconColor={colors.white}
                  onPress={() => handleAddProducto(item)}
                  style={styles.cantidadButtonOverlay}
                />
              </View>
            </View>
          )}
          {cantidadEnCarrito === 0 && item.tiene_stock && (
            <View style={styles.addButtonOverlay}>
              <Button
                mode="contained"
                icon="plus"
                compact
                onPress={() => handleAddProducto(item)}
                style={styles.addButtonOverlayStyle}
              >
                Agregar
              </Button>
            </View>
          )}
        </View>
      </View>
    );
  }, [cartItems, handleProductPress, handleAddProducto, handleUpdateCantidad]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Cargando más productos...</Text>
      </View>
    );
  }, [loadingMore]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [hasMore, loadingMore, loading, loadMore]);

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

            {/* Subcategorías */}
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

      {/* Barra de estadísticas */}
      <Surface style={styles.statsBar} elevation={0}>
        <View style={styles.statItem}>
          <Icon name="package-variant" size={18} color={colors.primary} />
          <Text variant="bodySmall" style={styles.statText}>
            {loading ? 'Cargando...' : `${productos.length} de ${totalCount} producto${totalCount !== 1 ? 's' : ''}`}
          </Text>
        </View>
        {hasMore && !loading && productos.length > 0 && (
          <Text variant="labelSmall" style={styles.moreText}>
            Desliza para ver más
          </Text>
        )}
      </Surface>

      {/* Lista de productos */}
      {loading && productos.length === 0 ? (
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
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={refresh}
          ListFooterComponent={renderFooter}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchbar: {
    flex: 1,
    elevation: 0,
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.md,
  },
  filterButton: {
    marginLeft: spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: colors.primarySurface,
  },
  filterBadge: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    backgroundColor: colors.error,
  },
  filtersPanel: {
    marginTop: spacing.sm + 4,
  },
  filterScroll: {
    maxHeight: 400,
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickFilterChip: {
    flex: 1,
  },
  divider: {
    marginVertical: spacing.sm + 4,
  },
  clearButton: {
    marginTop: spacing.sm,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: colors.textSecondary,
  },
  moreText: {
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  productsList: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  productWrapper: {
    width: (screenWidth - 48) / 2,
    margin: 6,
    minHeight: 220,
    position: 'relative',
  },
  productCardContainer: {
    position: 'relative',
    width: '100%',
  },
  cantidadControlsOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 4,
  },
  cantidadButtonOverlay: {
    margin: 0,
    width: 40,
    height: 40,
  },
  cantidadTextOverlay: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  addButtonOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  addButtonOverlayStyle: {
    borderRadius: 8,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default CatalogoScreen;

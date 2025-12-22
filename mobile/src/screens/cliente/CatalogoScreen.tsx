import React, { useEffect, useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Searchbar, Button, IconButton, Surface, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ClienteStackParamList, ClienteTabParamList } from '@/navigation/ClienteStack';
import { productosAPI, promocionesAPI } from '@/services/api';
import { Producto, Categoria, Subcategoria, PaginatedResponse, Promocion } from '@/types';
import { ProductCard, CategoryCard, LoadingOverlay, ScreenContainer, EmptyState, PromocionCard } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCart, updateQuantity } from '@/store/slices/cartSlice';
import { useFetch, usePaginatedFetch } from '@/hooks';
import { colors, spacing, borderRadius } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type NavigationProp = NativeStackNavigationProp<ClienteStackParamList> & BottomTabNavigationProp<ClienteTabParamList>;

const screenWidth = Dimensions.get('window').width;

type NavigationLevel = 'categorias' | 'subcategorias' | 'productos';

/**
 * CatalogoScreen - Catálogo de productos con navegación jerárquica
 * 
 * Flujo de navegación:
 * 1. Categorías → 2. Subcategorías (si existen) → 3. Productos
 * 
 * Características:
 * - Navegación jerárquica intuitiva
 * - Breadcrumbs para contexto
 * - FAB con badge del carrito
 * - Búsqueda disponible en nivel de productos
 * - Paginación infinita en productos
 */
const CatalogoScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  
  // Estado de navegación
  const [level, setLevel] = useState<NavigationLevel>('categorias');
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<Subcategoria | null>(null);
  
  // Estado de búsqueda (en nivel productos)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch categorías
  const { 
    data: categoriasData, 
    loading: loadingCategorias, 
    refetch: refetchCategorias 
  } = useFetch(() => productosAPI.getCategorias({ activo: 'true' }));

  // Fetch subcategorías
  const { 
    data: subcategoriasData, 
    loading: loadingSubcategorias,
    refetch: refetchSubcategorias 
  } = useFetch(() => productosAPI.getSubcategorias({ activo: 'true' }));

  // Fetch promociones activas
  const { 
    data: promocionesData, 
    loading: loadingPromociones,
  } = useFetch(() => promocionesAPI.getActivas());

  const promociones: Promocion[] = useMemo(() => 
    Array.isArray(promocionesData) ? promocionesData : [],
    [promocionesData]
  );

  const categorias = useMemo(() => 
    (categoriasData?.results || []).filter((c: Categoria) => c.activo),
    [categoriasData]
  );

  const allSubcategorias = useMemo(() => 
    (subcategoriasData?.results || []).filter((s: Subcategoria) => s.activo),
    [subcategoriasData]
  );

  // Subcategorías filtradas por categoría seleccionada
  const subcategoriasFiltradas = useMemo(() => {
    if (!selectedCategoria) return [];
    return allSubcategorias.filter((s: Subcategoria) => s.categoria === selectedCategoria.id);
  }, [selectedCategoria, allSubcategorias]);

  // Contar subcategorías por categoría
  const getSubcategoriaCount = useCallback((categoriaId: number) => {
    return allSubcategorias.filter((s: Subcategoria) => s.categoria === categoriaId).length;
  }, [allSubcategorias]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Función de fetch para productos
  const fetchProductos = useCallback(async (page: number): Promise<PaginatedResponse<Producto>> => {
    const params: Record<string, any> = { 
      activo: true,
      page,
    };
    
    if (selectedCategoria) params.categoria = selectedCategoria.id;
    if (selectedSubcategoria) params.subcategoria = selectedSubcategoria.id;
    if (debouncedSearch) params.search = debouncedSearch;
    
    return productosAPI.getAll(params);
  }, [selectedCategoria, selectedSubcategoria, debouncedSearch]);

  // Hook de paginación para productos
  const {
    data: productos,
    loading: loadingProductos,
    loadingMore,
    refreshing,
    hasMore,
    totalCount,
    loadMore,
    refresh: refreshProductos,
    reset: resetProductos,
  } = usePaginatedFetch<Producto>(fetchProductos, {
    pageSize: 20,
    autoFetch: false, // No fetch automático, controlamos manualmente
  });

  // Fetch productos cuando cambie el nivel o los filtros
  useEffect(() => {
    if (level === 'productos') {
      resetProductos();
    }
  }, [level, selectedCategoria, selectedSubcategoria, debouncedSearch, resetProductos]);

  // Calcular total de items en carrito
  const cartTotalItems = useMemo(() => 
    cartItems.reduce((acc, item) => acc + item.cantidad, 0),
    [cartItems]
  );

  // Handlers de navegación
  const handleSelectCategoria = useCallback((categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setSelectedSubcategoria(null);
    setSearchQuery('');
    setDebouncedSearch('');
    
    // Verificar si tiene subcategorías
    const subcats = allSubcategorias.filter((s: Subcategoria) => s.categoria === categoria.id);
    if (subcats.length > 0) {
      setLevel('subcategorias');
    } else {
      // Ir directo a productos si no hay subcategorías
      setLevel('productos');
    }
  }, [allSubcategorias]);

  const handleSelectSubcategoria = useCallback((subcategoria: Subcategoria) => {
    setSelectedSubcategoria(subcategoria);
    setSearchQuery('');
    setDebouncedSearch('');
    setLevel('productos');
  }, []);

  const handleBack = useCallback(() => {
    if (level === 'productos') {
      // Si venimos de subcategorías, volver a subcategorías
      // Si no había subcategorías, volver a categorías
      if (selectedSubcategoria) {
        setSelectedSubcategoria(null);
        setLevel('subcategorias');
      } else {
        setSelectedCategoria(null);
        setLevel('categorias');
      }
      setSearchQuery('');
      setDebouncedSearch('');
    } else if (level === 'subcategorias') {
      setSelectedCategoria(null);
      setLevel('categorias');
    }
  }, [level, selectedSubcategoria]);

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

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loadingProductos) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadingProductos, loadMore]);

  // Configurar header dinámicamente según el nivel de navegación
  useLayoutEffect(() => {
    let title = 'Inicio';
    if (level === 'subcategorias' && selectedCategoria) {
      title = selectedCategoria.nombre;
    } else if (level === 'productos') {
      title = selectedSubcategoria?.nombre || selectedCategoria?.nombre || 'Productos';
    }

    navigation.setOptions({
      title,
      headerLeft: level !== 'categorias' ? () => (
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleBack}
          iconColor={colors.text}
        />
      ) : undefined,
    });
  }, [navigation, level, selectedCategoria, selectedSubcategoria, handleBack]);

  // Render categorías
  const renderCategoria = useCallback(({ item }: { item: Categoria }) => {
    const subcatCount = getSubcategoriaCount(item.id);
    return (
      <View style={styles.cardWrapper}>
        <CategoryCard
          nombre={item.nombre}
          descripcion={item.descripcion}
          url_imagen={item.url_imagen}
          onPress={() => handleSelectCategoria(item)}
          itemCount={subcatCount}
          itemLabel={subcatCount === 1 ? 'subcategoría' : 'subcategorías'}
        />
      </View>
    );
  }, [getSubcategoriaCount, handleSelectCategoria]);

  // Render subcategorías
  const renderSubcategoria = useCallback(({ item }: { item: Subcategoria }) => (
    <View style={styles.cardWrapper}>
      <CategoryCard
        nombre={item.nombre}
        descripcion={item.descripcion}
        url_imagen={item.url_imagen}
        onPress={() => handleSelectSubcategoria(item)}
      />
    </View>
  ), [handleSelectSubcategoria]);

  // Render productos
  const renderProducto = useCallback(({ item }: { item: Producto }) => {
    const itemEnCarrito = cartItems.find(i => i.producto.id === item.id);
    const cantidadEnCarrito = itemEnCarrito?.cantidad || 0;
    
    return (
      <View style={styles.cardWrapper}>
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

  // Breadcrumb
  const renderBreadcrumb = () => {
    if (level === 'categorias') return null;

    return (
      <Surface style={styles.breadcrumb} elevation={1}>
        <TouchableOpacity 
          style={styles.breadcrumbItem} 
          onPress={() => {
            setSelectedCategoria(null);
            setSelectedSubcategoria(null);
            setLevel('categorias');
            setSearchQuery('');
          }}
        >
          <Icon name="home" size={18} color={colors.primary} />
          <Text style={styles.breadcrumbText}>Inicio</Text>
        </TouchableOpacity>

        {selectedCategoria && (
          <>
            <Icon name="chevron-right" size={18} color={colors.textSecondary} />
            <TouchableOpacity 
              style={styles.breadcrumbItem}
              onPress={() => {
                if (level === 'productos' && subcategoriasFiltradas.length > 0) {
                  setSelectedSubcategoria(null);
                  setLevel('subcategorias');
                  setSearchQuery('');
                }
              }}
              disabled={level === 'subcategorias' || subcategoriasFiltradas.length === 0}
            >
              <Text style={[
                styles.breadcrumbText,
                (level === 'subcategorias' || subcategoriasFiltradas.length === 0) && styles.breadcrumbTextActive
              ]}>
                {selectedCategoria.nombre}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {selectedSubcategoria && (
          <>
            <Icon name="chevron-right" size={18} color={colors.textSecondary} />
            <Text style={[styles.breadcrumbText, styles.breadcrumbTextActive]}>
              {selectedSubcategoria.nombre}
            </Text>
          </>
        )}
      </Surface>
    );
  };

  // Loading state
  const isLoading = 
    (level === 'categorias' && loadingCategorias) ||
    (level === 'subcategorias' && loadingSubcategorias) ||
    (level === 'productos' && loadingProductos && productos.length === 0);

  return (
    <ScreenContainer edges={[]}>
      {/* Barra de búsqueda (siempre visible en nivel productos) */}
      {level === 'productos' && (
        <Surface style={styles.searchContainer} elevation={1}>
          <Searchbar
            placeholder="Buscar productos..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            icon="magnify"
          />
        </Surface>
      )}

      {renderBreadcrumb()}

      {isLoading && <LoadingOverlay visible message="Cargando..." />}

      {/* Nivel: Categorías */}
      {level === 'categorias' && !loadingCategorias && (
        <FlatList
          data={categorias}
          renderItem={renderCategoria}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            promociones.length > 0 ? (
              <View style={styles.promocionesSection}>
                <View style={styles.promocionesTitleRow}>
                  <Icon name="fire" size={24} color={colors.promo} />
                  <Text style={styles.promocionesTitle}>Promociones</Text>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.promocionesScroll}
                >
                  {promociones.map((promo) => (
                    <PromocionCard
                      key={promo.id}
                      promocion={promo}
                      compact
                      onPress={() => navigation.navigate('PromocionDetalle', { promocionId: promo.id })}
                    />
                  ))}
                </ScrollView>
                <Text style={styles.categoriasTitle}>Categorías</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="shape-outline"
              title="No hay categorías"
              message="No se encontraron categorías disponibles"
            />
          }
        />
      )}

      {/* Nivel: Subcategorías */}
      {level === 'subcategorias' && !loadingSubcategorias && (
        <FlatList
          data={subcategoriasFiltradas}
          renderItem={renderSubcategoria}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="shape-outline"
              title="No hay subcategorías"
              message="Esta categoría no tiene subcategorías"
            />
          }
        />
      )}

      {/* Nivel: Productos */}
      {level === 'productos' && (
        <>
          {productos.length === 0 && !loadingProductos ? (
            <EmptyState
              icon="package-variant-closed"
              title="No hay productos"
              message={searchQuery 
                ? 'Intenta con otra búsqueda' 
                : 'No hay productos en esta categoría'}
              actionLabel={searchQuery ? 'Limpiar búsqueda' : undefined}
              onAction={searchQuery ? () => {
                setSearchQuery('');
                setDebouncedSearch('');
              } : undefined}
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
              onRefresh={refreshProductos}
              ListFooterComponent={renderFooter}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={10}
            />
          )}
        </>
      )}

      {/* FAB del carrito */}
      {cartTotalItems > 0 && (
        <FAB
          icon="cart"
          style={styles.fab}
          color={colors.primary}
          onPress={() => navigation.navigate('Carrito')}
          label={cartTotalItems.toString()}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.md,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  breadcrumbText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  breadcrumbTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  list: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl + 60, // Espacio para FAB
  },
  productsList: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl + 60, // Espacio para FAB
  },
  cardWrapper: {
    width: (screenWidth - spacing.sm * 3) / 2,
    margin: spacing.sm / 2,
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
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.white,
  },
  // Sección de promociones
  promocionesSection: {
    marginBottom: spacing.md,
  },
  promocionesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  promocionesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.promo,
  },
  promocionesScroll: {
    paddingLeft: spacing.sm,
    paddingBottom: spacing.md,
  },
  categoriasTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});

export default CatalogoScreen;

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Text, Searchbar, Chip, Card, Button, IconButton, Surface, Badge, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClienteStackParamList } from '@/navigation/ClienteStack';
import { productosAPI, promocionesAPI } from '@/services/api';
import { Producto, Categoria, Subcategoria, Promocion } from '@/types';
import { ProductCard, LoadingOverlay } from '@/components';
import { useAppDispatch } from '@/store';
import { theme, spacing } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type NavigationProp = NativeStackNavigationProp<ClienteStackParamList>;

const screenWidth = Dimensions.get('window').width;

interface FilterState {
  search: string;
  categoria: number | null;
  subcategoria: number | null;
  disponible: boolean;
  conPromocion: boolean;
}

/**
 * CatalogoScreen - Versión Mejorada UX/UI
 * 
 * Catálogo profesional con:
 * - Promociones destacadas con carrusel
 * - Filtros avanzados (categoría, subcategoría, disponibilidad, promociones)
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
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categoria: null,
    subcategoria: null,
    disponible: false,
    conPromocion: false,
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
      const [categoriasData, subcategoriasData, promocionesData] = await Promise.all([
        productosAPI.getCategorias(),
        productosAPI.getSubcategorias(),
        promocionesAPI.getAll(),
      ]);
      setCategorias(categoriasData?.results || []);
      setSubcategorias(subcategoriasData?.results || []);
      setPromociones(promocionesData?.results?.filter((p: Promocion) => p.activo && p.es_vigente) || []);
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
      
      // Filtro de promociones (client-side)
      if (filters.conPromocion) {
        const productosConPromo = new Set<number>();
        promociones.forEach(promo => {
          promo.productos.forEach(pid => productosConPromo.add(pid));
        });
        filteredProducts = filteredProducts.filter(p => productosConPromo.has(p.id));
      }
      
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
      conPromocion: false,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categoria) count++;
    if (filters.subcategoria) count++;
    if (filters.disponible) count++;
    if (filters.conPromocion) count++;
    return count;
  };

  const getSubcategoriasFiltradas = () => {
    if (!filters.categoria) return [];
    return subcategorias.filter(s => s.categoria === filters.categoria && s.activo);
  };

  const getProductosConPromocion = () => {
    const productosIds = new Set<number>();
    promociones.forEach(promo => {
      promo.productos.forEach(pid => productosIds.add(pid));
    });
    return productosIds;
  };

  const productosConPromo = getProductosConPromocion();

  const renderPromocionCard = ({ item }: { item: Promocion }) => (
    <Card style={styles.promocionCard} mode="elevated">
      <Card.Content style={styles.promocionContent}>
        <View style={styles.promocionHeader}>
          <View style={styles.promocionBadge}>
            <Icon name="sale" size={16} color={theme.colors.onPrimary} />
            <Text variant="labelSmall" style={styles.badgeText}>
              {item.tipo === 'descuento_porcentaje' && `${item.descuento_porcentaje}% OFF`}
              {item.tipo === 'descuento_fijo' && `$${item.descuento_fijo} OFF`}
              {item.tipo === 'caja_cerrada' && 'Caja Cerrada'}
              {item.tipo === 'combinable' && 'Combo'}
            </Text>
          </View>
        </View>
        <Text variant="titleSmall" style={styles.promocionNombre} numberOfLines={1}>
          {item.nombre}
        </Text>
        <Text variant="bodySmall" numberOfLines={2} style={styles.promocionDesc}>
          {item.descripcion}
        </Text>
        <View style={styles.promocionFooter}>
          {item.cantidad_minima > 1 && (
            <View style={styles.promocionInfo}>
              <Icon name="information-outline" size={12} color={theme.colors.secondary} />
              <Text variant="labelSmall" style={styles.promocionCondicion}>
                Mín: {item.cantidad_minima} un.
              </Text>
            </View>
          )}
          <View style={styles.promocionInfo}>
            <Icon name="tag-multiple" size={12} color={theme.colors.primary} />
            <Text variant="labelSmall" style={styles.productosLabel}>
              {item.productos.length} prod.
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderProducto = ({ item }: { item: Producto }) => (
    <View style={styles.productWrapper}>
      <ProductCard producto={item} onPress={() => handleProductPress(item)} />
      {productosConPromo.has(item.id) && (
        <View style={styles.promoIndicator}>
          <Icon name="sale" size={16} color={theme.colors.onPrimary} />
        </View>
      )}
    </View>
  );

  const activeFiltersCount = getActiveFiltersCount();
  const subcategoriasFiltradas = getSubcategoriasFiltradas();

  return (
    <View style={styles.container}>
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
                <Chip
                  icon={filters.conPromocion ? 'sale' : 'sale-outline'}
                  selected={filters.conPromocion}
                  onPress={() => updateFilter('conPromocion', !filters.conPromocion)}
                  style={styles.quickFilterChip}
                >
                  Con promoción
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
        {promociones.length > 0 && (
          <>
            <Divider style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="sale" size={18} color={theme.colors.secondary} />
              <Text variant="bodySmall" style={styles.statText}>
                {promociones.length} promocion{promociones.length !== 1 ? 'es' : ''}
              </Text>
            </View>
          </>
        )}
      </Surface>

      {/* Promociones destacadas */}
      {!filters.search && promociones.length > 0 && (
        <View style={styles.promocionesSection}>
          <View style={styles.sectionHeader}>
            <Icon name="sale" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Promociones Activas
            </Text>
          </View>
          <FlatList
            horizontal
            data={promociones}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPromocionCard}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promocionesContent}
          />
        </View>
      )}

      {/* Lista de productos */}
      {loading ? (
        <LoadingOverlay visible message="Cargando productos..." />
      ) : productos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="package-variant-closed" size={64} color={theme.colors.outline} />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No hay productos
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {filters.search ? 'Intenta con otra búsqueda' : 'Ajusta los filtros para ver más productos'}
          </Text>
          {activeFiltersCount > 0 && (
            <Button mode="contained" onPress={clearAllFilters} style={styles.emptyButton}>
              Limpiar filtros
            </Button>
          )}
        </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  promocionesSection: {
    backgroundColor: 'white',
    paddingVertical: 16,
    marginBottom: 8,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  promocionesContent: {
    paddingHorizontal: 16,
  },
  promocionCard: {
    width: screenWidth * 0.65,
    marginRight: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  promocionContent: {
    padding: 12,
  },
  promocionHeader: {
    marginBottom: 8,
  },
  promocionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
    fontSize: 11,
  },
  promocionNombre: {
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  promocionDesc: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
    lineHeight: 18,
  },
  promocionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  promocionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  promocionCondicion: {
    color: theme.colors.secondary,
    fontSize: 11,
  },
  productosLabel: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  promocionesContainer: {
    paddingVertical: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  promocionesTitle: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '600',
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

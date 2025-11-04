import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, SectionList } from 'react-native';
import { Text, Searchbar, Chip, Card, Button } from 'react-native-paper';
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

interface ProductoSection {
  title: string;
  data: Producto[];
}

/**
 * CatalogoScreen
 * 
 * Pantalla de catálogo organizada por categorías con:
 * - Búsqueda de texto
 * - Filtros rápidos por categoría (chips)
 * - Subcategorías agrupadas
 * - Animación al agregar al carrito
 */
const CatalogoScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [viewMode] = useState<'all' | 'grouped'>('grouped');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [searchQuery, selectedCategoria]);

  // Actualizar productos cuando la pantalla vuelve al foco
  useFocusEffect(
    useCallback(() => {
      fetchProductos();
    }, [searchQuery, selectedCategoria])
  );

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
      console.error('Error al cargar categorías:', err);
      setCategorias([]);
      setSubcategorias([]);
      setPromociones([]);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const params: any = { activo: true };
      
      if (searchQuery) params.search = searchQuery;
      if (selectedCategoria) params.categoria = selectedCategoria;
      
      const data = await productosAPI.getAll(params);
      setProductos(data?.results || []);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (producto: Producto) => {
    // Navegar al detalle del producto en lugar de agregar directamente
    navigation.navigate('ProductoDetalle', { productoId: producto.id });
  };

  const handleProductPress = (producto: Producto) => {
    navigation.navigate('ProductoDetalle', { productoId: producto.id });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategoria(null);
  };

  // Agrupar productos por subcategoría
  const getGroupedProducts = (): ProductoSection[] => {
    if (searchQuery || !selectedCategoria) {
      return [{ title: 'Todos los productos', data: productos }];
    }

    const subcatsMap = new Map<number | null, Producto[]>();
    
    productos.forEach((producto) => {
      const subcatId = producto.subcategoria || null;
      if (!subcatsMap.has(subcatId)) {
        subcatsMap.set(subcatId, []);
      }
      subcatsMap.get(subcatId)!.push(producto);
    });

    const sections: ProductoSection[] = [];
    
    subcatsMap.forEach((prods, subcatId) => {
      if (subcatId === null) {
        sections.push({ title: 'Sin subcategoría', data: prods });
      } else {
        const subcat = subcategorias.find((s) => s.id === subcatId);
        sections.push({
          title: subcat?.nombre || 'Otros',
          data: prods,
        });
      }
    });

    return sections;
  };

  const renderProduct = ({ item }: { item: Producto }) => (
    <ProductCard
      producto={item}
      onPress={() => handleProductPress(item)}
      onAddToCart={() => handleAddToCart(item)}
    />
  );

  const renderSectionHeader = ({ section }: { section: ProductoSection }) => (
    <View style={styles.sectionHeader}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {section.title} ({section.data.length})
      </Text>
    </View>
  );

  const groupedProducts = getGroupedProducts();

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

      {/* Promociones activas */}
      {!searchQuery && promociones.length > 0 && (
        <View style={styles.promocionesContainer}>
          <Text variant="titleMedium" style={styles.promocionesTitle}>🎉 Promociones Activas</Text>
          <FlatList
            horizontal
            data={promociones}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Card style={styles.promocionCard}>
                <Card.Content>
                  <View style={styles.promocionBadge}>
                    <Icon name="tag" size={16} color={theme.colors.onPrimary} />
                    <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
                      {item.tipo === 'descuento_porcentaje' && `${item.descuento_porcentaje}% OFF`}
                      {item.tipo === 'descuento_fijo' && `$${item.descuento_fijo} OFF`}
                      {item.tipo === 'caja_cerrada' && 'Caja Cerrada'}
                    </Text>
                  </View>
                  <Text variant="titleSmall" style={styles.promocionNombre}>{item.nombre}</Text>
                  <Text variant="bodySmall" numberOfLines={2}>{item.descripcion}</Text>
                  {item.cantidad_minima > 1 && (
                    <Text variant="labelSmall" style={styles.promocionCondicion}>
                      Mín: {item.cantidad_minima} unidades
                    </Text>
                  )}
                </Card.Content>
              </Card>
            )}
          />
        </View>
      )}

      {/* Chips de categorías */}
      {!searchQuery && (
        <View style={styles.categoriesContainer}>
          <Chip
            icon={!selectedCategoria ? 'check' : undefined}
            selected={!selectedCategoria}
            onPress={() => setSelectedCategoria(null)}
            style={styles.categoryChip}
          >
            Todos
          </Chip>
          {Array.isArray(categorias) && categorias.map((cat) => (
            <Chip
              key={cat.id}
              icon={selectedCategoria === cat.id ? 'check' : undefined}
              selected={selectedCategoria === cat.id}
              onPress={() => setSelectedCategoria(cat.id)}
              style={styles.categoryChip}
            >
              {cat.nombre}
            </Chip>
          ))}
        </View>
      )}

      {/* Lista de productos */}
      {loading ? (
        <LoadingOverlay visible message="Cargando productos..." />
      ) : viewMode === 'grouped' && selectedCategoria && !searchQuery ? (
        <SectionList
          sections={groupedProducts}
          renderItem={renderProduct}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge">No se encontraron productos</Text>
            </View>
          }
        />
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
  promocionesContainer: {
    paddingVertical: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  promocionesTitle: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  promocionCard: {
    width: 250,
    marginLeft: spacing.md,
    backgroundColor: theme.colors.primaryContainer,
  },
  promocionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    gap: 4,
  },
  promocionNombre: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  promocionCondicion: {
    marginTop: spacing.xs,
    color: theme.colors.secondary,
    fontStyle: 'italic',
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
  sectionHeader: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.primary,
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

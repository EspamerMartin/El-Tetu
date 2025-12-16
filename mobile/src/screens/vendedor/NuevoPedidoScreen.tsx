import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Searchbar, List, Divider, Surface, IconButton, Badge, Portal } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch, usePaginatedFetch } from '@/hooks';
import { clientesAPI, productosAPI, pedidosAPI, listasAPI } from '@/services/api';
import { Cliente, Producto, CreatePedidoData, ListaPrecio, Categoria, Subcategoria, PaginatedResponse } from '@/types';
import { LoadingOverlay, ScreenContainer, ProductCard, CategoryCard } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;

type Props = NativeStackScreenProps<VendedorStackParamList | AdminStackParamList, 'NuevoPedido'>;

interface ItemPedido {
  producto: Producto;
  cantidad: number;
}

type ProductosLevel = 'categorias' | 'subcategorias' | 'productos';

/**
 * NuevoPedidoScreen
 * 
 * Crear nuevo pedido manualmente:
 * Paso 1: Seleccionar cliente
 * Paso 2: Agregar productos (navegación jerárquica)
 * Paso 3: Confirmar pedido
 */
const NuevoPedidoScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [listaSeleccionada, setListaSeleccionada] = useState<ListaPrecio | null>(null);
  const [menuListaPrecioVisible, setMenuListaPrecioVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const menuOpenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estados para navegación jerárquica de productos (Paso 2)
  const [productosLevel, setProductosLevel] = useState<ProductosLevel>('categorias');
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<Subcategoria | null>(null);
  const [searchProducto, setSearchProducto] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: clientesData, loading: loadingClientes } = useFetch(() => 
    clientesAPI.getAll({ rol: 'cliente' })
  );
  
  const { data: listasData, loading: loadingListas } = useFetch(() => listasAPI.getAll());
  
  const { data: categoriasData, loading: loadingCategorias } = useFetch(() => 
    productosAPI.getCategorias({ activo: 'true' })
  );
  
  const { data: subcategoriasData, loading: loadingSubcategorias } = useFetch(() => 
    productosAPI.getSubcategorias({ activo: 'true' })
  );

  // Arrays normalizados
  const clientes = Array.isArray(clientesData) ? clientesData : (clientesData?.results || []);
  const listas = Array.isArray(listasData) ? listasData : (listasData?.results || []);
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

  // Debounce para búsqueda de productos
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchProducto);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchProducto]);

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
    hasMore,
    loadMore,
    reset: resetProductos,
  } = usePaginatedFetch<Producto>(fetchProductos, {
    pageSize: 20,
    autoFetch: false,
  });

  // Fetch productos cuando cambie el nivel o filtros
  useEffect(() => {
    if (paso === 2 && productosLevel === 'productos') {
      resetProductos();
    }
  }, [paso, productosLevel, selectedCategoria, selectedSubcategoria, debouncedSearch, resetProductos]);

  // Seleccionar Lista Base por defecto
  useEffect(() => {
    if (listas.length > 0 && !listaSeleccionada) {
      const listaBase = listas.find(l => l.codigo === 'base') || listas[0];
      setListaSeleccionada(listaBase);
    }
  }, [listas]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (menuOpenTimeoutRef.current) {
        clearTimeout(menuOpenTimeoutRef.current);
      }
    };
  }, []);

  // Handlers del menú de lista de precios
  const handleOpenMenu = useCallback(() => {
    if (menuOpenTimeoutRef.current) {
      clearTimeout(menuOpenTimeoutRef.current);
      menuOpenTimeoutRef.current = null;
    }
    menuOpenTimeoutRef.current = setTimeout(() => {
      setMenuListaPrecioVisible(true);
      menuOpenTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleCloseMenu = useCallback(() => {
    if (menuOpenTimeoutRef.current) {
      clearTimeout(menuOpenTimeoutRef.current);
      menuOpenTimeoutRef.current = null;
    }
    setMenuListaPrecioVisible(false);
  }, []);

  const handleSelectLista = useCallback((lista: ListaPrecio) => {
    setMenuListaPrecioVisible(false);
    setTimeout(() => {
      setListaSeleccionada(lista);
    }, 100);
  }, []);

  // Handlers de navegación jerárquica de productos
  const handleSelectCategoria = useCallback((categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setSelectedSubcategoria(null);
    setSearchProducto('');
    setDebouncedSearch('');
    
    const subcats = allSubcategorias.filter((s: Subcategoria) => s.categoria === categoria.id);
    if (subcats.length > 0) {
      setProductosLevel('subcategorias');
    } else {
      setProductosLevel('productos');
    }
  }, [allSubcategorias]);

  const handleSelectSubcategoria = useCallback((subcategoria: Subcategoria) => {
    setSelectedSubcategoria(subcategoria);
    setSearchProducto('');
    setDebouncedSearch('');
    setProductosLevel('productos');
  }, []);

  const handleBackProductos = useCallback(() => {
    if (productosLevel === 'productos') {
      if (selectedSubcategoria) {
        setSelectedSubcategoria(null);
        setProductosLevel('subcategorias');
      } else {
        setSelectedCategoria(null);
        setProductosLevel('categorias');
      }
      setSearchProducto('');
      setDebouncedSearch('');
    } else if (productosLevel === 'subcategorias') {
      setSelectedCategoria(null);
      setProductosLevel('categorias');
    }
  }, [productosLevel, selectedSubcategoria]);

  // Filtrado de clientes
  const clientesFiltrados = searchCliente
    ? clientes.filter(c => 
        c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
        c.email.toLowerCase().includes(searchCliente.toLowerCase())
      )
    : clientes;

  // Separar productos con y sin stock
  const productosConStock = useMemo(() => 
    productos.filter(p => p.tiene_stock), 
    [productos]
  );
  const productosSinStock = useMemo(() => 
    productos.filter(p => !p.tiene_stock), 
    [productos]
  );

  const handleSelectCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setPaso(2);
    setSearchCliente('');
    // Reset navegación de productos
    setProductosLevel('categorias');
    setSelectedCategoria(null);
    setSelectedSubcategoria(null);
    setSearchProducto('');
  };

  const handleAddProducto = (producto: Producto) => {
    if (!producto.tiene_stock) {
      Alert.alert('Sin stock', 'Este producto no tiene stock disponible');
      return;
    }

    const existente = items.find(i => i.producto.id === producto.id);
    
    if (existente) {
      setItems(items.map(i => 
        i.producto.id === producto.id 
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      ));
    } else {
      setItems([...items, { producto, cantidad: 1 }]);
    }
  };

  const handleRemoveItem = (productoId: number) => {
    setItems(items.filter(i => i.producto.id !== productoId));
  };

  const handleUpdateCantidad = (productoId: number, cantidad: number) => {
    if (cantidad < 1) {
      handleRemoveItem(productoId);
      return;
    }
    
    setItems(items.map(i => 
      i.producto.id === productoId 
        ? { ...i, cantidad }
        : i
    ));
  };

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loadingProductos) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadingProductos, loadMore]);

  // Calcular precio con descuento
  const calcularPrecioConDescuento = (precioBase: number | string): number => {
    const precio = typeof precioBase === 'string' ? parseFloat(precioBase) : precioBase;
    if (isNaN(precio)) return 0;
    if (!listaSeleccionada) return precio;
    
    const descuentoPorcentaje = parseFloat(listaSeleccionada.descuento_porcentaje);
    if (isNaN(descuentoPorcentaje) || descuentoPorcentaje === 0) return precio;
    
    const descuento = precio * (descuentoPorcentaje / 100);
    return precio - descuento;
  };

  const calcularTotal = () => {
    return items.reduce((acc, item) => {
      const precioBase = parseFloat(item.producto.precio);
      const precioConDescuento = calcularPrecioConDescuento(precioBase);
      return acc + (precioConDescuento * item.cantidad);
    }, 0);
  };

  const handleConfirmarPedido = async () => {
    if (!clienteSeleccionado || items.length === 0 || !listaSeleccionada) {
      Alert.alert('Error', 'Debe seleccionar un cliente, una lista de precios y agregar productos');
      return;
    }

    try {
      setCreating(true);
      const payload: CreatePedidoData = {
        cliente: clienteSeleccionado.id,
        lista_precio: listaSeleccionada.id,
        items: items.map(i => ({
          producto: i.producto.id,
          cantidad: i.cantidad,
        })),
      };

      await pedidosAPI.create(payload);
      Alert.alert('Éxito', 'Pedido creado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'No se pudo crear el pedido');
    } finally {
      setCreating(false);
    }
  };

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

  // Render productos con stock
  const renderProductoConStock = useCallback(({ item: producto }: { item: Producto }) => {
    const itemEnCarrito = items.find(i => i.producto.id === producto.id);
    const cantidadEnCarrito = itemEnCarrito?.cantidad || 0;
    
    return (
      <View style={styles.cardWrapper}>
        <View style={styles.productCardContainer}>
          <ProductCard 
            producto={producto} 
            onPress={() => {}}
            showAddButton={false}
          />
          {cantidadEnCarrito > 0 && (
            <View style={styles.cantidadOverlay}>
              <View style={styles.cantidadControlsOverlay}>
                <IconButton
                  icon="minus"
                  size={18}
                  iconColor={colors.error}
                  onPress={() => handleUpdateCantidad(producto.id, cantidadEnCarrito - 1)}
                  style={styles.cantidadButtonOverlay}
                />
                <Surface style={styles.cantidadDisplayOverlay}>
                  <Text variant="titleSmall" style={styles.cantidadTextOverlay}>
                    {cantidadEnCarrito}
                  </Text>
                </Surface>
                <IconButton
                  icon="plus"
                  size={18}
                  iconColor={colors.primary}
                  onPress={() => handleAddProducto(producto)}
                  style={styles.cantidadButtonOverlay}
                />
              </View>
            </View>
          )}
          {cantidadEnCarrito === 0 && producto.tiene_stock && (
            <View style={styles.addButtonOverlay}>
              <Button
                mode="contained"
                icon="plus"
                compact
                onPress={() => handleAddProducto(producto)}
                style={styles.addButtonOverlayStyle}
              >
                Agregar
              </Button>
            </View>
          )}
        </View>
      </View>
    );
  }, [items, handleAddProducto, handleUpdateCantidad]);

  // Render productos sin stock
  const renderProductoSinStock = useCallback(({ item: producto }: { item: Producto }) => (
    <View style={styles.cardWrapper}>
      <View style={[styles.productCardContainer, styles.productoSinStockContainer]}>
        <ProductCard 
          producto={producto} 
          onPress={() => {}}
          showAddButton={false}
        />
        <View style={styles.disabledOverlay}>
          <Text variant="bodySmall" style={styles.disabledText} numberOfLines={1}>
            Sin stock
          </Text>
        </View>
      </View>
    </View>
  ), []);

  // Breadcrumb de productos
  const renderProductosBreadcrumb = () => {
    if (productosLevel === 'categorias') return null;

    return (
      <Surface style={styles.breadcrumb} elevation={1}>
        <TouchableOpacity 
          style={styles.breadcrumbItem} 
          onPress={() => {
            setSelectedCategoria(null);
            setSelectedSubcategoria(null);
            setProductosLevel('categorias');
            setSearchProducto('');
          }}
        >
          <Icon name="home" size={16} color={colors.primary} />
          <Text style={styles.breadcrumbText}>Categorías</Text>
        </TouchableOpacity>

        {selectedCategoria && (
          <>
            <Icon name="chevron-right" size={16} color={colors.textSecondary} />
            <TouchableOpacity 
              style={styles.breadcrumbItem}
              onPress={() => {
                if (productosLevel === 'productos' && subcategoriasFiltradas.length > 0) {
                  setSelectedSubcategoria(null);
                  setProductosLevel('subcategorias');
                  setSearchProducto('');
                }
              }}
              disabled={productosLevel === 'subcategorias' || subcategoriasFiltradas.length === 0}
            >
              <Text style={[
                styles.breadcrumbText,
                (productosLevel === 'subcategorias' || subcategoriasFiltradas.length === 0) && styles.breadcrumbTextActive
              ]}>
                {selectedCategoria.nombre}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {selectedSubcategoria && (
          <>
            <Icon name="chevron-right" size={16} color={colors.textSecondary} />
            <Text style={[styles.breadcrumbText, styles.breadcrumbTextActive]}>
              {selectedSubcategoria.nombre}
            </Text>
          </>
        )}
      </Surface>
    );
  };

  // Header de productos (paso 2)
  const renderProductosHeader = () => {
    let title = 'Categorías';
    if (productosLevel === 'subcategorias' && selectedCategoria) {
      title = selectedCategoria.nombre;
    } else if (productosLevel === 'productos') {
      title = selectedSubcategoria?.nombre || selectedCategoria?.nombre || 'Productos';
    }

    return (
      <Surface style={styles.productosHeader} elevation={2}>
        <View style={styles.productosHeaderRow}>
          {productosLevel !== 'categorias' && (
            <IconButton
              icon="arrow-left"
              size={22}
              onPress={handleBackProductos}
              style={styles.backButtonSmall}
            />
          )}
          <Text style={styles.productosHeaderTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {productosLevel === 'productos' && (
          <Searchbar
            placeholder="Buscar productos..."
            onChangeText={setSearchProducto}
            value={searchProducto}
            style={styles.searchbarCompact}
            icon="magnify"
          />
        )}
      </Surface>
    );
  };

  const isLoadingProductosData = 
    (productosLevel === 'categorias' && loadingCategorias) ||
    (productosLevel === 'subcategorias' && loadingSubcategorias) ||
    (productosLevel === 'productos' && loadingProductos && productos.length === 0);

  return (
    <ScreenContainer edges={[]}>
      {(loadingClientes || loadingListas || creating) && <LoadingOverlay visible message="Procesando..." />}

      {/* Stepper */}
      <View style={styles.stepper}>
        <View style={[styles.step, paso >= 1 && styles.stepActive]}>
          <Text variant="labelSmall" style={paso >= 1 && styles.stepTextActive}>1. Cliente</Text>
        </View>
        <Divider style={styles.stepDivider} />
        <View style={[styles.step, paso >= 2 && styles.stepActive]}>
          <Text variant="labelSmall" style={paso >= 2 && styles.stepTextActive}>2. Productos</Text>
        </View>
        <Divider style={styles.stepDivider} />
        <View style={[styles.step, paso >= 3 && styles.stepActive]}>
          <Text variant="labelSmall" style={paso >= 3 && styles.stepTextActive}>3. Confirmar</Text>
        </View>
      </View>

      {/* PASO 1: Seleccionar Cliente */}
      {paso === 1 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="titleLarge" style={styles.title}>Seleccione un cliente</Text>
          <Searchbar
            placeholder="Buscar por nombre o email..."
            onChangeText={setSearchCliente}
            value={searchCliente}
            style={styles.searchbar}
          />
          {clientesFiltrados.map((cliente) => (
            <List.Item
              key={cliente.id}
              title={`${cliente.nombre} ${cliente.apellido}`}
              description={cliente.email}
              left={(props) => <List.Icon {...props} icon="account" />}
              onPress={() => handleSelectCliente(cliente)}
            />
          ))}
        </ScrollView>
      )}

      {/* PASO 2: Agregar Productos con Navegación Jerárquica */}
      {paso === 2 && (
        <View style={styles.paso2Container}>
          {/* Info del cliente seleccionado */}
          <Surface style={styles.clienteInfoBar} elevation={1}>
            <View style={styles.clienteInfoRow}>
              <Icon name="account" size={20} color={colors.primary} />
              <Text style={styles.clienteInfoText} numberOfLines={1}>
                {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}
              </Text>
              <Button 
                mode="text" 
                textColor={colors.primary}
                onPress={() => setPaso(1)}
                compact
              >
                Cambiar
              </Button>
            </View>
          </Surface>

          {/* Header de productos */}
          {renderProductosHeader()}
          
          {/* Breadcrumb de productos */}
          {renderProductosBreadcrumb()}

          {/* Loading */}
          {isLoadingProductosData && <LoadingOverlay visible message="Cargando..." />}

          {/* Nivel: Categorías */}
          {productosLevel === 'categorias' && !loadingCategorias && (
            <FlatList
              data={categorias}
              renderItem={renderCategoria}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.categoriasList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Nivel: Subcategorías */}
          {productosLevel === 'subcategorias' && !loadingSubcategorias && (
            <FlatList
              data={subcategoriasFiltradas}
              renderItem={renderSubcategoria}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.categoriasList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Nivel: Productos */}
          {productosLevel === 'productos' && (
            <FlatList
              data={productosConStock}
              renderItem={renderProductoConStock}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.productsList}
              showsVerticalScrollIndicator={false}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              ListFooterComponent={
                <>
                  {loadingMore && (
                    <View style={styles.footerLoader}>
                      <Text style={styles.footerText}>Cargando más...</Text>
                    </View>
                  )}
                  {productosSinStock.length > 0 && (
                    <>
                      <Text variant="titleMedium" style={styles.sinStockSectionTitle}>
                        Productos Sin Stock
                      </Text>
                      <FlatList
                        data={productosSinStock}
                        renderItem={renderProductoSinStock}
                        keyExtractor={(item) => `sin-stock-${item.id}`}
                        numColumns={2}
                        scrollEnabled={false}
                      />
                    </>
                  )}
                </>
              }
            />
          )}

          {/* Barra del carrito */}
          <Surface style={[styles.carrito, { paddingBottom: Math.max(spacing.md, insets.bottom) }]} elevation={5}>
            <View style={styles.carritoInfo}>
              <View style={styles.carritoInfoRow}>
                <Icon name="cart" size={24} color={colors.primary} />
                <View style={styles.carritoInfoText}>
                  <Text variant="titleMedium" style={styles.carritoItems}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.carritoTotal}>
                    Total: {formatPrice(calcularTotal())}
                  </Text>
                </View>
              </View>
            </View>
            <Button
              mode="contained"
              icon="arrow-right"
              disabled={items.length === 0}
              onPress={() => setPaso(3)}
              style={styles.continuarButton}
              contentStyle={styles.continuarButtonContent}
            >
              Confirmar y Continuar
            </Button>
          </Surface>
        </View>
      )}

      {/* PASO 3: Confirmar */}
      {paso === 3 && (
        <View style={styles.paso3Container}>
          <ScrollView contentContainerStyle={styles.scrollContentPaso3}>
            <Surface style={styles.resumenSection} elevation={1}>
              <Text variant="titleMedium">Cliente</Text>
              <Text variant="bodyLarge">{clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}</Text>
            </Surface>

            <Surface style={styles.resumenSection} elevation={1}>
              <View style={styles.listaPrecioSection}>
                <View style={styles.listaPrecioHeader}>
                  <Text variant="titleMedium">Lista de Precios</Text>
                  <Button 
                    mode="outlined" 
                    icon="tag"
                    onPress={handleOpenMenu}
                    style={styles.listaPrecioButton}
                  >
                    {listaSeleccionada?.nombre || 'Seleccionar'}
                  </Button>
                </View>
                {listaSeleccionada && (
                  <Text variant="bodyMedium" style={styles.listaPrecioInfo}>
                    Descuento: {listaSeleccionada.descuento_porcentaje}%
                  </Text>
                )}
              </View>
            </Surface>

            <Surface style={styles.resumenSection} elevation={1}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Productos ({items.length})</Text>
              {items.map((item, index) => {
                const precioBase = parseFloat(item.producto.precio);
                const precioUnitario = calcularPrecioConDescuento(precioBase);
                const subtotal = precioUnitario * item.cantidad;
                
                return (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text variant="bodyLarge" style={styles.itemNombre}>{item.producto.nombre}</Text>
                      <View style={styles.itemDetails}>
                        <Text variant="bodySmall" style={styles.itemPrecioUnitario}>
                          {formatPrice(precioUnitario)} c/u
                        </Text>
                        <Text variant="bodyMedium" style={styles.itemSubtotal}>
                          Subtotal: {formatPrice(subtotal)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemActions}>
                      <View style={styles.cantidadControlsConfirm}>
                        <IconButton
                          icon="minus-circle"
                          size={22}
                          iconColor={colors.error}
                          onPress={() => handleUpdateCantidad(item.producto.id, item.cantidad - 1)}
                          style={styles.cantidadButtonConfirm}
                        />
                        <Surface style={styles.cantidadDisplayConfirm}>
                          <Text variant="titleMedium" style={styles.cantidadTextConfirm}>
                            {item.cantidad}
                          </Text>
                        </Surface>
                        <IconButton
                          icon="plus-circle"
                          size={22}
                          iconColor={colors.primary}
                          onPress={() => handleUpdateCantidad(item.producto.id, item.cantidad + 1)}
                          style={styles.cantidadButtonConfirm}
                        />
                      </View>
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={colors.error}
                        onPress={() => handleRemoveItem(item.producto.id)}
                        style={styles.deleteButton}
                      />
                    </View>
                  </View>
                );
              })}
            </Surface>

            {/* Spacer para empujar el total al fondo cuando hay poco contenido */}
            <View style={styles.spacer} />

            <Surface style={styles.totalSection} elevation={1}>
              <View style={styles.totalRow}>
                <Text variant="headlineSmall" style={styles.totalLabel}>Total:</Text>
                <Text variant="headlineSmall" style={styles.totalValue}>
                  {formatPrice(calcularTotal())}
                </Text>
              </View>
            </Surface>
          </ScrollView>

          {/* Modal de selección de lista - Fuera del ScrollView para que no se mueva */}
          <Portal>
            {menuListaPrecioVisible && (
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={handleCloseMenu}
              >
                <Surface 
                  style={styles.listaPrecioModal} 
                  elevation={4}
                >
                  <Text variant="titleMedium" style={styles.modalTitle}>Seleccionar Lista</Text>
                  <ScrollView style={styles.modalScrollView}>
                    {listas.map((lista) => (
                      <TouchableOpacity 
                        key={lista.id} 
                        style={styles.listaOption}
                        onPress={() => handleSelectLista(lista)}
                      >
                        <Text style={styles.listaOptionText}>
                          {lista.nombre} ({lista.descuento_porcentaje}% desc.)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Button mode="text" onPress={handleCloseMenu}>Cerrar</Button>
                </Surface>
              </TouchableOpacity>
            )}
          </Portal>

          {/* Barra de acciones fija */}
          <Surface style={[styles.actionsBar, { paddingBottom: Math.max(spacing.md, insets.bottom) }]} elevation={5}>
            <Button 
              mode="outlined" 
              onPress={() => setPaso(2)}
              style={styles.actionButton}
            >
              Atrás
            </Button>
            <Button 
              mode="contained" 
              onPress={handleConfirmarPedido}
              style={styles.actionButton}
            >
              Confirmar Pedido
            </Button>
          </Surface>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  stepActive: {
    backgroundColor: colors.primaryContainer,
  },
  stepTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  stepDivider: {
    width: spacing.sm,
  },
  scrollContent: {
    padding: spacing.md,
  },
  paso3Container: {
    flex: 1,
  },
  scrollContentPaso3: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  searchbar: {
    marginBottom: spacing.md,
  },
  paso2Container: {
    flex: 1,
  },
  clienteInfoBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  clienteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clienteInfoText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 15,
    color: colors.text,
  },
  productosHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  productosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonSmall: {
    marginRight: spacing.xs,
  },
  productosHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  searchbarCompact: {
    marginTop: spacing.sm,
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
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  breadcrumbTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  categoriasList: {
    padding: spacing.sm,
    paddingBottom: 140,
  },
  productsList: {
    padding: spacing.sm,
    paddingBottom: 140,
  },
  cardWrapper: {
    width: (screenWidth - spacing.sm * 3) / 2,
    margin: spacing.sm / 2,
  },
  productCardContainer: {
    position: 'relative',
  },
  cantidadOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    padding: spacing.xs / 2,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.outline + '20',
  },
  cantidadControlsOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  cantidadButtonOverlay: {
    margin: 0,
    width: 28,
    height: 28,
  },
  cantidadDisplayOverlay: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    minWidth: 32,
    alignItems: 'center',
  },
  cantidadTextOverlay: {
    fontWeight: '700',
    color: colors.onPrimaryContainer,
    fontSize: 13,
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
  productoSinStockContainer: {
    opacity: 0.7,
  },
  disabledOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  disabledText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  sinStockSectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
    color: colors.error,
    fontWeight: '600',
  },
  footerLoader: {
    padding: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  carrito: {
    padding: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.primary + '30',
    backgroundColor: colors.surface,
  },
  carritoInfo: {
    marginBottom: spacing.sm,
  },
  carritoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  carritoInfoText: {
    flex: 1,
  },
  carritoItems: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  carritoTotal: {
    color: colors.primary,
    fontWeight: '600',
  },
  continuarButton: {
    marginTop: spacing.sm,
  },
  continuarButtonContent: {
    paddingVertical: spacing.xs,
  },
  resumenSection: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  listaPrecioSection: {
    gap: spacing.sm,
  },
  listaPrecioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listaPrecioButton: {
    marginLeft: spacing.md,
  },
  listaPrecioInfo: {
    color: colors.secondary,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  listaPrecioModal: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: '70%',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  listaOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  listaOptionText: {
    fontSize: 15,
    color: colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline + '20',
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemNombre: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  itemDetails: {
    gap: spacing.xs / 2,
  },
  itemPrecioUnitario: {
    color: colors.textSecondary,
  },
  itemSubtotal: {
    color: colors.primary,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cantidadControlsConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    padding: spacing.xs / 2,
  },
  cantidadButtonConfirm: {
    margin: 0,
    width: 32,
    height: 32,
  },
  cantidadDisplayConfirm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.surface,
    minWidth: 45,
    alignItems: 'center',
  },
  cantidadTextConfirm: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 16,
  },
  deleteButton: {
    margin: 0,
  },
  totalSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontWeight: '700',
    color: colors.primary,
  },
  totalValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  actionButton: {
    flex: 1,
  },
});

export default NuevoPedidoScreen;

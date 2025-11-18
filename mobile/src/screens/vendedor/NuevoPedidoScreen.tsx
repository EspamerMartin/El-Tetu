import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, Dimensions } from 'react-native';
import { Text, Button, Searchbar, List, Divider, Card, Chip, Surface, Menu, IconButton, Badge } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { clientesAPI, productosAPI, pedidosAPI, listasAPI } from '@/services/api';
import { Cliente, Producto, CreatePedidoData, ListaPrecio } from '@/types';
import { LoadingOverlay, ScreenContainer, ProductCard } from '@/components';
import { theme, spacing } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;

type Props = NativeStackScreenProps<VendedorStackParamList | AdminStackParamList, 'NuevoPedido'>;

interface ItemPedido {
  producto: Producto;
  cantidad: number;
}

/**
 * NuevoPedidoScreen
 * 
 * Crear nuevo pedido manualmente:
 * Paso 1: Seleccionar cliente
 * Paso 2: Agregar productos
 * Paso 3: Confirmar pedido
 */
const NuevoPedidoScreen = ({ navigation }: Props) => {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [searchProducto, setSearchProducto] = useState('');
  const [listaSeleccionada, setListaSeleccionada] = useState<ListaPrecio | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuListaPrecioVisible, setMenuListaPrecioVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const menuOpenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: clientesData, loading: loadingClientes } = useFetch(() => 
    clientesAPI.getAll({ rol: 'cliente' })
  );
  const { data: productosData, loading: loadingProductos } = useFetch(() => productosAPI.getAll({ activo: true }));
  const { data: listasData, loading: loadingListas } = useFetch(() => listasAPI.getAll());
  const clientes = clientesData?.results || [];
  const productos = productosData?.results || [];
  const listas = listasData?.results || [];

  // Seleccionar Lista Base por defecto (solo una vez)
  useEffect(() => {
    if (listas.length > 0 && !listaSeleccionada) {
      const listaBase = listas.find(l => l.codigo === 'base') || listas[0];
      setListaSeleccionada(listaBase);
    }
  }, [listas]); // Removido listaSeleccionada de dependencias

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (menuOpenTimeoutRef.current) {
        clearTimeout(menuOpenTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenMenu = useCallback(() => {
    // Limpiar cualquier timeout pendiente
    if (menuOpenTimeoutRef.current) {
      clearTimeout(menuOpenTimeoutRef.current);
      menuOpenTimeoutRef.current = null;
    }
    // Usar un pequeño delay para asegurar que el estado anterior se haya limpiado
    menuOpenTimeoutRef.current = setTimeout(() => {
      setMenuListaPrecioVisible(true);
      menuOpenTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleCloseMenu = useCallback(() => {
    // Limpiar timeout si existe
    if (menuOpenTimeoutRef.current) {
      clearTimeout(menuOpenTimeoutRef.current);
      menuOpenTimeoutRef.current = null;
    }
    setMenuListaPrecioVisible(false);
  }, []);

  const handleSelectLista = useCallback((lista: ListaPrecio) => {
    // Cerrar el menú primero
    setMenuListaPrecioVisible(false);
    // Luego actualizar la lista con un pequeño delay para evitar conflictos
    setTimeout(() => {
      setListaSeleccionada(lista);
    }, 100);
  }, []);

  const clientesFiltrados = searchCliente
    ? clientes.filter(c => 
        c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
        c.email.toLowerCase().includes(searchCliente.toLowerCase())
      )
    : clientes;

  const productosFiltrados = searchProducto
    ? productos.filter(p => p.nombre.toLowerCase().includes(searchProducto.toLowerCase()))
    : productos;

  // Separar productos con stock y sin stock
  const productosConStock = productosFiltrados.filter(p => p.stock > 0);
  const productosSinStock = productosFiltrados.filter(p => p.stock === 0);


  const handleSelectCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setPaso(2);
    setSearchCliente('');
  };

  const handleAddProducto = (producto: Producto) => {
    const existente = items.find(i => i.producto.id === producto.id);
    
    if (existente) {
      // Validar que no exceda el stock
      if (existente.cantidad + 1 > producto.stock) {
        Alert.alert('Stock insuficiente', `Solo hay ${producto.stock} unidades disponibles`);
        return;
      }
      setItems(items.map(i => 
        i.producto.id === producto.id 
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      ));
    } else {
      // Validar que haya stock
      if (producto.stock < 1) {
        Alert.alert('Sin stock', 'Este producto no tiene stock disponible');
        return;
      }
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
    
    const item = items.find(i => i.producto.id === productoId);
    if (item && cantidad > item.producto.stock) {
      Alert.alert('Stock insuficiente', `Solo hay ${item.producto.stock} unidades disponibles`);
      return;
    }
    
    setItems(items.map(i => 
      i.producto.id === productoId 
        ? { ...i, cantidad }
        : i
    ));
  };

  // Calcular precio con descuento de la lista seleccionada
  const calcularPrecioConDescuento = (precioBase: number | string): number => {
    const precio = typeof precioBase === 'string' ? parseFloat(precioBase) : precioBase;
    if (isNaN(precio)) {
      return 0;
    }
    if (!listaSeleccionada) {
      return precio;
    }
    const descuentoPorcentaje = parseFloat(listaSeleccionada.descuento_porcentaje);
    if (isNaN(descuentoPorcentaje) || descuentoPorcentaje === 0) {
      return precio;
    }
    const descuento = precio * (descuentoPorcentaje / 100);
    return precio - descuento;
  };


  // Calcular total
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

  return (
    <ScreenContainer>
      {(loadingClientes || loadingProductos || loadingListas || creating) && <LoadingOverlay visible message="Procesando..." />}

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

      {/* PASO 2: Agregar Productos */}
      {paso === 2 && (
        <View style={styles.paso2Container}>
          {/* Header minimalista */}
          <Surface style={styles.paso2Header} elevation={2}>
            <View style={styles.headerCompact}>
              <View style={styles.headerInfo}>
                <View style={styles.headerRow}>
                  <Icon name="account" size={24} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={styles.headerText} numberOfLines={1}>
                    {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}
                  </Text>
                  <Button 
                    mode="text" 
                    textColor={theme.colors.primary}
                    onPress={() => setPaso(1)}
                    style={styles.changeButton}
                    contentStyle={styles.changeButtonContent}
                  >
                    Cambiar
                  </Button>
                </View>
              </View>
            </View>
            <Searchbar
              placeholder="Buscar productos..."
              onChangeText={setSearchProducto}
              value={searchProducto}
              style={styles.searchbarCompact}
            />
          </Surface>

          {/* Lista de productos en grid */}
          <ScrollView 
            style={styles.productosScrollView}
            contentContainerStyle={styles.productsList}
          >
            {/* Productos */}
            {productosConStock.length > 0 && (
              <View style={styles.productsGrid}>
                {productosConStock.map((producto) => {
                  const itemEnCarrito = items.find(i => i.producto.id === producto.id);
                  const cantidadEnCarrito = itemEnCarrito?.cantidad || 0;
                  const puedeAgregar = producto.stock > cantidadEnCarrito;
                  
                  return (
                    <View key={producto.id} style={styles.productWrapper}>
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
                                iconColor={theme.colors.error}
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
                                iconColor={theme.colors.primary}
                                onPress={() => handleAddProducto(producto)}
                                disabled={!puedeAgregar}
                                style={styles.cantidadButtonOverlay}
                              />
                            </View>
                          </View>
                        )}
                        {cantidadEnCarrito === 0 && producto.stock > 0 && (
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
                })}
              </View>
            )}


            {/* Productos sin Stock */}
            {productosSinStock.length > 0 && (
              <>
                <Text variant="titleMedium" style={styles.sinStockSectionTitle}>
                  Productos Sin Stock
                </Text>
                <View style={styles.productsGrid}>
                  {productosSinStock.map((producto) => (
                    <View key={producto.id} style={styles.productWrapper}>
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
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <Surface style={styles.carrito} elevation={5}>
            <View style={styles.carritoInfo}>
              <View style={styles.carritoInfoRow}>
                <Icon name="cart" size={24} color={theme.colors.primary} />
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
        <ScrollView contentContainerStyle={styles.scrollContent}>

          <Surface style={styles.resumenSection} elevation={1}>
            <Text variant="titleMedium">Cliente</Text>
            <Text variant="bodyLarge">{clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}</Text>
          </Surface>

          <Surface style={styles.resumenSection} elevation={1}>
            <View style={styles.listaPrecioSection}>
              <View style={styles.listaPrecioHeader}>
                <Text variant="titleMedium">Lista de Precios</Text>
                <Menu
                  visible={menuListaPrecioVisible}
                  onDismiss={handleCloseMenu}
                  anchor={
                    <Button 
                      mode="outlined" 
                      icon="tag"
                      onPress={handleOpenMenu}
                      style={styles.listaPrecioButton}
                      contentStyle={styles.listaPrecioButtonContent}
                    >
                      {listaSeleccionada?.nombre || 'Seleccionar lista'}
                    </Button>
                  }
                >
                  {listas.map((lista) => (
                    <Menu.Item
                      key={lista.id}
                      onPress={() => handleSelectLista(lista)}
                      title={`${lista.nombre} (${lista.descuento_porcentaje}% desc.)`}
                    />
                  ))}
                </Menu>
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
              const puedeIncrementar = item.cantidad < item.producto.stock;
              
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
                        iconColor={theme.colors.error}
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
                        iconColor={theme.colors.primary}
                        onPress={() => handleUpdateCantidad(item.producto.id, item.cantidad + 1)}
                        disabled={!puedeIncrementar}
                        style={styles.cantidadButtonConfirm}
                      />
                    </View>
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={theme.colors.error}
                      onPress={() => handleRemoveItem(item.producto.id)}
                      style={styles.deleteButton}
                    />
                  </View>
                </View>
              );
            })}
          </Surface>

          {/* Resumen de Totales */}
          <Surface style={styles.totalSection} elevation={1}>
            <View style={styles.totalRow}>
              <Text variant="headlineSmall" style={styles.totalLabel}>Total:</Text>
              <Text variant="headlineSmall" style={styles.totalValue}>
                {formatPrice(calcularTotal())}
              </Text>
            </View>
          </Surface>

          <View style={styles.actions}>
            <Button mode="outlined" onPress={() => setPaso(2)}>Atrás</Button>
            <Button mode="contained" onPress={handleConfirmarPedido}>Confirmar Pedido</Button>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  stepActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
  stepTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  stepDivider: {
    width: spacing.sm,
  },
  paso2Container: {
    flex: 1,
  },
  paso2Header: {
    backgroundColor: theme.colors.surface,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerCompact: {
    paddingHorizontal: spacing.xs,
  },
  headerInfo: {
    gap: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
  },
  headerText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
  },
  changeButton: {
    margin: 0,
    minWidth: 70,
  },
  changeButtonContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  listaButtonContainer: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  listaButton: {
    margin: 0,
    flex: 1,
    minHeight: 40,
    alignSelf: 'flex-start',
  },
  listaButtonContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  listaButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  searchbarCompact: {
    marginTop: spacing.xs,
    marginHorizontal: 0,
    elevation: 0,
  },
  productsList: {
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.xs,
  },
  productWrapper: {
    flex: 1,
    margin: spacing.xs,
    maxWidth: (screenWidth - spacing.sm * 2 - spacing.xs * 4) / 2,
    minHeight: 240,
    position: 'relative',
  },
  productCardContainer: {
    position: 'relative',
  },
  promoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    gap: spacing.xs / 2,
  },
  promoBadgeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cantidadOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    padding: spacing.xs / 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: theme.colors.outline + '20',
  },
  cantidadControlsOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: theme.colors.primaryContainer,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidadTextOverlay: {
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
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
  sinStockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  productoSinStockContainer: {
    position: 'relative',
  },
  disabledOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    borderWidth: 2,
    borderColor: theme.colors.errorContainer,
    minHeight: 36,
  },
  disabledText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  sinStockSectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
    color: theme.colors.error,
    fontWeight: '600',
  },
  title: {
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  searchbar: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
  },
  categoriaTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  clienteCard: {
    padding: spacing.md,
    margin: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  listaPrecioCard: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  listaPrecioTitle: {
    marginBottom: spacing.xs,
    fontWeight: 'bold',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  productoCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  productoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  productoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  stockContainer: {
    flexShrink: 0,
  },
  stockChip: {
    height: 28,
    maxWidth: '100%',
  },
  stockOk: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  stockWarning: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  stockError: {
    backgroundColor: theme.colors.errorContainer,
  },
  stockChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  precio: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cantidadBadge: {
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    top: -8,
    right: -8,
  },
  cardActions: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  cantidadControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cantidadButton: {
    margin: 0,
  },
  cantidadDisplay: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    minWidth: 50,
    alignItems: 'center',
  },
  cantidadText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  carrito: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary + '30',
    backgroundColor: theme.colors.surface,
  },
  carritoInfo: {
    marginBottom: spacing.md,
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
    color: theme.colors.primary,
    fontWeight: '600',
  },
  continuarButton: {
    marginTop: spacing.sm,
  },
  continuarButtonContent: {
    paddingVertical: spacing.sm,
  },
  productoSinStock: {
    opacity: 0.6,
  },
  productoSinStockText: {
    opacity: 0.7,
  },
  resumenSection: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + '20',
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemNombre: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  itemDetails: {
    flexDirection: 'column',
    gap: spacing.xs / 2,
    marginTop: spacing.xs,
  },
  promoBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
    gap: spacing.xs / 2,
  },
  promoBadgeTextInline: {
    color: theme.colors.secondary,
    fontWeight: '600',
    fontSize: 10,
  },
  promoDescuentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs / 2,
  },
  promoDescuentoLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  promoDescuentoValue: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  itemTotalConDescuento: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs / 2,
  },
  itemPrecioUnitario: {
    color: theme.colors.onSurfaceVariant,
  },
  itemSubtotal: {
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 10,
    padding: spacing.xs / 2,
    gap: spacing.xs / 2,
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
    backgroundColor: theme.colors.surface,
    minWidth: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidadTextConfirm: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontSize: 16,
  },
  deleteButton: {
    margin: 0,
    marginLeft: spacing.xs,
  },
  listaPrecioSection: {
    gap: spacing.sm,
  },
  listaPrecioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  listaPrecioButton: {
    flex: 1,
    marginLeft: spacing.md,
  },
  listaPrecioButtonContent: {
    paddingVertical: spacing.xs,
  },
  listaPrecioInfo: {
    color: theme.colors.secondary,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  totalSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryContainer,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  descuentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  descuentoLabel: {
    color: theme.colors.secondary,
  },
  descuentoValue: {
    color: theme.colors.secondary,
    fontWeight: '700',
  },
  totalDivider: {
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  totalValue: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2, // Mucho espacio para evitar tocar botones del sistema
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
  },
  productosScrollView: {
    flex: 1,
  },
});

export default NuevoPedidoScreen;

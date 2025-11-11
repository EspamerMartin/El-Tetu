import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Text, Button, Searchbar, List, Divider, Card, Chip, Surface, Menu } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { useFetch } from '@/hooks';
import { clientesAPI, productosAPI, pedidosAPI, listasAPI } from '@/services/api';
import { Cliente, Producto, CreatePedidoData, ListaPrecio } from '@/types';
import { LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList, 'NuevoPedido'>;

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
  const [creating, setCreating] = useState(false);

  const { data: clientesData, loading: loadingClientes } = useFetch(() => clientesAPI.getAll());
  const { data: productosData, loading: loadingProductos } = useFetch(() => productosAPI.getAll({ activo: true }));
  const { data: listasData, loading: loadingListas } = useFetch(() => listasAPI.getAll());

  const clientes = clientesData?.results || [];
  const productos = productosData?.results || [];
  const listas = listasData?.results || [];

  // Seleccionar Lista Base por defecto
  useEffect(() => {
    if (listas.length > 0 && !listaSeleccionada) {
      const listaBase = listas.find(l => l.codigo === 'base') || listas[0];
      setListaSeleccionada(listaBase);
    }
  }, [listas]);

  const clientesFiltrados = searchCliente
    ? clientes.filter(c => 
        c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
        c.email.toLowerCase().includes(searchCliente.toLowerCase())
      )
    : clientes;

  const productosFiltrados = searchProducto
    ? productos.filter(p => p.nombre.toLowerCase().includes(searchProducto.toLowerCase()))
    : productos;

  // Agrupar productos por categoría
  const productosAgrupados = productosFiltrados.reduce((acc, producto) => {
    const categoria = producto.categoria_nombre || 'Sin categoría';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(producto);
    return acc;
  }, {} as Record<string, Producto[]>);

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

  const calcularTotal = () => {
    return items.reduce((acc, item) => {
      const precio = parseFloat(item.producto.precio);
      return acc + (precio * item.cantidad);
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
    <SafeAreaView style={styles.container}>
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
        <View style={styles.container}>
          <Surface style={styles.clienteCard} elevation={2}>
            <Text variant="titleSmall">Cliente seleccionado:</Text>
            <Text variant="bodyLarge">{clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}</Text>
            <Button mode="text" onPress={() => setPaso(1)}>Cambiar</Button>
          </Surface>

          <Surface style={styles.listaPrecioCard} elevation={1}>
            <Text variant="titleSmall" style={styles.listaPrecioTitle}>Lista de Precios:</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => setMenuVisible(true)}>
                  {listaSeleccionada?.nombre || 'Seleccionar lista'}
                </Button>
              }
            >
              {listas.map((lista) => (
                <Menu.Item
                  key={lista.id}
                  onPress={() => {
                    setListaSeleccionada(lista);
                    setMenuVisible(false);
                  }}
                  title={`${lista.nombre} (${lista.descuento_porcentaje}% desc.)`}
                />
              ))}
            </Menu>
          </Surface>

          <Searchbar
            placeholder="Buscar productos..."
            onChangeText={setSearchProducto}
            value={searchProducto}
            style={styles.searchbar}
          />

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {Object.entries(productosAgrupados).map(([categoria, productos]) => (
              <View key={categoria}>
                <Text variant="titleMedium" style={styles.categoriaTitle}>{categoria}</Text>
                {productos.map((producto) => (
                  <Card key={producto.id} style={styles.productoCard}>
                    <Card.Content>
                      <Text variant="titleMedium">{producto.nombre}</Text>
                      <Text variant="bodySmall" style={{ color: producto.stock > 0 ? theme.colors.onSurface : theme.colors.error }}>
                        Stock: {producto.stock} {producto.stock === 0 && '(Sin stock)'}
                      </Text>
                      <Text variant="bodyLarge" style={styles.precio}>
                        {formatPrice(producto.precio)}
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button 
                        onPress={() => handleAddProducto(producto)}
                        disabled={producto.stock === 0}
                      >
                        Agregar
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            ))}
          </ScrollView>

          <Surface style={styles.carrito} elevation={2}>
            <Text variant="titleSmall">Items: {items.length}</Text>
            <Button
              mode="contained"
              disabled={items.length === 0}
              onPress={() => setPaso(3)}
            >
              Continuar
            </Button>
          </Surface>
        </View>
      )}

      {/* PASO 3: Confirmar */}
      {paso === 3 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="titleLarge" style={styles.title}>Resumen del Pedido</Text>

          <Surface style={styles.resumenSection} elevation={1}>
            <Text variant="titleMedium">Cliente</Text>
            <Text variant="bodyLarge">{clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}</Text>
          </Surface>

          <Surface style={styles.resumenSection} elevation={1}>
            <Text variant="titleMedium">Lista de Precios</Text>
            <Text variant="bodyLarge">{listaSeleccionada?.nombre} ({listaSeleccionada?.descuento_porcentaje}% desc.)</Text>
          </Surface>

          <Surface style={styles.resumenSection} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Productos ({items.length})</Text>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyMedium">{item.producto.nombre}</Text>
                  <Text variant="bodySmall">
                    x{item.cantidad} - {formatPrice(item.producto.precio)}
                  </Text>
                </View>
                <Button mode="text" icon="minus" compact onPress={() => handleUpdateCantidad(item.producto.id, item.cantidad - 1)}>
                  {item.cantidad}
                </Button>
                <Button mode="text" icon="plus" compact onPress={() => handleUpdateCantidad(item.producto.id, item.cantidad + 1)}>+</Button>
                <Button mode="text" icon="delete" compact onPress={() => handleRemoveItem(item.producto.id)}>X</Button>
              </View>
            ))}
          </Surface>

          <Surface style={styles.totalSection} elevation={1}>
            <Text variant="headlineSmall">Total: {formatPrice(calcularTotal())}</Text>
          </Surface>

          <View style={styles.actions}>
            <Button mode="outlined" onPress={() => setPaso(2)}>Atrás</Button>
            <Button mode="contained" onPress={handleConfirmarPedido}>Confirmar Pedido</Button>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 3, // Más espacio para evitar solapamiento con botones del sistema
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
    borderRadius: 8,
  },
  listaPrecioCard: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
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
  },
  precio: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  carrito: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xl * 2, // Más espacio para botones del sistema
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
    paddingVertical: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  totalSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2, // Mucho espacio para evitar tocar botones del sistema
    paddingHorizontal: spacing.md,
  },
});

export default NuevoPedidoScreen;

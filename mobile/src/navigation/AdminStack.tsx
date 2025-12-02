import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import AdminHomeScreen from '@/screens/admin/AdminHomeScreen';
import UsuariosListScreen from '@/screens/admin/UsuariosListScreen';
import UsuarioFormScreen from '@/screens/admin/UsuarioFormScreen';
import ProductosListScreen from '@/screens/admin/ProductosListScreen';
import ProductoFormScreen from '@/screens/admin/ProductoFormScreen';
import MarcasListScreen from '@/screens/admin/MarcasListScreen';
import CategoriasListScreen from '@/screens/admin/CategoriasListScreen';
import PedidosListScreen from '@/screens/shared/PedidosListScreen';
import PedidoDetalleScreen from '@/screens/shared/PedidoDetalleScreen';
import ListasPreciosScreen from '@/screens/admin/ListasPreciosScreen';
import ListaPrecioFormScreen from '@/screens/admin/ListaPrecioFormScreen';
import AsignarListasClientesScreen from '@/screens/admin/AsignarListasClientesScreen';
import PerfilAdminScreen from '@/screens/admin/PerfilAdminScreen';
import NuevoPedidoScreen from '@/screens/vendedor/NuevoPedidoScreen';
import ProductosSinStockScreen from '@/screens/vendedor/ProductosSinStockScreen';

export type AdminDrawerParamList = {
  AdminHome: undefined;
  Usuarios: undefined;
  Productos: undefined;
  Marcas: undefined;
  Categorias: undefined;
  ListasPrecios: undefined;
  Pedidos: undefined;
  Perfil: undefined;
};

export type AdminStackParamList = {
  AdminDrawer: undefined;
  UsuarioForm: { usuarioId?: number };
  ProductoForm: { productoId?: number };
  ListaPrecioForm: { listaId?: number };
  AsignarListasClientes: undefined;
  PedidoAdminDetalle: { pedidoId: number };
  NuevoPedido: { clienteId?: number };
  ProductosSinStock: undefined;
};

const Drawer = createDrawerNavigator<AdminDrawerParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

/**
 * AdminDrawer
 * 
 * Drawer Navigator para administrador con:
 * - Dashboard: Estadísticas generales
 * - Usuarios: CRUD de usuarios
 * - Productos: CRUD de productos
 * - Categorías: CRUD de categorías
 * - Pedidos: Gestión de pedidos
 */
const AdminDrawer = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#1976D2',
        drawerInactiveTintColor: '#757575',
        headerShown: true,
      }}
    >
      <Drawer.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Usuarios"
        component={UsuariosListScreen}
        options={{
          title: 'Usuarios',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Productos"
        component={ProductosListScreen}
        options={{
          title: 'Productos',
          drawerIcon: ({ color, size }) => (
            <Icon name="package-variant" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Marcas"
        component={MarcasListScreen}
        options={{
          title: 'Marcas',
          drawerIcon: ({ color, size }) => (
            <Icon name="tag-heart" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Categorias"
        component={CategoriasListScreen}
        options={{
          title: 'Categorías',
          drawerIcon: ({ color, size }) => (
            <Icon name="tag-multiple" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="ListasPrecios"
        component={ListasPreciosScreen}
        options={{
          title: 'Listas de Precios',
          drawerIcon: ({ color, size }) => (
            <Icon name="format-list-bulleted" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Pedidos"
        component={PedidosListScreen}
        options={{
          title: 'Pedidos',
          drawerIcon: ({ color, size }) => (
            <Icon name="clipboard-list" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={PerfilAdminScreen}
        options={{
          title: 'Mi Perfil',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

/**
 * AdminStack
 * 
 * Stack principal para administradores con navegación a:
 * - Drawer (Dashboard, Usuarios, Productos, etc.)
 * - Formularios de creación/edición
 * - Detalles de pedidos
 */
const AdminStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminDrawer"
        component={AdminDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UsuarioForm"
        component={UsuarioFormScreen}
        options={({ route }) => ({
          title: route.params?.usuarioId ? 'Editar Usuario' : 'Nuevo Usuario',
        })}
      />
      <Stack.Screen
        name="ProductoForm"
        component={ProductoFormScreen}
        options={({ route }) => ({
          title: route.params?.productoId ? 'Editar Producto' : 'Nuevo Producto',
        })}
      />
      <Stack.Screen
        name="ListaPrecioForm"
        component={ListaPrecioFormScreen}
        options={({ route }) => ({
          title: route.params?.listaId ? 'Editar Lista' : 'Nueva Lista',
        })}
      />
      <Stack.Screen
        name="AsignarListasClientes"
        component={AsignarListasClientesScreen}
        options={{ title: 'Asignar Listas a Clientes' }}
      />
      <Stack.Screen
        name="PedidoAdminDetalle"
        component={PedidoDetalleScreen}
        options={{ title: 'Detalle Pedido' }}
      />
      <Stack.Screen
        name="NuevoPedido"
        component={NuevoPedidoScreen}
        options={{ title: 'Nuevo Pedido' }}
      />
      <Stack.Screen
        name="ProductosSinStock"
        component={ProductosSinStockScreen}
        options={{ title: 'Productos sin Stock' }}
      />
    </Stack.Navigator>
  );
};

export default AdminStack;

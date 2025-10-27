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
import CategoriasListScreen from '@/screens/admin/CategoriasListScreen';
import PedidosAdminListScreen from '@/screens/admin/PedidosAdminListScreen';
import PedidoAdminDetalleScreen from '@/screens/admin/PedidoAdminDetalleScreen';
import PromocionesListScreen from '@/screens/admin/PromocionesListScreen';
import PromocionFormScreen from '@/screens/admin/PromocionFormScreen';

export type AdminDrawerParamList = {
  AdminHome: undefined;
  Usuarios: undefined;
  Productos: undefined;
  Categorias: undefined;
  Pedidos: undefined;
  Promociones: undefined;
};

export type AdminStackParamList = {
  AdminDrawer: undefined;
  UsuarioForm: { usuarioId?: number };
  ProductoForm: { productoId?: number };
  PedidoAdminDetalle: { pedidoId: number };
  PromocionForm: { promocionId?: number };
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
 * - Promociones: CRUD de promociones
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
        name="Pedidos"
        component={PedidosAdminListScreen}
        options={{
          title: 'Pedidos',
          drawerIcon: ({ color, size }) => (
            <Icon name="clipboard-list" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Promociones"
        component={PromocionesListScreen}
        options={{
          title: 'Promociones',
          drawerIcon: ({ color, size }) => (
            <Icon name="sale" color={color} size={size} />
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
        name="PedidoAdminDetalle"
        component={PedidoAdminDetalleScreen}
        options={{ title: 'Detalle Pedido' }}
      />
      <Stack.Screen
        name="PromocionForm"
        component={PromocionFormScreen}
        options={({ route }) => ({
          title: route.params?.promocionId ? 'Editar Promoción' : 'Nueva Promoción',
        })}
      />
    </Stack.Navigator>
  );
};

export default AdminStack;

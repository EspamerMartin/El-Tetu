import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import VendedorHomeScreen from '@/screens/vendedor/VendedorHomeScreen';
import ClientesListScreen from '@/screens/vendedor/ClientesListScreen';
import ClienteDetalleScreen from '@/screens/vendedor/ClienteDetalleScreen';
import ClienteFormScreen from '@/screens/vendedor/ClienteFormScreen';
import PedidosListScreen from '@/screens/shared/PedidosListScreen';
import PedidoDetalleScreen from '@/screens/shared/PedidoDetalleScreen';
import NuevoPedidoScreen from '@/screens/vendedor/NuevoPedidoScreen';
import PerfilVendedorScreen from '@/screens/vendedor/PerfilVendedorScreen';
import ProductosSinStockScreen from '@/screens/vendedor/ProductosSinStockScreen';
import PromocionesListScreen from '@/screens/admin/PromocionesListScreen';
import PromocionFormScreen from '@/screens/admin/PromocionFormScreen';

export type VendedorDrawerParamList = {
  VendedorHome: undefined;
  Clientes: undefined;
  Promociones: undefined;
  Pedidos: undefined;
  Perfil: undefined;
};

export type VendedorStackParamList = {
  VendedorDrawer: undefined;
  ClienteDetalle: { clienteId: number };
  ClienteForm: undefined;
  PedidoDetalle: { pedidoId: number };
  NuevoPedido: { clienteId?: number };
  PromocionForm: { promocionId?: number };
  ProductosSinStock: undefined;
};

const Drawer = createDrawerNavigator<VendedorDrawerParamList>();
const Stack = createNativeStackNavigator<VendedorStackParamList>();

/**
 * VendedorDrawer
 * 
 * Drawer Navigator para vendedor con:
 * - Home: Resumen de actividad
 * - Clientes: Lista de clientes
 * - Pedidos: Todos los pedidos
 */
const VendedorDrawer = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#1976D2',
        drawerInactiveTintColor: '#757575',
        headerShown: true,
      }}
    >
      <Drawer.Screen
        name="VendedorHome"
        component={VendedorHomeScreen}
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Clientes"
        component={ClientesListScreen}
        options={{
          title: 'Clientes',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-multiple" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Promociones"
        component={PromocionesListScreen}
        options={{
          title: 'Promociones',
          drawerIcon: ({ color, size }) => (
            <Icon name="fire" color={color} size={size} />
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
        component={PerfilVendedorScreen}
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
 * VendedorStack
 * 
 * Stack principal para vendedores con navegación a:
 * - Drawer (Home, Clientes, Pedidos)
 * - Detalle de cliente
 * - Detalle de pedido
 * - Nuevo pedido
 */
const VendedorStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VendedorDrawer"
        component={VendedorDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClienteDetalle"
        component={ClienteDetalleScreen}
        options={{ title: 'Detalle Cliente' }}
      />
      <Stack.Screen
        name="ClienteForm"
        component={ClienteFormScreen}
        options={{ title: 'Nuevo Cliente' }}
      />
      <Stack.Screen
        name="PedidoDetalle"
        component={PedidoDetalleScreen}
        options={{ title: 'Detalle Pedido' }}
      />
      <Stack.Screen
        name="NuevoPedido"
        component={NuevoPedidoScreen}
        options={{ title: 'Nuevo Pedido' }}
      />
      <Stack.Screen
        name="PromocionForm"
        component={PromocionFormScreen}
        options={({ route }) => ({
          title: route.params?.promocionId ? 'Editar Promoción' : 'Nueva Promoción',
        })}
      />
      <Stack.Screen
        name="ProductosSinStock"
        component={ProductosSinStockScreen}
        options={{ title: 'Productos sin Stock' }}
      />
    </Stack.Navigator>
  );
};

export default VendedorStack;

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@/theme';

// Screens
import VendedorHomeScreen from '@/screens/vendedor/VendedorHomeScreen';
import ClientesListScreen from '@/screens/vendedor/ClientesListScreen';
import ClienteDetalleScreen from '@/screens/vendedor/ClienteDetalleScreen';
import PedidosListScreen from '@/screens/vendedor/PedidosListScreen';
import PedidoDetalleScreen from '@/screens/vendedor/PedidoDetalleScreen';
import NuevoPedidoScreen from '@/screens/vendedor/NuevoPedidoScreen';
import PerfilVendedorScreen from '@/screens/vendedor/PerfilVendedorScreen';
import ProductosBajoStockScreen from '@/screens/vendedor/ProductosBajoStockScreen';

export type VendedorDrawerParamList = {
  VendedorHome: undefined;
  Clientes: undefined;
  Pedidos: undefined;
  Perfil: undefined;
};

export type VendedorStackParamList = {
  VendedorDrawer: undefined;
  ClienteDetalle: { clienteId: number };
  PedidoDetalle: { pedidoId: number };
  NuevoPedido: { clienteId?: number };
  ProductosBajoStock: undefined;
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
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
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
        name="ProductosBajoStock"
        component={ProductosBajoStockScreen}
        options={{ title: 'Productos con Bajo Stock' }}
      />
    </Stack.Navigator>
  );
};

export default VendedorStack;

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import CatalogoScreen from '@/screens/cliente/CatalogoScreen';
import ProductoDetalleScreen from '@/screens/cliente/ProductoDetalleScreen';
import CarritoScreen from '@/screens/cliente/CarritoScreen';
import MisPedidosScreen from '@/screens/cliente/MisPedidosScreen';
import PedidoDetalleScreen from '@/screens/cliente/PedidoDetalleScreen';
import PerfilScreen from '@/screens/cliente/PerfilScreen';

export type ClienteTabParamList = {
  Catalogo: undefined;
  Carrito: undefined;
  MisPedidos: undefined;
  Perfil: undefined;
};

export type ClienteStackParamList = {
  ClienteTabs: { screen?: keyof ClienteTabParamList };
  ProductoDetalle: { productoId: number };
  PedidoDetalle: { pedidoId: number };
};

const Tab = createBottomTabNavigator<ClienteTabParamList>();
const Stack = createNativeStackNavigator<ClienteStackParamList>();

/**
 * ClienteTabs
 * 
 * Bottom Tab Navigator para cliente con:
 * - Catálogo: Pantalla principal con productos
 * - Carrito: Carrito de compras
 * - Mis Pedidos: Historial de compras
 * - Perfil: Datos del usuario
 */
const ClienteTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#757575',
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="Catalogo"
        component={CatalogoScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Carrito"
        component={CarritoScreen}
        options={{
          title: 'Carrito',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cart" color={color} size={size} />
          ),
          tabBarBadge: undefined, // TODO: Agregar contador de items
        }}
      />
      <Tab.Screen
        name="MisPedidos"
        component={MisPedidosScreen}
        options={{
          title: 'Mis Pedidos',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-list" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * ClienteStack
 * 
 * Stack principal para clientes con navegación a:
 * - Bottom Tabs (Catálogo, Carrito, Mis Pedidos, Perfil)
 * - Detalle de producto (modal)
 * - Detalle de pedido (modal)
 */
const ClienteStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ClienteTabs"
        component={ClienteTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductoDetalle"
        component={ProductoDetalleScreen}
        options={{ title: 'Producto' }}
      />
      <Stack.Screen
        name="PedidoDetalle"
        component={PedidoDetalleScreen}
        options={{ title: 'Detalle del Pedido' }}
      />
    </Stack.Navigator>
  );
};

export default ClienteStack;

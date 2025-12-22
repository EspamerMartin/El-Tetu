import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import TransportadorHomeScreen from '@/screens/transportador/TransportadorHomeScreen';
import PedidoDetalleTransportadorScreen from '@/screens/transportador/PedidoDetalleTransportadorScreen';

// Componentes compartidos
import { useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { colors, spacing } from '@/theme';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';

export type TransportadorDrawerParamList = {
  TransportadorHome: undefined;
};

export type TransportadorStackParamList = {
  TransportadorDrawer: undefined;
  PedidoDetalle: { pedidoId: number };
};

const Drawer = createDrawerNavigator<TransportadorDrawerParamList>();
const Stack = createNativeStackNavigator<TransportadorStackParamList>();

/**
 * Contenido personalizado del Drawer con opción de cerrar sesión.
 */
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const iniciales = user ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}` : 'TR';

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => dispatch(logout()) 
        },
      ]
    );
  };

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props}>
        {/* Header con info del usuario */}
        <View style={styles.drawerHeader}>
          <Avatar.Text size={56} label={iniciales} style={styles.avatar} />
          <Text variant="titleMedium" style={styles.userName}>
            {user?.nombre} {user?.apellido}
          </Text>
          <Text variant="bodySmall" style={styles.userEmail}>
            {user?.email}
          </Text>
          <View style={styles.rolBadge}>
            <Icon name="truck" size={14} color={colors.white} />
            <Text variant="labelSmall" style={styles.rolText}>
              Transportador
            </Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Items del drawer */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      
      {/* Botón de cerrar sesión al fondo */}
      <View style={styles.drawerFooter}>
        <Divider style={styles.divider} />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * TransportadorDrawer
 * 
 * Drawer Navigator para transportador con:
 * - Home: Lista de pedidos asignados para entregar
 */
const TransportadorDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        headerShown: true,
      }}
    >
      <Drawer.Screen
        name="TransportadorHome"
        component={TransportadorHomeScreen}
        options={{
          title: 'Mis Entregas',
          drawerIcon: ({ color, size }) => (
            <Icon name="truck-delivery" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

/**
 * TransportadorStack
 * 
 * Stack principal para transportadores con navegación a:
 * - Drawer (Home con lista de pedidos)
 * - Detalle de pedido
 */
const TransportadorStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TransportadorDrawer"
        component={TransportadorDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PedidoDetalle"
        component={PedidoDetalleTransportadorScreen}
        options={{ title: 'Detalle Pedido' }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
  },
  avatar: {
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  userName: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  rolText: {
    color: colors.white,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  drawerFooter: {
    padding: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TransportadorStack;


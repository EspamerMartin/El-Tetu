import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadStoredAuth } from '@/store/slices/authSlice';
import { ActivityIndicator, View } from 'react-native';

// Stacks
import AuthStack from './AuthStack';
import ClienteStack from './ClienteStack';
import VendedorStack from './VendedorStack';
import AdminStack from './AdminStack';

const Stack = createNativeStackNavigator();

/**
 * RootNavigator
 * 
 * Navegador principal que decide qué stack mostrar según:
 * - Si el usuario está autenticado
 * - El rol del usuario (cliente, vendedor, admin)
 */
const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);

  // Cargar autenticación almacenada al iniciar
  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Usuario no autenticado → AuthStack
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          // Usuario autenticado → Stack según rol
          <>
            {user?.rol === 'cliente' && (
              <Stack.Screen name="Cliente" component={ClienteStack} />
            )}
            {user?.rol === 'vendedor' && (
              <Stack.Screen name="Vendedor" component={VendedorStack} />
            )}
            {user?.rol === 'admin' && (
              <Stack.Screen name="Admin" component={AdminStack} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;

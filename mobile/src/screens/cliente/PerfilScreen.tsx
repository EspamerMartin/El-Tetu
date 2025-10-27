import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';

const PerfilScreen = () => {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Mi Perfil</Text>
      <Text>TODO: Implementar edición de perfil y datos</Text>
      <Button mode="contained" onPress={handleLogout} style={{ marginTop: 20 }}>
        Cerrar Sesión
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default PerfilScreen;

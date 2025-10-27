import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const UsuariosListScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Gestión de Usuarios</Text>
    <Text>TODO: CRUD de usuarios</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default UsuariosListScreen;

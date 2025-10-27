import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ClientesListScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Lista de Clientes</Text>
    <Text>TODO: Lista con búsqueda y filtros</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default ClientesListScreen;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const PedidosAdminListScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Todos los Pedidos</Text>
    <Text>TODO: Lista completa con filtros</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default PedidosAdminListScreen;

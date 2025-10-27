import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const NuevoPedidoScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Nuevo Pedido</Text>
    <Text>TODO: Formulario de creación de pedido</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default NuevoPedidoScreen;

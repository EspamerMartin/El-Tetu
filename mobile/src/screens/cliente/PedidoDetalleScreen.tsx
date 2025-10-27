import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const PedidoDetalleScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Detalle del Pedido</Text>
      <Text>TODO: Implementar detalle completo del pedido</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default PedidoDetalleScreen;

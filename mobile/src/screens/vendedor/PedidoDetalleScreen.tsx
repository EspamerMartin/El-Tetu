import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const PedidoDetalleScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Detalle del Pedido</Text>
    <Text>TODO: Info completa con cambio de estado</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default PedidoDetalleScreen;

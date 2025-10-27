import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const CarritoScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Carrito de Compras</Text>
      <Text>TODO: Implementar lista de items del carrito con totales</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default CarritoScreen;

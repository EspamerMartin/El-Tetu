import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ProductoFormScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Formulario Producto</Text>
    <Text>TODO: Crear/Editar producto</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default ProductoFormScreen;

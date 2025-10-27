import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const CatalogoScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Catálogo de Productos</Text>
      <Text>TODO: Implementar lista de productos con filtros</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default CatalogoScreen;

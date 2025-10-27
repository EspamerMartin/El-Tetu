import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const CategoriasListScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Gestión de Categorías</Text>
    <Text>TODO: CRUD de categorías</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default CategoriasListScreen;

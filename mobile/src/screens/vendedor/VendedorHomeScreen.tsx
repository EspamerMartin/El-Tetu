import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const VendedorHomeScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Dashboard Vendedor</Text>
    <Text>TODO: Estadísticas y resumen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default VendedorHomeScreen;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const PromocionesListScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Gestión de Promociones</Text>
    <Text>TODO: CRUD de promociones</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default PromocionesListScreen;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const PromocionFormScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Formulario Promoción</Text>
    <Text>TODO: Crear/Editar promoción</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default PromocionFormScreen;

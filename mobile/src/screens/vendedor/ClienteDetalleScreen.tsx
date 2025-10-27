import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ClienteDetalleScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Detalle del Cliente</Text>
    <Text>TODO: Info completa del cliente</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default ClienteDetalleScreen;

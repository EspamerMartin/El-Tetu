import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const UsuarioFormScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Formulario Usuario</Text>
    <Text>TODO: Crear/Editar usuario</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default UsuarioFormScreen;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const AdminHomeScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Dashboard Admin</Text>
    <Text>TODO: Estadísticas generales</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});

export default AdminHomeScreen;

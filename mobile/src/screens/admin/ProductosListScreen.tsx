import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Card, Chip, IconButton, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { ProductCard, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProductosListScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: productosData, loading, refetch } = useFetch(() => productosAPI.getAll());

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  const productos = productosData?.results || [];
  const productosFiltrados = searchQuery
    ? productos.filter((p: any) => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    : productos;

  const handleDelete = async (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar este producto?', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        onPress: async () => {
          try {
            await productosAPI.delete(id);
            refetch();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Searchbar placeholder="Buscar productos..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchbar} />

      {loading ? (
        <LoadingOverlay visible message="Cargando productos..." />
      ) : (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }: any) => (
            <Card style={styles.card}>
              <Card.Title
                title={item.nombre}
                subtitle={`Stock: ${item.stock}`}
                right={(props) => (
                  <View style={styles.actions}>
                    <IconButton {...props} icon="pencil" onPress={() => navigation.navigate('ProductoForm', { productoId: item.id })} />
                    <IconButton {...props} icon="delete" onPress={() => handleDelete(item.id)} />
                  </View>
                )}
              />
              <Card.Content>
                <Text variant="bodyLarge">${item.precio_base}</Text>
                <Chip icon={item.activo ? 'check' : 'close'} compact style={styles.chip}>
                  {item.activo ? 'Activo' : 'Inactivo'}
                </Chip>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="package-variant-closed" size={64} color={theme.colors.outline} />
              <Text variant="bodyLarge">No hay productos</Text>
            </View>
          }
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('ProductoForm')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchbar: { margin: spacing.md },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  actions: { flexDirection: 'row' },
  chip: { marginTop: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.xxl },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default ProductosListScreen;

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Card, Chip, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useFetch } from '@/hooks';
import { promocionesAPI } from '@/services/api';
import { LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PromocionesListScreen = ({ navigation }: any) => {
  const { data: promocionesData, loading, refetch } = useFetch(() => promocionesAPI.getAll());

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  const promociones = promocionesData?.results || [];

  const handleDelete = async (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta promoción?', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        onPress: async () => {
          try {
            await promocionesAPI.delete(id);
            refetch();
          } catch (err: any) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <LoadingOverlay visible message="Cargando promociones..." />
      ) : (
        <FlatList
          data={promociones}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }: any) => (
            <Card style={styles.card}>
              <Card.Title
                title={item.nombre}
                subtitle={`Tipo: ${item.tipo}`}
                right={(props) => (
                  <View style={styles.actions}>
                    <IconButton {...props} icon="pencil" onPress={() => navigation.navigate('PromocionForm', { promoId: item.id })} />
                    <IconButton {...props} icon="delete" onPress={() => handleDelete(item.id)} />
                  </View>
                )}
              />
              <Card.Content>
                <Text variant="bodyMedium">{item.descripcion}</Text>
                <Chip icon={item.activo ? 'check' : 'close'} compact style={styles.chip}>
                  {item.activo ? 'Activo' : 'Inactivo'}
                </Chip>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="tag-percent" size={64} color={theme.colors.outline} />
              <Text variant="bodyLarge">No hay promociones</Text>
            </View>
          }
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('PromocionForm')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  actions: { flexDirection: 'row' },
  chip: { marginTop: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.xxl },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default PromocionesListScreen;

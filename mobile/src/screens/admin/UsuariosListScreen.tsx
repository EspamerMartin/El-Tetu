import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Card, Avatar, Chip, IconButton, Searchbar } from 'react-native-paper';
import { useFetch } from '@/hooks';
import { clientesAPI } from '@/services/api';
import { LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UsuariosListScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: usuariosData, loading, refetch } = useFetch(() => clientesAPI.getAll());

  const usuarios = usuariosData?.results || [];
  const usuariosFiltrados = searchQuery
    ? usuarios.filter((u: any) =>
        u.usuario.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.usuario.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : usuarios;

  const handleDelete = async (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar este usuario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await clientesAPI.delete(id);
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
      <Searchbar
        placeholder="Buscar usuarios..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {loading ? (
        <LoadingOverlay visible message="Cargando usuarios..." />
      ) : (
        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }: any) => (
            <Card style={styles.card}>
              <Card.Title
                title={`${item.usuario.nombre} ${item.usuario.apellido}`}
                subtitle={item.usuario.email}
                left={(props) => <Avatar.Text {...props} label={item.usuario.nombre.charAt(0)} size={40} />}
                right={(props) => (
                  <View style={styles.actions}>
                    <IconButton {...props} icon="pencil" onPress={() => navigation.navigate('UsuarioForm', { usuarioId: item.id })} />
                    <IconButton {...props} icon="delete" onPress={() => handleDelete(item.id)} />
                  </View>
                )}
              />
              <Card.Content>
                <Chip icon={item.usuario.is_active ? 'check' : 'close'} compact>
                  {item.usuario.is_active ? 'Activo' : 'Inactivo'}
                </Chip>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="account-off" size={64} color={theme.colors.outline} />
              <Text variant="bodyLarge">No hay usuarios</Text>
            </View>
          }
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('UsuarioForm')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchbar: { margin: spacing.md },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  actions: { flexDirection: 'row' },
  empty: { alignItems: 'center', padding: spacing.xxl },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default UsuariosListScreen;

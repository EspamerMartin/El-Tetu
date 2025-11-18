import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Card, Avatar, Chip, IconButton, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useFetch } from '@/hooks';
import { clientesAPI } from '@/services/api';
import { LoadingOverlay } from '@/components';
import { theme, spacing, colors } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const getRolLabel = (rol: string) => {
  const roles: Record<string, string> = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    cliente: 'Cliente',
  };
  return roles[rol] || rol;
};

const getRolColor = (rol: string, colors: any) => {
  const roleColors: Record<string, string> = {
    admin: colors.error,
    vendedor: colors.tertiary,
    cliente: colors.primary,
  };
  return roleColors[rol] || colors.primary;
};

const UsuariosListScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: usuariosData, loading, refetch } = useFetch(() => clientesAPI.getAll());

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  const usuarios = usuariosData?.results || [];
  const usuariosFiltrados = searchQuery
    ? usuarios.filter((u: any) =>
        u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
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
                title={`${item.nombre} ${item.apellido}`}
                subtitle={item.email}
                left={(props) => <Avatar.Text {...props} label={item.nombre.charAt(0)} size={40} />}
                right={(props) => (
                  <View style={styles.actions}>
                    <IconButton {...props} icon="pencil" onPress={() => navigation.navigate('UsuarioForm', { usuarioId: item.id })} />
                    <IconButton {...props} icon="delete" onPress={() => handleDelete(item.id)} />
                  </View>
                )}
              />
              <Card.Content>
                <View style={styles.chipsRow}>
                  <Chip 
                    icon={item.is_active ? 'check' : 'close'} 
                    compact 
                    style={styles.chipSpacing}
                  >
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </Chip>
                  <Chip 
                    compact
                    textStyle={{ color: getRolColor(item.rol, theme.colors) }}
                    style={[styles.chipSpacing, { borderColor: getRolColor(item.rol, theme.colors) }]}
                  >
                    {getRolLabel(item.rol)}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="account-off" size={64} color={colors.outline} />
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
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  searchbar: { margin: spacing.md },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  actions: { flexDirection: 'row' },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chipSpacing: { marginRight: spacing.xs },
  empty: { alignItems: 'center', padding: spacing.xxl },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default UsuariosListScreen;

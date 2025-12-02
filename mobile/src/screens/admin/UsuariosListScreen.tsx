import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Card, Avatar, Chip, IconButton, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { AdminDrawerParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { clientesAPI } from '@/services/api';
import { LoadingOverlay } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { User } from '@/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const getRolLabel = (rol: string) => {
  const roles: Record<string, string> = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    cliente: 'Cliente',
  };
  return roles[rol] || rol;
};

const getRolColor = (rol: string) => {
  const roleColors: Record<string, string> = {
    admin: colors.error,
    vendedor: colors.tertiary,
    cliente: colors.primary,
  };
  return roleColors[rol] || colors.primary;
};

type NavigationProp = DrawerNavigationProp<AdminDrawerParamList, 'Usuarios'>;

const UsuariosListScreen = ({ navigation }: { navigation: NavigationProp }) => {
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
    Alert.alert(
      'Confirmar',
      '¿Desea eliminar este usuario? Si tiene pedidos asociados, solo se desactivará.',
      [
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
      ]
    );
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
          keyExtractor={(item: User) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: User }) => (
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
                    textStyle={{ color: getRolColor(item.rol) }}
                    style={[styles.chipSpacing, { borderColor: getRolColor(item.rol) }]}
                  >
                    {getRolLabel(item.rol)}
                  </Chip>
                  {item.zona_nombre && (
                    <Chip 
                      icon="map-marker-radius"
                      compact 
                      style={styles.zonaChip}
                      textStyle={styles.zonaText}
                    >
                      {item.zona_nombre}
                    </Chip>
                  )}
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
  container: { flex: 1, backgroundColor: colors.background },
  searchbar: { margin: spacing.md },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  actions: { flexDirection: 'row' },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chipSpacing: { marginRight: spacing.xs },
  zonaChip: { backgroundColor: colors.tertiary },
  zonaText: { color: colors.white, fontSize: 11 },
  empty: { alignItems: 'center', padding: spacing.xxl },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default UsuariosListScreen;

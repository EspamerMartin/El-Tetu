import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, IconButton, FAB, Dialog, Portal, Chip, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CategoriasListScreen = () => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: categoriasData, loading, refetch, error } = useFetch(() => productosAPI.getCategorias());

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  // El backend retorna una respuesta paginada, no un array directo
  const categorias = categoriasData?.results || [];

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const data = { nombre: nombre.trim(), descripcion: descripcion.trim(), activo };
      
      if (editingId) {
        await productosAPI.updateCategoria(editingId, data);
      } else {
        await productosAPI.createCategoria(data);
      }

      Alert.alert('Éxito', `Categoría ${editingId ? 'actualizada' : 'creada'} correctamente`);
      setDialogVisible(false);
      setNombre('');
      setDescripcion('');
      setActivo(true);
      setEditingId(null);
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (categoria: any) => {
    setEditingId(categoria.id);
    setNombre(categoria.nombre);
    setDescripcion(categoria.descripcion || '');
    setActivo(categoria.activo);
    setDialogVisible(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta categoría?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await productosAPI.deleteCategoria(id);
            refetch();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setActivo(true);
    setDialogVisible(true);
  };

  return (
    <View style={styles.container}>
      {loading && <LoadingOverlay visible message="Cargando categorías..." />}
      
      <FlatList
        data={categorias}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title
                title={item.nombre}
                subtitle={item.descripcion || 'Sin descripción'}
                left={(props) => (
                  <Avatar.Icon {...props} icon="tag" size={40} />
                )}
                right={(props) => (
                  <View style={styles.actions}>
                    <IconButton {...props} icon="pencil" onPress={() => handleEdit(item)} />
                    <IconButton {...props} icon="delete" onPress={() => handleDelete(item.id)} />
                  </View>
                )}
              />
              <Card.Content>
                <Chip icon={item.activo ? 'check' : 'close'} compact>
                  {item.activo ? 'Activa' : 'Inactiva'}
                </Chip>
              </Card.Content>
            </Card>
          )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Icon name="tag-off" size={64} color={theme.colors.outline} />
              <Text variant="bodyLarge">No hay categorías</Text>
              {error && <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: spacing.sm }}>{error}</Text>}
            </View>
          ) : null
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={handleOpenDialog} />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingId ? 'Editar' : 'Nueva'} Categoría</Dialog.Title>
          <Dialog.Content>
            <InputField label="Nombre" value={nombre} onChangeText={setNombre} />
            <InputField 
              label="Descripción" 
              value={descripcion} 
              onChangeText={setDescripcion} 
              multiline 
              numberOfLines={2}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSave} loading={saving} disabled={saving}>
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  actions: { flexDirection: 'row' },
  empty: { alignItems: 'center', padding: spacing.xxl },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default CategoriasListScreen;

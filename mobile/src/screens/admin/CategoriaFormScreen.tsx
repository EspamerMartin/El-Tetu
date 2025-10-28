import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, List, IconButton, FAB, Dialog, Portal } from 'react-native-paper';
import { InputField, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';

/**
 * CategoriaFormScreen - Formulario simple para crear/editar categoría
 * Implementación inline sin navegación separada
 */
const CategoriaFormScreen = ({ navigation }: any) => {
  const [categorias, setCategorias] = useState([
    { id: 1, nombre: 'Electrónica' },
    { id: 2, nombre: 'Ropa' },
    { id: 3, nombre: 'Alimentos' },
  ]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');

  const handleSave = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (editingId) {
      setCategorias(categorias.map(c => c.id === editingId ? { ...c, nombre } : c));
      Alert.alert('Éxito', 'Categoría actualizada');
    } else {
      setCategorias([...categorias, { id: Date.now(), nombre }]);
      Alert.alert('Éxito', 'Categoría creada');
    }

    setDialogVisible(false);
    setNombre('');
    setEditingId(null);
  };

  const handleEdit = (categoria: any) => {
    setEditingId(categoria.id);
    setNombre(categoria.nombre);
    setDialogVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta categoría?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', onPress: () => setCategorias(categorias.filter(c => c.id !== id)) },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>Categorías</Text>

        {categorias.map((categoria) => (
          <List.Item
            key={categoria.id}
            title={categoria.nombre}
            right={(props) => (
              <View style={styles.actions}>
                <IconButton {...props} icon="pencil" onPress={() => handleEdit(categoria)} />
                <IconButton {...props} icon="delete" onPress={() => handleDelete(categoria.id)} />
              </View>
            )}
          />
        ))}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          setEditingId(null);
          setNombre('');
          setDialogVisible(true);
        }}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingId ? 'Editar' : 'Nueva'} Categoría</Dialog.Title>
          <Dialog.Content>
            <InputField label="Nombre" value={nombre} onChangeText={setNombre} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSave}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: spacing.md },
  title: { marginBottom: spacing.lg, fontWeight: 'bold' },
  actions: { flexDirection: 'row' },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default CategoriaFormScreen;

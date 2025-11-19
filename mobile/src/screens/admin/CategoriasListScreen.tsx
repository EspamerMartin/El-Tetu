import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, IconButton, FAB, Dialog, Portal, Chip, Avatar, Menu, Switch } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import { Subcategoria, Categoria } from '@/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type EstadoFilter = 'TODOS' | 'ACTIVO' | 'INACTIVO';

const CategoriasListScreen = () => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [subDialogVisible, setSubDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategoria, setExpandedCategoria] = useState<number | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS');

  const { data: categoriasData, loading, refetch, error } = useFetch(
    () => productosAPI.getCategorias(estadoFilter === 'TODOS' ? {} : { activo: estadoFilter === 'ACTIVO' ? 'true' : 'false' })
  );
  const { data: subcategoriasData, refetch: refetchSubcategorias } = useFetch(() => productosAPI.getSubcategorias());

  useFocusEffect(
    React.useCallback(() => {
      refetch();
      refetchSubcategorias();
    }, [])
  );

  // Refetch cuando cambie el filtro de estado
  useEffect(() => {
    refetch();
  }, [estadoFilter, refetch]);

  const categorias = categoriasData?.results || [];
  const subcategorias = subcategoriasData?.results || [];

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const data: Partial<Categoria> = { 
        nombre: nombre.trim(), 
        descripcion: descripcion.trim() || undefined, 
        activo 
      };
      
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

  const handleSaveSubcategoria = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (!selectedCategoriaId && !editingSubId) {
      Alert.alert('Error', 'Debe seleccionar una categoría');
      return;
    }

    try {
      setSaving(true);
      const data: Partial<Subcategoria> = { 
        nombre: nombre.trim(), 
        descripcion: descripcion.trim() || undefined, 
        activo
      };
      
      if (selectedCategoriaId) {
        data.categoria = selectedCategoriaId;
      }
      
      if (editingSubId) {
        await productosAPI.updateSubcategoria(editingSubId, data);
      } else {
        await productosAPI.createSubcategoria(data);
      }

      Alert.alert('Éxito', `Subcategoría ${editingSubId ? 'actualizada' : 'creada'} correctamente`);
      setSubDialogVisible(false);
      setNombre('');
      setDescripcion('');
      setActivo(true);
      setEditingSubId(null);
      setSelectedCategoriaId(null);
      refetchSubcategorias();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingId(categoria.id);
    setNombre(categoria.nombre);
    setDescripcion(categoria.descripcion || '');
    setActivo(categoria.activo);
    setDialogVisible(true);
  };

  const handleEditSubcategoria = (subcategoria: Subcategoria) => {
    setEditingSubId(subcategoria.id);
    setSelectedCategoriaId(subcategoria.categoria);
    setNombre(subcategoria.nombre);
    setDescripcion(subcategoria.descripcion || '');
    setActivo(subcategoria.activo);
    setSubDialogVisible(true);
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
            Alert.alert('Éxito', 'Categoría eliminada correctamente');
            refetch();
            refetchSubcategorias();
          } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'No se pudo eliminar';
            
            // Detectar error de productos asociados
            if (errorMessage.includes('productos') || errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
              Alert.alert(
                'No se puede eliminar', 
                'Esta categoría tiene productos asociados. Primero debes eliminar o reasignar todos los productos que pertenecen a esta categoría.',
                [{ text: 'Entendido' }]
              );
            } else {
              Alert.alert('Error', errorMessage);
            }
          }
        },
      },
    ]);
  };

  const handleDeleteSubcategoria = async (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta subcategoría?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await productosAPI.deleteSubcategoria(id);
            Alert.alert('Éxito', 'Subcategoría eliminada correctamente');
            refetchSubcategorias();
          } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'No se pudo eliminar';
            
            if (errorMessage.includes('productos') || errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
              Alert.alert(
                'No se puede eliminar', 
                'Esta subcategoría tiene productos asociados. Primero debes eliminar o reasignar todos los productos que pertenecen a esta subcategoría.',
                [{ text: 'Entendido' }]
              );
            } else {
              Alert.alert('Error', errorMessage);
            }
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

  const handleOpenSubDialog = (categoriaId: number) => {
    setEditingSubId(null);
    setSelectedCategoriaId(categoriaId);
    setNombre('');
    setDescripcion('');
    setActivo(true);
    setSubDialogVisible(true);
  };

  const handleDesactivarCategoria = async () => {
    if (!editingId) return;

    // Primero mostrar confirmación
    const confirmar = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirmar',
        '¿Desea eliminar esta categoría? Si tiene productos o subcategorías asociadas, solo se desactivará.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ]
      );
    });

    // Si el usuario canceló, restaurar el switch a activo
    if (!confirmar) {
      setActivo(true);
      return;
    }

    try {
      // Intentar hacer DELETE (el backend maneja soft/hard delete automáticamente)
      const response = await productosAPI.deleteCategoria(editingId);
      
      // Si tiene productos o subcategorías, el backend hace soft delete (retorna 200 con mensaje)
      // Si no tiene referencias, el backend hace hard delete (retorna 204 sin body)
      const message = response && response.message 
        ? response.message 
        : 'Categoría eliminada correctamente';
      
      // Esperar a que el usuario presione OK antes de cerrar y refrescar
      await new Promise<void>((resolve) => {
        Alert.alert('Éxito', message, [
          {
            text: 'OK',
            onPress: () => {
              resolve();
            },
          },
        ]);
      });
      
      setDialogVisible(false);
      refetch();
    } catch (err: any) {
      // Si hay error, solo desactivar (fallback)
      try {
        await productosAPI.updateCategoria(editingId, { activo: false });
        setActivo(false);
        
        // Esperar a que el usuario presione OK antes de refrescar
        await new Promise<void>((resolve) => {
          Alert.alert('Categoría desactivada', 'La categoría fue desactivada.', [
            {
              text: 'OK',
              onPress: () => {
                resolve();
              },
            },
          ]);
        });
        
        refetch();
      } catch (updateErr: any) {
        const errorMsg = updateErr.response?.data?.error || updateErr.response?.data?.detail || 'No se pudo procesar';
        Alert.alert('Error', errorMsg);
        // Restaurar el switch si hay error
        setActivo(true);
      }
    }
  };

  const handleDesactivarSubcategoria = async () => {
    if (!editingSubId) return;

    // Primero mostrar confirmación
    const confirmar = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirmar',
        '¿Desea eliminar esta subcategoría? Si tiene productos asociados, solo se desactivará.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ]
      );
    });

    // Si el usuario canceló, restaurar el switch a activo
    if (!confirmar) {
      setActivo(true);
      return;
    }

    try {
      // Intentar hacer DELETE (el backend maneja soft/hard delete automáticamente)
      const response = await productosAPI.deleteSubcategoria(editingSubId);
      
      // Si tiene productos, el backend hace soft delete (retorna 200 con mensaje)
      // Si no tiene productos, el backend hace hard delete (retorna 204 sin body)
      const message = response && response.message 
        ? response.message 
        : 'Subcategoría eliminada correctamente';
      
      // Esperar a que el usuario presione OK antes de cerrar y refrescar
      await new Promise<void>((resolve) => {
        Alert.alert('Éxito', message, [
          {
            text: 'OK',
            onPress: () => {
              resolve();
            },
          },
        ]);
      });
      
      setSubDialogVisible(false);
      refetchSubcategorias();
    } catch (err: any) {
      // Si hay error, solo desactivar (fallback)
      try {
        await productosAPI.updateSubcategoria(editingSubId, { activo: false });
        setActivo(false);
        
        // Esperar a que el usuario presione OK antes de refrescar
        await new Promise<void>((resolve) => {
          Alert.alert('Subcategoría desactivada', 'La subcategoría fue desactivada.', [
            {
              text: 'OK',
              onPress: () => {
                resolve();
              },
            },
          ]);
        });
        
        refetchSubcategorias();
      } catch (updateErr: any) {
        const errorMsg = updateErr.response?.data?.error || updateErr.response?.data?.detail || 'No se pudo procesar';
        Alert.alert('Error', errorMsg);
        // Restaurar el switch si hay error
        setActivo(true);
      }
    }
  };

  const getSubcategoriasByCategoria = (categoriaId: number) => {
    return subcategorias.filter((sub: Subcategoria) => sub.categoria === categoriaId);
  };

  return (
    <View style={styles.container}>
      {loading && <LoadingOverlay visible message="Cargando categorías..." />}
      
      {/* Filtros por Estado */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={[
            { value: 'TODOS' as EstadoFilter, label: 'Todos', icon: 'view-list' },
            { value: 'ACTIVO' as EstadoFilter, label: 'Activas', icon: 'check-circle' },
            { value: 'INACTIVO' as EstadoFilter, label: 'Inactivas', icon: 'close-circle' },
          ]}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <Chip
              icon={item.icon}
              selected={estadoFilter === item.value}
              onPress={() => setEstadoFilter(item.value)}
              style={styles.filterChip}
            >
              {item.label}
            </Chip>
          )}
        />
      </View>
      
      <FlatList
        data={categorias}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const subs = getSubcategoriasByCategoria(item.id);
          const isExpanded = expandedCategoria === item.id;
          
          return (
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
                    {subs.length > 0 && (
                      <IconButton 
                        {...props} 
                        icon={isExpanded ? "chevron-up" : "chevron-down"} 
                        onPress={() => setExpandedCategoria(isExpanded ? null : item.id)} 
                      />
                    )}
                  </View>
                )}
              />
              <Card.Content>
                <View style={styles.categoryInfo}>
                  <Chip icon={item.activo ? 'check' : 'close'} compact>
                    {item.activo ? 'Activa' : 'Inactiva'}
                  </Chip>
                  <Chip icon="folder-outline" compact style={{ marginLeft: spacing.sm }}>
                    {subs.length} subcategorías
                  </Chip>
                </View>
                
                <Button 
                  mode="outlined" 
                  icon="plus" 
                  onPress={() => handleOpenSubDialog(item.id)}
                  style={{ marginTop: spacing.md }}
                  compact
                >
                  Agregar Subcategoría
                </Button>

                {isExpanded && subs.length > 0 && (
                  <View style={styles.subcategoriesContainer}>
                    {subs.map((sub: Subcategoria) => (
                      <Card key={sub.id} style={styles.subCard}>
                        <Card.Title
                          title={sub.nombre}
                          subtitle={sub.descripcion || 'Sin descripción'}
                          left={(props) => <Avatar.Icon {...props} icon="label" size={32} />}
                          right={(props) => (
                            <View style={styles.actions}>
                              <IconButton {...props} icon="pencil" size={20} onPress={() => handleEditSubcategoria(sub)} />
                              <IconButton {...props} icon="delete" size={20} onPress={() => handleDeleteSubcategoria(sub.id)} />
                            </View>
                          )}
                        />
                        <Card.Content>
                          <Chip icon={sub.activo ? 'check' : 'close'} compact>
                            {sub.activo ? 'Activa' : 'Inactiva'}
                          </Chip>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          );
        }}
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
            <View style={styles.switchRow}>
              <Text variant="bodyLarge">Activa</Text>
              <Switch
                value={activo}
                onValueChange={async (newValue) => {
                  if (!newValue) {
                    // Al desactivar, intentar hacer soft delete primero
                    await handleDesactivarCategoria();
                  } else {
                    // Al activar, solo actualizar el estado
                    setActivo(newValue);
                  }
                }}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSave} loading={saving} disabled={saving}>
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={subDialogVisible} onDismiss={() => setSubDialogVisible(false)}>
          <Dialog.Title>{editingSubId ? 'Editar' : 'Nueva'} Subcategoría</Dialog.Title>
          <Dialog.Content>
            <InputField label="Nombre" value={nombre} onChangeText={setNombre} />
            <InputField 
              label="Descripción" 
              value={descripcion} 
              onChangeText={setDescripcion} 
              multiline 
              numberOfLines={2}
            />
            <View style={styles.switchRow}>
              <Text variant="bodyLarge">Activa</Text>
              <Switch
                value={activo}
                onValueChange={async (newValue) => {
                  if (!newValue) {
                    // Al desactivar, intentar hacer soft delete primero
                    await handleDesactivarSubcategoria();
                  } else {
                    // Al activar, solo actualizar el estado
                    setActivo(newValue);
                  }
                }}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSubDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSaveSubcategoria} loading={saving} disabled={saving}>
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
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
    paddingVertical: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: { marginRight: spacing.xs },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.md },
  actions: { flexDirection: 'row' },
  categoryInfo: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: spacing.sm 
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  subcategoriesContainer: { 
    marginTop: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.outline,
  },
  subCard: { 
    marginBottom: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
  },
  empty: { alignItems: 'center', padding: spacing.xxl },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default CategoriasListScreen;

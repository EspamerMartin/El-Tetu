import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, IconButton, FAB, Dialog, Portal, Chip, Avatar, Searchbar, Switch } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import { Marca } from '@/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type EstadoFilter = 'TODOS' | 'ACTIVO' | 'INACTIVO';

/**
 * MarcasListScreen
 * 
 * Pantalla para administrar marcas:
 * - Listar todas las marcas
 * - Crear nueva marca
 * - Editar marca existente
 * - Eliminar marca
 * - Filtrar por estado (activo/inactivo)
 */
const MarcasListScreen = () => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: marcasData, loading, refetch, error } = useFetch(
    () => productosAPI.getMarcas(estadoFilter === 'TODOS' ? {} : { activo: estadoFilter === 'ACTIVO' ? 'true' : 'false' })
  );

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  // Refetch cuando cambie el filtro de estado
  useEffect(() => {
    refetch();
  }, [estadoFilter, refetch]);

  const marcas = marcasData?.results || [];
  const marcasFiltradas = searchQuery
    ? marcas.filter((m: Marca) =>
        m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.descripcion && m.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : marcas;

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const data: Partial<Marca> = { 
        nombre: nombre.trim(), 
        descripcion: descripcion.trim() || undefined, 
        activo 
      };
      
      if (editingId) {
        await productosAPI.updateMarca(editingId, data);
      } else {
        await productosAPI.createMarca(data);
      }

      Alert.alert('Éxito', `Marca ${editingId ? 'actualizada' : 'creada'} correctamente`);
      setDialogVisible(false);
      setNombre('');
      setDescripcion('');
      setActivo(true);
      setEditingId(null);
      refetch();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.nombre?.[0] || 'No se pudo guardar';
      Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (marca: Marca) => {
    setEditingId(marca.id);
    setNombre(marca.nombre);
    setDescripcion(marca.descripcion || '');
    setActivo(marca.activo);
    setDialogVisible(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta marca?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await productosAPI.deleteMarca(id);
            Alert.alert('Éxito', 'Marca eliminada correctamente');
            refetch();
          } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'No se pudo eliminar';
            
            // Detectar error de productos asociados
            if (errorMessage.includes('productos') || errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
              Alert.alert(
                'No se puede eliminar', 
                'Esta marca tiene productos asociados. Primero debes eliminar o reasignar todos los productos que pertenecen a esta marca.',
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

  const handleDesactivarMarca = async () => {
    if (!editingId) return;

    // Primero mostrar confirmación
    const confirmar = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirmar',
        '¿Desea eliminar esta marca? Si tiene productos asociados, solo se desactivará.',
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
      const response = await productosAPI.deleteMarca(editingId);
      
      // Si tiene productos, el backend hace soft delete (retorna 200 con mensaje)
      // Si no tiene productos, el backend hace hard delete (retorna 204 sin body)
      const message = response && response.message 
        ? response.message 
        : 'Marca eliminada correctamente';
      
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
        await productosAPI.updateMarca(editingId, { activo: false });
        setActivo(false);
        
        // Esperar a que el usuario presione OK antes de refrescar
        await new Promise<void>((resolve) => {
          Alert.alert('Marca desactivada', 'La marca fue desactivada.', [
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

  return (
    <View style={styles.container}>
      {loading && <LoadingOverlay visible message="Cargando marcas..." />}
      
      <Searchbar
        placeholder="Buscar marcas..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {/* Filtros por Estado */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={[
            { value: 'TODOS' as EstadoFilter, label: 'Todas', icon: 'view-list' },
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
        data={marcasFiltradas}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title
              title={item.nombre}
              subtitle={item.descripcion || 'Sin descripción'}
              left={(props) => (
                <Avatar.Icon {...props} icon="tag-heart" size={40} />
              )}
              right={(props) => (
                <View style={styles.actions}>
                  <IconButton {...props} icon="pencil" onPress={() => handleEdit(item)} />
                  <IconButton {...props} icon="delete" onPress={() => handleDelete(item.id)} />
                </View>
              )}
            />
            <Card.Content>
              <View style={styles.marcaInfo}>
                <Chip icon={item.activo ? 'check' : 'close'} compact>
                  {item.activo ? 'Activa' : 'Inactiva'}
                </Chip>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Icon name="tag-heart-outline" size={64} color={theme.colors.outline} />
              <Text variant="bodyLarge">No hay marcas</Text>
              {error && <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: spacing.sm }}>{error}</Text>}
            </View>
          ) : null
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={handleOpenDialog} label="Nueva Marca" />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingId ? 'Editar' : 'Nueva'} Marca</Dialog.Title>
          <Dialog.Content>
            <InputField 
              label="Nombre *" 
              value={nombre} 
              onChangeText={setNombre}
              placeholder="Ej: Coca-Cola, Quilmes, Arcor"
            />
            <InputField 
              label="Descripción" 
              value={descripcion} 
              onChangeText={setDescripcion} 
              multiline 
              numberOfLines={3}
              placeholder="Descripción opcional de la marca"
            />
            <View style={styles.switchRow}>
              <Text variant="bodyLarge">Activa</Text>
              <Switch
                value={activo}
                onValueChange={async (newValue) => {
                  if (!newValue) {
                    // Al desactivar, intentar hacer soft delete primero
                    await handleDesactivarMarca();
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
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchbar: { margin: spacing.md },
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
  marcaInfo: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  empty: { alignItems: 'center', padding: spacing.xxl },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
});

export default MarcasListScreen;


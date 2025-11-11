import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Card, IconButton, Chip, Searchbar } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { listasAPI } from '@/services/api';
import { ListaPrecio } from '@/types';
import { LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'ListasPrecios'>;

/**
 * ListasPreciosScreen
 * 
 * Pantalla para administrar listas de precios:
 * - Ver todas las listas
 * - Crear nueva lista
 * - Editar lista existente
 * - Eliminar lista (excepto Lista Base)
 */
const ListasPreciosScreen = ({ navigation }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState(false);

  const { data, loading, refetch } = useFetch(() => listasAPI.getAll());
  const listas: ListaPrecio[] = data?.results || [];

  // Recargar cuando la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const listasFiltradas = searchQuery
    ? listas.filter(lista => 
        lista.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lista.codigo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listas;

  const handleCreate = () => {
    navigation.navigate('ListaPrecioForm', {});
  };

  const handleEdit = (lista: ListaPrecio) => {
    navigation.navigate('ListaPrecioForm', { listaId: lista.id });
  };

  const handleDelete = async (lista: ListaPrecio) => {
    // Proteger Lista Base
    if (lista.codigo === 'base') {
      Alert.alert('No permitido', 'No se puede eliminar la Lista Base');
      return;
    }

    Alert.alert(
      'Eliminar lista',
      `¿Estás seguro de eliminar "${lista.nombre}"? Los clientes asignados a esta lista pasarán a usar Lista Base.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await listasAPI.delete(lista.id);
              Alert.alert('Éxito', 'Lista eliminada correctamente');
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'No se pudo eliminar la lista');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAsignarClientes = () => {
    navigation.navigate('AsignarListasClientes');
  };

  const renderItem = ({ item }: { item: ListaPrecio }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text variant="titleMedium" style={styles.nombre}>
              {item.nombre}
            </Text>
            <Text variant="bodySmall" style={styles.codigo}>
              Código: {item.codigo}
            </Text>
          </View>
          
          <Chip
            icon="percent"
            style={[
              styles.chip,
              parseFloat(item.descuento_porcentaje) > 0 ? styles.chipDescuento : styles.chipBase
            ]}
            textStyle={styles.chipText}
          >
            {item.descuento_porcentaje}% desc.
          </Chip>
        </View>

        <View style={styles.statusRow}>
          <Chip
            icon={item.activo ? 'check-circle' : 'close-circle'}
            style={item.activo ? styles.chipActivo : styles.chipInactivo}
            textStyle={styles.chipText}
            compact
          >
            {item.activo ? 'Activa' : 'Inactiva'}
          </Chip>
          
          {item.codigo === 'base' && (
            <Chip
              icon="star"
              style={styles.chipBase}
              textStyle={styles.chipText}
              compact
            >
              Por defecto
            </Chip>
          )}
        </View>
      </Card.Content>

      <Card.Actions>
        <IconButton
          icon="pencil"
          onPress={() => handleEdit(item)}
        />
        <IconButton
          icon="delete"
          iconColor={item.codigo === 'base' ? theme.colors.surfaceDisabled : theme.colors.error}
          disabled={item.codigo === 'base'}
          onPress={() => handleDelete(item)}
        />
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {(loading || deleting) && <LoadingOverlay visible message={deleting ? 'Eliminando...' : 'Cargando...'} />}

      <View style={styles.header}>
        <Searchbar
          placeholder="Buscar por nombre o código..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={listasFiltradas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No hay listas de precios</Text>
          </View>
        }
      />

      {/* Botón flotante para crear nueva lista */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreate}
        label="Nueva Lista"
      />

      {/* Botón flotante para asignar listas a clientes */}
      <FAB
        icon="account-group"
        style={styles.fabSecondary}
        onPress={handleAsignarClientes}
        label="Asignar Clientes"
        variant="secondary"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  searchbar: {
    elevation: 0,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 6, // Espacio para FABs
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardInfo: {
    flex: 1,
  },
  nombre: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  codigo: {
    color: theme.colors.onSurfaceVariant,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  chipDescuento: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  chipBase: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  chipActivo: {
    backgroundColor: theme.colors.primaryContainer,
  },
  chipInactivo: {
    backgroundColor: theme.colors.errorContainer,
  },
  chipText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
  },
  fabSecondary: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl * 4,
  },
});

export default ListasPreciosScreen;

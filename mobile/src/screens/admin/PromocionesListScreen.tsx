import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Chip, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { AdminDrawerParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { promocionesAPI } from '@/services/api';
import { PromocionCard, LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { colors, spacing } from '@/theme';
import { Promocion } from '@/types';

type EstadoFilter = 'TODOS' | 'ACTIVO' | 'INACTIVO';

type NavigationProp = DrawerNavigationProp<AdminDrawerParamList, 'Promociones'>;

/**
 * PromocionesListScreen - Pantalla para gestionar promociones
 * Accesible para admin y vendedor
 */
const PromocionesListScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS');
  
  const { data: promocionesData, loading, refetch } = useFetch(
    () => promocionesAPI.getAll(
      estadoFilter === 'TODOS' ? {} : { activo: estadoFilter === 'ACTIVO' }
    )
  );

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  useEffect(() => {
    refetch();
  }, [estadoFilter]);

  const promociones = Array.isArray(promocionesData) 
    ? promocionesData 
    : (promocionesData || []);

  const promocionesFiltradas = searchQuery
    ? promociones.filter((p: Promocion) => 
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : promociones;

  const handleDelete = async (id: number, nombre: string) => {
    Alert.alert(
      'Eliminar Promoción',
      `¿Desea eliminar la promoción "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await promocionesAPI.delete(id);
              refetch();
              Alert.alert('Éxito', 'Promoción eliminada correctamente');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const estados: { value: EstadoFilter; label: string; icon: string }[] = [
    { value: 'TODOS', label: 'Todas', icon: 'view-list' },
    { value: 'ACTIVO', label: 'Activas', icon: 'check-circle' },
    { value: 'INACTIVO', label: 'Inactivas', icon: 'close-circle' },
  ];

  return (
    <ScreenContainer>

      {/* Filtros por Estado */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={estados}
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

      <Searchbar 
        placeholder="Buscar promociones..." 
        onChangeText={setSearchQuery} 
        value={searchQuery} 
        style={styles.searchbar} 
      />

      {loading ? (
        <LoadingOverlay visible message="Cargando promociones..." />
      ) : (
        <FlatList
          data={promocionesFiltradas}
          keyExtractor={(item: Promocion) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Promocion }) => (
            <PromocionCard
              promocion={item}
              onPress={() => navigation.navigate('PromocionForm', { promocionId: item.id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="tag-off"
              title="No hay promociones"
              message={
                estadoFilter === 'TODOS'
                  ? "Crea tu primera promoción para atraer más clientes"
                  : `No hay promociones ${estadoFilter === 'ACTIVO' ? 'activas' : 'inactivas'}`
              }
            />
          }
        />
      )}

      <FAB 
        icon="plus" 
        style={styles.fab} 
        onPress={() => navigation.navigate('PromocionForm')} 
        label="Nueva"
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    backgroundColor: colors.surface,
    elevation: 2,
    paddingVertical: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: { 
    marginRight: spacing.xs,
  },
  searchbar: { 
    margin: spacing.md,
  },
  list: { 
    paddingBottom: spacing.xxl + spacing.xl,
  },
  fab: { 
    position: 'absolute', 
    bottom: spacing.lg, 
    right: spacing.lg,
    backgroundColor: colors.promo,
  },
});

export default PromocionesListScreen;


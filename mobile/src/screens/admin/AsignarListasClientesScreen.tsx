import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Menu, Button, Searchbar, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { clientesAPI, listasAPI } from '@/services/api';
import { User, ListaPrecio } from '@/types';
import { LoadingOverlay } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AsignarListasClientes'>;

/**
 * AsignarListasClientesScreen
 * 
 * Pantalla para asignar listas de precios a clientes
 */
const AsignarListasClientesScreen = ({ navigation }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: clientesData, loading: loadingClientes, refetch: refetchClientes } = useFetch(() => 
    clientesAPI.getAll({ rol: 'cliente' })
  );
  const { data: listasData, loading: loadingListas } = useFetch(() => listasAPI.getAll());

  const clientes: User[] = clientesData?.results || [];
  const listas: ListaPrecio[] = listasData?.results || [];

  // Recargar cuando la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      refetchClientes();
    }, [refetchClientes])
  );

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenMenu = useCallback((itemId: number) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    menuTimeoutRef.current = setTimeout(() => {
      setMenuVisible(itemId);
      menuTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleCloseMenu = useCallback(() => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setMenuVisible(null);
  }, []);

  const clientesFiltrados = searchQuery
    ? clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clientes;

  const handleAsignarLista = async (cliente: User, listaId: number | null) => {
    try {
      setUpdating(true);
      handleCloseMenu();

      // Enviar explícitamente null si no hay lista
      const updateData: Partial<User> = {
        lista_precio: listaId === null ? undefined : listaId,
      };

      await clientesAPI.update(cliente.id, updateData);

      const listaNombre = listaId 
        ? listas.find(l => l.id === listaId)?.nombre 
        : 'Lista Base';

      Alert.alert('Éxito', `${cliente.nombre} ahora usa ${listaNombre}`);
      refetchClientes();
    } catch (err: any) {
      console.error('Error asignando lista:', err);
      console.error('Response:', err.response?.data);
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.lista_precio?.[0]
        || 'No se pudo asignar la lista';
      Alert.alert('Error', errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const getListaNombre = (listaId?: number) => {
    if (!listaId) return 'Lista Base (0% desc.)';
    const lista = listas.find(l => l.id === listaId);
    return lista ? `${lista.nombre} (${lista.descuento_porcentaje}% desc.)` : 'Lista Base';
  };

  const renderItem = ({ item }: { item: User }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.clienteInfo}>
            <Text variant="titleMedium" style={styles.nombre}>
              {item.nombre} {item.apellido}
            </Text>
            <Text variant="bodySmall" style={styles.email}>
              {item.email}
            </Text>
          </View>
        </View>

        <View style={styles.listaRow}>
          <Text variant="bodyMedium" style={styles.listaLabel}>
            Lista asignada:
          </Text>
          <Chip
            icon="tag"
            style={styles.chip}
            textStyle={styles.chipText}
          >
            {getListaNombre(item.lista_precio)}
          </Chip>
        </View>
      </Card.Content>

      <Card.Actions>
        <Menu
          visible={menuVisible === item.id}
          onDismiss={handleCloseMenu}
          anchor={
            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => handleOpenMenu(item.id)}
            >
              Cambiar Lista
            </Button>
          }
        >
          {/* Opción: Sin lista (usa Lista Base) */}
          <Menu.Item
            onPress={() => handleAsignarLista(item, null)}
            title="Lista Base (0% desc.)"
            leadingIcon={!item.lista_precio ? 'check' : undefined}
          />
          
          {/* Opciones: Listas disponibles */}
          {listas
            .filter(lista => lista.activo && lista.codigo !== 'base')
            .map((lista) => (
              <Menu.Item
                key={lista.id}
                onPress={() => handleAsignarLista(item, lista.id)}
                title={`${lista.nombre} (${lista.descuento_porcentaje}% desc.)`}
                leadingIcon={item.lista_precio === lista.id ? 'check' : undefined}
              />
            ))}
        </Menu>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {(loadingClientes || loadingListas || updating) && (
        <LoadingOverlay visible message={updating ? 'Actualizando...' : 'Cargando...'} />
      )}

      <View style={styles.header}>
        <Searchbar
          placeholder="Buscar cliente..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.statsRow}>
          <Text variant="bodyMedium">
            {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={clientesFiltrados}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No hay clientes</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  searchbar: {
    elevation: 0,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
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
  clienteInfo: {
    flex: 1,
  },
  nombre: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  email: {
    color: colors.onSurfaceVariant,
  },
  listaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  listaLabel: {
    color: colors.onSurfaceVariant,
  },
  chip: {
    backgroundColor: colors.secondaryContainer,
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
});

export default AsignarListasClientesScreen;

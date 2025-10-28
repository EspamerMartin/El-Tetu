import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Card, Avatar, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { clientesAPI } from '@/services/api';
import { Cliente } from '@/types';
import { LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList, 'ClientesList'>;

/**
 * ClientesListScreen
 * 
 * Lista de todos los clientes con búsqueda.
 * Permite navegar al detalle de cada cliente.
 */
const ClientesListScreen = ({ navigation }: Props) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClientes(clientes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clientes.filter(
        (c) =>
          c.usuario.nombre.toLowerCase().includes(query) ||
          c.usuario.apellido.toLowerCase().includes(query) ||
          c.usuario.email.toLowerCase().includes(query) ||
          c.telefono?.toLowerCase().includes(query)
      );
      setFilteredClientes(filtered);
    }
  }, [searchQuery, clientes]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await clientesAPI.getAll();
      setClientes(data.results);
      setFilteredClientes(data.results);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClientePress = (cliente: Cliente) => {
    navigation.navigate('ClienteDetalle', { clienteId: cliente.id });
  };

  const renderCliente = ({ item }: { item: Cliente }) => {
    const nombreCompleto = `${item.usuario.nombre} ${item.usuario.apellido}`;
    const iniciales = `${item.usuario.nombre.charAt(0)}${item.usuario.apellido.charAt(0)}`;

    return (
      <Card style={styles.card} onPress={() => handleClientePress(item)}>
        <Card.Title
          title={nombreCompleto}
          subtitle={item.usuario.email}
          left={(props) => (
            <Avatar.Text {...props} label={iniciales} size={48} />
          )}
          right={(props) => (
            <Icon {...props} name="chevron-right" size={24} color={theme.colors.onSurface} />
          )}
        />
        <Card.Content>
          <View style={styles.infoRow}>
            {item.telefono && (
              <Chip icon="phone" compact style={styles.infoChip}>
                {item.telefono}
              </Chip>
            )}
            {item.direccion && (
              <Chip icon="map-marker" compact style={styles.infoChip}>
                {item.direccion.length > 30 ? `${item.direccion.substring(0, 30)}...` : item.direccion}
              </Chip>
            )}
          </View>
          <View style={styles.statusRow}>
            <Chip
              icon={item.usuario.is_active ? 'check-circle' : 'close-circle'}
              compact
              style={[
                styles.statusChip,
                { backgroundColor: item.usuario.is_active ? theme.colors.tertiaryContainer : theme.colors.errorContainer },
              ]}
            >
              {item.usuario.is_active ? 'Activo' : 'Inactivo'}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por nombre, email o teléfono..."
          onChangeText={setSearchQuery}
          value={searchQuery}
        />
      </View>

      {loading ? (
        <LoadingOverlay visible message="Cargando clientes..." />
      ) : (
        <FlatList
          data={filteredClientes}
          renderItem={renderCliente}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="account-off" size={64} color={theme.colors.outline} />
              <Text variant="titleMedium" style={styles.emptyText}>
                No se encontraron clientes
              </Text>
              {searchQuery && (
                <Text variant="bodySmall" style={styles.emptySubtext}>
                  Intenta con otros términos de búsqueda
                </Text>
              )}
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoChip: {
    marginRight: spacing.xs,
  },
  statusRow: {
    marginTop: spacing.sm,
  },
  statusChip: {},
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    color: theme.colors.outline,
  },
});

export default ClientesListScreen;

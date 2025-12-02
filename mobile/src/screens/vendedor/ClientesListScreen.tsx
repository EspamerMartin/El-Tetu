import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Card, Avatar, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { clientesAPI } from '@/services/api';
import { Cliente } from '@/types';
import { LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList, 'ClientesList'>;

/**
 * ClientesListScreen
 * 
 * Lista de todos los clientes con búsqueda
 */
const ClientesListScreen = ({ navigation }: Props) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchClientes();
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClientes(clientes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(query) ||
          c.apellido.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.telefono?.toLowerCase().includes(query)
      );
      setFilteredClientes(filtered);
    }
  }, [searchQuery, clientes]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await clientesAPI.getAll({ rol: 'cliente' });
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
    const nombreCompleto = `${item.nombre} ${item.apellido}`;
    const iniciales = `${item.nombre.charAt(0)}${item.apellido.charAt(0)}`;

    return (
      <Card style={styles.card} onPress={() => handleClientePress(item)} mode="elevated">
        <Card.Title
          title={nombreCompleto}
          titleStyle={styles.cardTitle}
          subtitle={item.email}
          subtitleStyle={styles.cardSubtitle}
          left={(props) => (
            <Avatar.Text {...props} label={iniciales} size={48} style={styles.avatar} />
          )}
          right={(props) => (
            <Icon {...props} name="chevron-right" size={24} color={colors.textTertiary} />
          )}
        />
        <Card.Content>
          <View style={styles.infoRow}>
            {item.telefono && (
              <Chip icon="phone" compact style={styles.infoChip} textStyle={styles.chipText}>
                {item.telefono}
              </Chip>
            )}
            {item.direccion && (
              <Chip icon="map-marker" compact style={styles.infoChip} textStyle={styles.chipText}>
                {item.direccion.length > 30 ? `${item.direccion.substring(0, 30)}...` : item.direccion}
              </Chip>
            )}
          </View>
          <View style={styles.statusRow}>
            <Chip
              icon={item.is_active ? 'check-circle' : 'close-circle'}
              compact
              style={[
                styles.statusChip,
                { backgroundColor: item.is_active ? colors.successLight : colors.errorLight },
              ]}
              textStyle={{ color: item.is_active ? colors.success : colors.error }}
            >
              {item.is_active ? 'Activo' : 'Inactivo'}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por nombre, email o teléfono..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
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
            <EmptyState
              icon="account-off"
              title="No se encontraron clientes"
              message={searchQuery ? 'Intenta con otros términos de búsqueda' : undefined}
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  searchbar: {
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.md,
    elevation: 0,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  cardTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtitle: {
    color: colors.textSecondary,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoChip: {
    backgroundColor: colors.primarySurface,
  },
  chipText: {
    fontSize: 11,
  },
  statusRow: {
    marginTop: spacing.sm,
  },
  statusChip: {},
});

export default ClientesListScreen;

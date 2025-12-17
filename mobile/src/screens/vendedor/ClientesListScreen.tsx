import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Card, Avatar, Chip, FAB } from 'react-native-paper';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendedorDrawerParamList, VendedorStackParamList } from '@/navigation/VendedorStack';
import { clientesAPI } from '@/services/api';
import { Cliente } from '@/types';
import { LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = CompositeScreenProps<
  DrawerScreenProps<VendedorDrawerParamList, 'Clientes'>,
  NativeStackScreenProps<VendedorStackParamList>
>;

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
    navigation.getParent()?.navigate('ClienteDetalle', { clienteId: cliente.id });
  };

  const handleNuevoCliente = () => {
    navigation.getParent()?.navigate('ClienteForm');
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
            {item.zona_nombre && (
              <Chip icon="map-marker-radius" compact style={styles.zonaChip} textStyle={styles.zonaChipText}>
                {item.zona_nombre}
              </Chip>
            )}
            {item.telefono && (
              <Chip icon="phone" compact style={styles.infoChip} textStyle={styles.chipText}>
                {item.telefono}
              </Chip>
            )}
          </View>
          {item.calle && (
            <View style={styles.direccionRow}>
              <Icon name="map-marker" size={14} color={colors.textSecondary} />
              <Text style={styles.direccionText} numberOfLines={1}>
                {item.calle} {item.numero}{item.entre_calles ? ` (${item.entre_calles})` : ''}
              </Text>
            </View>
          )}
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

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleNuevoCliente}
      />
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
  zonaChip: {
    backgroundColor: colors.tertiary,
  },
  zonaChipText: {
    fontSize: 11,
    color: colors.white,
  },
  chipText: {
    fontSize: 11,
  },
  direccionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  direccionText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  statusRow: {
    marginTop: spacing.sm,
  },
  statusChip: {},
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
});

export default ClientesListScreen;

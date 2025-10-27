import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { pedidosAPI } from '@/services/api';
import { Pedido } from '@/types';
import { PedidoCard, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';

type Props = NativeStackScreenProps<ClienteTabParamList, 'MisPedidos'>;

/**
 * MisPedidosScreen
 * 
 * Pantalla con el historial de pedidos del cliente
 */
const MisPedidosScreen = ({ navigation }: Props) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      setError(null);
      const data = await pedidosAPI.getAll({ mine: true });
      setPedidos(data.results);
    } catch (err: any) {
      setError('Error al cargar pedidos');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPedidos();
  };

  const handlePedidoPress = (pedido: Pedido) => {
    navigation.navigate('PedidoDetalle', { pedidoId: pedido.id });
  };

  const renderPedido = ({ item }: { item: Pedido }) => (
    <PedidoCard pedido={item} onPress={() => handlePedidoPress(item)} />
  );

  if (loading && !refreshing) {
    return <LoadingOverlay visible message="Cargando pedidos..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pedidos}
        renderItem={renderPedido}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No tienes pedidos aún</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
});

export default MisPedidosScreen;

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClienteStackParamList } from '@/navigation/ClienteStack';
import { pedidosAPI } from '@/services/api';
import { Pedido } from '@/types';
import { PedidoCard, LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { theme, spacing } from '@/theme';

type NavigationProp = NativeStackNavigationProp<ClienteStackParamList>;

/**
 * MisPedidosScreen
 * 
 * Pantalla con el historial de pedidos del cliente
 */
const MisPedidosScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPedidos();
  }, []);

  // Recargar pedidos cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      fetchPedidos();
    }, [])
  );

  const fetchPedidos = async () => {
    try {
      setError(null);
      const data = await pedidosAPI.getAll({ mine: true });
      // Manejar tanto respuestas paginadas como arrays directos
      const pedidosList = Array.isArray(data) ? data : (data.results || []);
      setPedidos(pedidosList);
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
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={pedidos}
        renderItem={renderPedido}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-off"
            title="No tienes pedidos aún"
            message="Cuando realices un pedido, aparecerá aquí"
          />
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
});

export default MisPedidosScreen;

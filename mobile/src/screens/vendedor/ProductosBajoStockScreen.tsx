import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Card, Chip, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { Producto } from '@/types';
import { LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { theme, spacing } from '@/theme';
import { formatPrice } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<VendedorStackParamList | AdminStackParamList, 'ProductosBajoStock'>;

/**
 * ProductosBajoStockScreen
 * 
 * Lista de productos con stock bajo (< 10 unidades)
 */
const ProductosBajoStockScreen = ({ navigation }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: productosData, loading, refetch } = useFetch(
    () => productosAPI.getAll({ stock__lt: 10, activo: true })
  );

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  const productos = productosData?.results || [];
  
  // Filtrar productos con stock < 10 (doble verificación)
  const productosBajoStock = productos.filter((p: Producto) => p.stock < 10);
  
  const productosFiltrados = searchQuery
    ? productosBajoStock.filter((p: Producto) => 
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : productosBajoStock;

  // Ordenar por stock (menor a mayor)
  const productosOrdenados = [...productosFiltrados].sort((a, b) => a.stock - b.stock);

  const getStockColor = (stock: number) => {
    if (stock === 0) return theme.colors.error;
    if (stock < 5) return theme.colors.error;
    return theme.colors.secondary;
  };

  const getStockLabel = (stock: number) => {
    if (stock === 0) return 'Sin stock';
    if (stock < 5) return 'Crítico';
    return 'Bajo';
  };

  const renderProducto = ({ item }: { item: Producto }) => (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.productoHeader}>
          <View style={styles.productoInfo}>
            <Text variant="titleMedium" style={styles.productoNombre}>
              {item.nombre}
            </Text>
            <Text variant="bodySmall" style={styles.productoCodigo}>
              Código: {item.codigo}
            </Text>
            {item.categoria_nombre && (
              <Chip 
                icon="tag" 
                compact 
                style={styles.categoriaChip}
                textStyle={styles.categoriaChipText}
              >
                {item.categoria_nombre}
              </Chip>
            )}
          </View>
          <View style={styles.stockInfo}>
            <Chip
              icon={item.stock === 0 ? 'alert-circle' : 'alert'}
              style={[
                styles.stockChip,
                { backgroundColor: getStockColor(item.stock) + '20' }
              ]}
              textStyle={[
                styles.stockChipText,
                { color: getStockColor(item.stock) }
              ]}
            >
              {getStockLabel(item.stock)}
            </Chip>
            <Text variant="headlineSmall" style={[styles.stockNumber, { color: getStockColor(item.stock) }]}>
              {item.stock}
            </Text>
            <Text variant="bodySmall" style={styles.stockLabel}>
              unidades
            </Text>
          </View>
        </View>
        <View style={styles.precioContainer}>
          <Text variant="bodyMedium" style={styles.precioLabel}>
            Precio base:
          </Text>
          <Text variant="titleMedium" style={styles.precio}>
            {formatPrice(item.precio_base)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScreenContainer>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por nombre o código..."
          onChangeText={setSearchQuery}
          value={searchQuery}
        />
      </View>

      {loading ? (
        <LoadingOverlay visible message="Cargando productos..." />
      ) : (
        <FlatList
          data={productosOrdenados}
          renderItem={renderProducto}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="package-variant"
              title="No hay productos con stock bajo"
              message="Todos los productos tienen stock suficiente"
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
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  productoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  productoInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  productoNombre: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  productoCodigo: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  categoriaChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  categoriaChipText: {
    fontSize: 11,
  },
  stockInfo: {
    alignItems: 'center',
    minWidth: 100,
  },
  stockChip: {
    marginBottom: spacing.xs,
  },
  stockChipText: {
    fontWeight: '600',
    fontSize: 11,
  },
  stockNumber: {
    fontWeight: 'bold',
    marginVertical: spacing.xs,
  },
  stockLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  precioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline + '20',
  },
  precioLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  precio: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});

export default ProductosBajoStockScreen;


import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Card, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { VendedorStackParamList } from '@/navigation/VendedorStack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { Producto } from '@/types';
import { LoadingOverlay, ScreenContainer, EmptyState } from '@/components';
import { colors, spacing } from '@/theme';
import { formatPrice } from '@/utils';

type Props = NativeStackScreenProps<VendedorStackParamList | AdminStackParamList, 'ProductosSinStock'>;

/**
 * ProductosSinStockScreen
 * 
 * Lista de productos sin stock disponible (tiene_stock = false)
 */
const ProductosSinStockScreen = ({ navigation }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: productosData, loading, refetch } = useFetch(
    () => productosAPI.getAll({ tiene_stock: false, activo: true })
  );

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  // Asegurar que siempre tengamos un array, incluso si la respuesta es directa
  const productos = Array.isArray(productosData) ? productosData : (productosData?.results || []);
  
  const productosFiltrados = searchQuery
    ? productos.filter((p: Producto) => 
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.codigo_barra.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : productos;

  const renderProducto = ({ item }: { item: Producto }) => (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.productoHeader}>
          <View style={styles.productoInfo}>
            <Text variant="titleMedium" style={styles.productoNombre}>
              {item.nombre}
            </Text>
            <Text variant="bodySmall" style={styles.productoCodigo}>
              Código: {item.codigo_barra}
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
              icon="alert-circle"
              style={styles.stockChip}
              textStyle={styles.stockChipText}
            >
              Sin stock
            </Chip>
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
          data={productosFiltrados}
          renderItem={renderProducto}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="package-variant"
              title="No hay productos sin stock"
              message="Todos los productos tienen stock disponible"
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
    backgroundColor: colors.surface,
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
    color: colors.onSurfaceVariant,
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
    backgroundColor: colors.error + '20',
  },
  stockChipText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 11,
  },
  precioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outline + '20',
  },
  precioLabel: {
    color: colors.onSurfaceVariant,
  },
  precio: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default ProductosSinStockScreen;


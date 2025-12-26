import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, Image } from 'react-native';
import { Text, Button, Switch, Surface, Chip, IconButton, Searchbar, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { promocionesAPI, productosAPI } from '@/services/api';
import { InputField, LoadingOverlay, ScreenContainer } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { Producto, Promocion } from '@/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatPrice } from '@/utils';

type Props = NativeStackScreenProps<AdminStackParamList, 'PromocionForm'>;

interface ItemPromocion {
  producto: Producto;
  cantidad: number;
}

/**
 * PromocionFormScreen
 * Formulario para crear/editar promociones
 */
const PromocionFormScreen = ({ route, navigation }: Props) => {
  const { promocionId } = route.params || {};
  const isEdit = !!promocionId;

  // Datos de la promoción
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [urlImagen, setUrlImagen] = useState('');
  const [activo, setActivo] = useState(true);
  const [items, setItems] = useState<ItemPromocion[]>([]);

  // UI states
  const [saving, setSaving] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch promoción existente
  const { data: promocion, loading } = useFetch(
    isEdit ? () => promocionesAPI.getById(promocionId) : () => Promise.resolve(null)
  );

  // Fetch productos disponibles
  const { data: productosData } = useFetch(() => productosAPI.getAll({ activo: true }));
  const productos: Producto[] = Array.isArray(productosData) ? productosData : (productosData?.results || []);

  // Cargar datos si es edición
  useEffect(() => {
    if (promocion) {
      setNombre(promocion.nombre);
      setDescripcion(promocion.descripcion || '');
      setPrecio(promocion.precio);
      setUrlImagen(promocion.url_imagen || '');
      setActivo(promocion.activo);
      
      // Cargar items con productos completos
      const loadedItems: ItemPromocion[] = [];
      promocion.items?.forEach(item => {
        const producto = productos.find(p => p.id === item.producto);
        if (producto) {
          loadedItems.push({ producto, cantidad: item.cantidad });
        }
      });
      if (loadedItems.length > 0) {
        setItems(loadedItems);
      }
    }
  }, [promocion, productos]);

  // Calcular precio original (suma de productos)
  const precioOriginal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.producto.precio_base) * item.cantidad);
  }, 0);

  const precioNum = parseFloat(precio) || 0;
  const ahorro = precioOriginal - precioNum;
  const porcentajeDescuento = precioOriginal > 0 
    ? ((ahorro / precioOriginal) * 100).toFixed(0) 
    : '0';

  // Filtrar productos para selector
  const productosFiltrados = productos.filter(p => {
    const yaAgregado = items.some(item => item.producto.id === p.id);
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    return !yaAgregado && matchesSearch;
  });

  const handleAddProduct = (producto: Producto) => {
    setItems([...items, { producto, cantidad: 1 }]);
    setShowProductSelector(false);
    setSearchQuery('');
  };

  const handleRemoveProduct = (productoId: number) => {
    setItems(items.filter(item => item.producto.id !== productoId));
  };

  const handleUpdateCantidad = (productoId: number, delta: number) => {
    setItems(items.map(item => {
      if (item.producto.id === productoId) {
        const nuevaCantidad = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: nuevaCantidad };
      }
      return item;
    }));
  };

  const validateForm = (): boolean => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return false;
    }
    if (!precio || parseFloat(precio) <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return false;
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos un producto a la promoción');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const data = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio: parseFloat(precio),
        url_imagen: urlImagen.trim() || undefined,
        activo,
        items: items.map(item => ({
          producto: item.producto.id,
          cantidad: item.cantidad,
        })),
      };

      if (isEdit) {
        await promocionesAPI.update(promocionId, data);
        Alert.alert('Éxito', 'Promoción actualizada correctamente');
      } else {
        await promocionesAPI.create(data);
        Alert.alert('Éxito', 'Promoción creada correctamente');
      }
      navigation.goBack();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        'Error al guardar';
      Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible message="Cargando..." />;
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header con info de ahorro */}
        {items.length > 0 && precioNum > 0 && (
          <Surface style={styles.ahorroCard}>
            <View style={styles.ahorroRow}>
              <View>
                <Text style={styles.ahorroLabel}>Precio productos</Text>
                <Text style={styles.precioOriginal}>{formatPrice(precioOriginal.toString())}</Text>
              </View>
              <Icon name="arrow-right" size={24} color={colors.textSecondary} />
              <View>
                <Text style={styles.ahorroLabel}>Precio promo</Text>
                <Text style={styles.precioPromo}>{formatPrice(precio)}</Text>
              </View>
              <View style={styles.ahorroBadge}>
                <Text style={styles.ahorroText}>-{porcentajeDescuento}%</Text>
              </View>
            </View>
            {ahorro > 0 && (
              <Text style={styles.ahorroTotal}>
                El cliente ahorra {formatPrice(ahorro.toString())}
              </Text>
            )}
          </Surface>
        )}

        {/* Información básica */}
        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          
          <InputField
            label="Nombre de la promoción *"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Combo Familiar"
          />

          <InputField
            label="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción opcional"
            multiline
            numberOfLines={3}
          />

          <InputField
            label="Precio de la promoción *"
            value={precio}
            onChangeText={setPrecio}
            placeholder="0.00"
            keyboardType="decimal-pad"
            leftIcon="currency-usd"
          />

          <InputField
            label="URL de imagen"
            value={urlImagen}
            onChangeText={setUrlImagen}
            placeholder="https://ejemplo.com/imagen.jpg"
            keyboardType="url"
          />

          <View style={styles.switchRow}>
            <Text>Promoción activa</Text>
            <Switch value={activo} onValueChange={setActivo} color={colors.promo} />
          </View>
        </Surface>

        {/* Productos de la promoción */}
        <Surface style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos incluidos</Text>
            <Button 
              mode="contained" 
              onPress={() => setShowProductSelector(true)}
              icon="plus"
              buttonColor={colors.promo}
              compact
            >
              Agregar
            </Button>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Icon name="package-variant" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                No hay productos agregados
              </Text>
              <Text style={styles.emptySubtext}>
                Agrega productos para crear la promoción
              </Text>
            </View>
          ) : (
            <>
              {items.map((item) => (
                <View key={item.producto.id} style={styles.itemRow}>
                  {/* Imagen del producto */}
                  <View style={styles.itemImage}>
                    {item.producto.url_imagen ? (
                      <Image 
                        source={{ uri: item.producto.url_imagen }} 
                        style={styles.itemImageContent}
                      />
                    ) : (
                      <Icon name="package-variant" size={24} color={colors.textTertiary} />
                    )}
                  </View>

                  {/* Info del producto */}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemNombre} numberOfLines={1}>
                      {item.producto.nombre}
                    </Text>
                    <Text style={styles.itemPrecio}>
                      {formatPrice(item.producto.precio_base)} c/u
                    </Text>
                  </View>

                  {/* Controles de cantidad */}
                  <View style={styles.cantidadControls}>
                    <IconButton
                      icon="minus"
                      size={18}
                      onPress={() => handleUpdateCantidad(item.producto.id, -1)}
                      disabled={item.cantidad <= 1}
                      style={styles.cantidadButton}
                    />
                    <Text style={styles.cantidadText}>{item.cantidad}</Text>
                    <IconButton
                      icon="plus"
                      size={18}
                      onPress={() => handleUpdateCantidad(item.producto.id, 1)}
                      style={styles.cantidadButton}
                    />
                  </View>

                  {/* Subtotal y eliminar */}
                  <View style={styles.itemActions}>
                    <Text style={styles.itemSubtotal}>
                      {formatPrice((parseFloat(item.producto.precio_base) * item.cantidad).toString())}
                    </Text>
                    <IconButton
                      icon="close"
                      size={18}
                      onPress={() => handleRemoveProduct(item.producto.id)}
                      iconColor={colors.error}
                    />
                  </View>
                </View>
              ))}

              <Divider style={styles.divider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total productos:</Text>
                <Text style={styles.totalValue}>{formatPrice(precioOriginal.toString())}</Text>
              </View>
            </>
          )}
        </Surface>

        {/* Botón guardar */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          buttonColor={colors.promo}
          icon="content-save"
        >
          {isEdit ? 'Guardar Cambios' : 'Crear Promoción'}
        </Button>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal selector de productos */}
      {showProductSelector && (
        <View style={styles.productSelectorOverlay}>
          <Surface style={styles.productSelector}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>Agregar producto</Text>
              <IconButton
                icon="close"
                onPress={() => {
                  setShowProductSelector(false);
                  setSearchQuery('');
                }}
              />
            </View>

            <Searchbar
              placeholder="Buscar producto..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.selectorSearch}
            />

            <FlatList
              data={productosFiltrados}
              keyExtractor={(item) => item.id.toString()}
              style={styles.selectorList}
              renderItem={({ item }) => (
                <Surface style={styles.selectorItem} onTouchEnd={() => handleAddProduct(item)}>
                  <View style={styles.selectorItemImage}>
                    {item.url_imagen ? (
                      <Image source={{ uri: item.url_imagen }} style={styles.selectorItemImageContent} />
                    ) : (
                      <Icon name="package-variant" size={24} color={colors.textTertiary} />
                    )}
                  </View>
                  <View style={styles.selectorItemInfo}>
                    <Text style={styles.selectorItemNombre} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    <Text style={styles.selectorItemPrecio}>
                      {formatPrice(item.precio_base)}
                    </Text>
                  </View>
                  <Icon name="plus-circle" size={24} color={colors.promo} />
                </Surface>
              )}
              ListEmptyComponent={
                <View style={styles.selectorEmpty}>
                  <Text style={styles.selectorEmptyText}>
                    {searchQuery ? 'No se encontraron productos' : 'Todos los productos ya están agregados'}
                  </Text>
                </View>
              }
            />
          </Surface>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ahorroCard: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.promoLight,
    borderWidth: 1,
    borderColor: colors.promo,
  },
  ahorroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ahorroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  precioOriginal: {
    fontSize: 16,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  precioPromo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.promo,
  },
  ahorroBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  ahorroText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  ahorroTotal: {
    textAlign: 'center',
    marginTop: spacing.sm,
    color: colors.success,
    fontWeight: '600',
  },
  section: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemImageContent: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemNombre: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  itemPrecio: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cantidadControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cantidadButton: {
    margin: 0,
  },
  cantidadText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  divider: {
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  saveButton: {
    margin: spacing.md,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
  // Selector de productos
  productSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  productSelector: {
    height: '70%',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.md,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectorSearch: {
    marginVertical: spacing.sm,
  },
  selectorList: {
    flex: 1,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  selectorItemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectorItemImageContent: {
    width: '100%',
    height: '100%',
  },
  selectorItemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  selectorItemNombre: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectorItemPrecio: {
    fontSize: 13,
    color: colors.promo,
    fontWeight: '600',
  },
  selectorEmpty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  selectorEmptyText: {
    color: colors.textSecondary,
  },
});

export default PromocionFormScreen;


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch, Menu } from 'react-native-paper';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { theme, spacing, colors } from '@/theme';
import { Categoria, Subcategoria } from '@/types';

const ProductoFormScreen = ({ route, navigation }: any) => {
  const { productoId } = route.params || {};
  const isEdit = !!productoId;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [stock, setStock] = useState('0');
  const [precioBase, setPrecioBase] = useState('');
  const [categoria, setCategoria] = useState<number | null>(null);
  const [subcategoria, setSubcategoria] = useState<number | null>(null);
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoriaMenuVisible, setCategoriaMenuVisible] = useState(false);
  const [subcategoriaMenuVisible, setSubcategoriaMenuVisible] = useState(false);
  const categoriaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subcategoriaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: producto, loading } = useFetch(
    isEdit ? () => productosAPI.getById(productoId) : () => Promise.resolve(null)
  );

  const { data: categoriasData, loading: loadingCategorias, refetch: refetchCategorias } = useFetch(() => productosAPI.getCategorias());
  const { data: subcategoriasData, loading: loadingSubcategorias, refetch: refetchSubcategorias } = useFetch(() => 
    productosAPI.getSubcategorias()
  );

  const categorias: Categoria[] = categoriasData?.results || [];
  const todasSubcategorias: Subcategoria[] = subcategoriasData?.results || [];
  
  // Filtrar subcategorías por categoría seleccionada
  const subcategoriasFiltradas = categoria 
    ? todasSubcategorias.filter(sub => sub.categoria === categoria)
    : [];

  // Limpiar subcategoría cuando se cambia de categoría
  useEffect(() => {
    if (categoria && subcategoria) {
      const subcategoriaValida = subcategoriasFiltradas.find(sub => sub.id === subcategoria);
      if (!subcategoriaValida) {
        setSubcategoria(null);
      }
    }
  }, [categoria, subcategoriasFiltradas]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (categoriaMenuTimeoutRef.current) {
        clearTimeout(categoriaMenuTimeoutRef.current);
      }
      if (subcategoriaMenuTimeoutRef.current) {
        clearTimeout(subcategoriaMenuTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenCategoriaMenu = useCallback(() => {
    if (categoriaMenuTimeoutRef.current) {
      clearTimeout(categoriaMenuTimeoutRef.current);
      categoriaMenuTimeoutRef.current = null;
    }
    categoriaMenuTimeoutRef.current = setTimeout(() => {
      setCategoriaMenuVisible(true);
      categoriaMenuTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleCloseCategoriaMenu = useCallback(() => {
    if (categoriaMenuTimeoutRef.current) {
      clearTimeout(categoriaMenuTimeoutRef.current);
      categoriaMenuTimeoutRef.current = null;
    }
    setCategoriaMenuVisible(false);
  }, []);

  const handleSelectCategoria = useCallback((catId: number) => {
    setCategoriaMenuVisible(false);
    setTimeout(() => {
      setCategoria(catId);
    }, 100);
  }, []);

  const handleOpenSubcategoriaMenu = useCallback(() => {
    if (subcategoriaMenuTimeoutRef.current) {
      clearTimeout(subcategoriaMenuTimeoutRef.current);
      subcategoriaMenuTimeoutRef.current = null;
    }
    subcategoriaMenuTimeoutRef.current = setTimeout(() => {
      setSubcategoriaMenuVisible(true);
      subcategoriaMenuTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleCloseSubcategoriaMenu = useCallback(() => {
    if (subcategoriaMenuTimeoutRef.current) {
      clearTimeout(subcategoriaMenuTimeoutRef.current);
      subcategoriaMenuTimeoutRef.current = null;
    }
    setSubcategoriaMenuVisible(false);
  }, []);

  const handleSelectSubcategoria = useCallback((subId: number | null) => {
    setSubcategoriaMenuVisible(false);
    setTimeout(() => {
      setSubcategoria(subId);
    }, 100);
  }, []);

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre);
      setDescripcion(producto.descripcion || '');
      setCodigo(producto.codigo || '');
      setStock(producto.stock.toString());
      setPrecioBase(producto.precio_base || '');
      setCategoria(producto.categoria || null);
      setSubcategoria(producto.subcategoria || null);
      setActivo(producto.activo);
    }
  }, [producto]);

  const handleSave = async () => {
    if (!nombre || !precioBase || !categoria) {
      Alert.alert('Error', 'Nombre, precio base y categoría son obligatorios');
      return;
    }

    if (!codigo || !codigo.trim()) {
      Alert.alert('Error', 'El código es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const data: any = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        codigo: codigo.trim(),
        stock: parseInt(stock) || 0,
        stock_minimo: 0,
        precio_base: parseFloat(precioBase) || 0,
        categoria,
        activo,
      };

      if (subcategoria) {
        data.subcategoria = subcategoria;
      } else {
        data.subcategoria = null;
      }

      if (isEdit) {
        await productosAPI.update(productoId, data);
      } else {
        await productosAPI.create(data);
      }

      Alert.alert('Éxito', `Producto ${isEdit ? 'actualizado' : 'creado'} correctamente`);
      navigation.goBack();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.codigo?.[0] || 
                       err.response?.data?.precio_base?.[0] ||
                       err.response?.data?.categoria?.[0] ||
                       err.response?.data?.subcategoria?.[0] ||
                       err.message || 
                       'No se pudo guardar';
      Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingOverlay visible message="Cargando..." />;

  const hayCategorias = categorias.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {saving && <LoadingOverlay visible message="Guardando..." />}
      {loadingCategorias && <LoadingOverlay visible message="Cargando categorías..." />}

      <Text variant="headlineSmall" style={styles.title}>
        {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
      </Text>

      <InputField label="Nombre" value={nombre} onChangeText={setNombre} />
      <InputField label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline numberOfLines={3} />
      <InputField label="Código" value={codigo} onChangeText={setCodigo} />
      
      <View style={styles.menuContainer}>
        <Text variant="labelLarge" style={styles.label}>Categoría *</Text>
        {!hayCategorias && !loadingCategorias && (
          <Text variant="bodySmall" style={styles.errorText}>
            No hay categorías disponibles. Crea una categoría primero.
          </Text>
        )}
        <Menu
          visible={categoriaMenuVisible}
          onDismiss={handleCloseCategoriaMenu}
          anchor={
            <Button 
              mode="outlined" 
              onPress={handleOpenCategoriaMenu}
              icon="chevron-down"
              contentStyle={styles.menuButton}
              disabled={!hayCategorias}
            >
              {categoria ? categorias.find(c => c.id === categoria)?.nombre || 'Seleccionar categoría' : 'Seleccionar categoría'}
            </Button>
          }
        >
          {categorias.map((cat) => (
            <Menu.Item
              key={cat.id}
              onPress={() => handleSelectCategoria(cat.id)}
              title={cat.nombre}
            />
          ))}
        </Menu>
      </View>

      {categoria && subcategoriasFiltradas && subcategoriasFiltradas.length > 0 && (
        <View style={styles.menuContainer}>
          <Text variant="labelLarge" style={styles.label}>Subcategoría (Opcional)</Text>
          <Menu
            visible={subcategoriaMenuVisible}
            onDismiss={handleCloseSubcategoriaMenu}
            anchor={
              <Button 
                mode="outlined" 
                onPress={handleOpenSubcategoriaMenu}
                icon="chevron-down"
                contentStyle={styles.menuButton}
              >
                {subcategoria ? subcategoriasFiltradas.find((s: Subcategoria) => s.id === subcategoria)?.nombre || 'Seleccionar subcategoría' : 'Seleccionar subcategoría'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleSelectSubcategoria(null)}
              title="Sin subcategoría"
            />
            {subcategoriasFiltradas.map((sub: Subcategoria) => (
              <Menu.Item
                key={sub.id}
                onPress={() => handleSelectSubcategoria(sub.id)}
                title={sub.nombre}
              />
            ))}
          </Menu>
        </View>
      )}

      {categoria && subcategoriasFiltradas.length === 0 && (
        <View style={styles.infoContainer}>
          <Text variant="bodySmall" style={styles.infoText}>
            Esta categoría no tiene subcategorías. Puedes agregar subcategorías desde el panel de Categorías.
          </Text>
        </View>
      )}

      <InputField label="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />
      <InputField label="Precio Base" value={precioBase} onChangeText={setPrecioBase} keyboardType="decimal-pad" />

      <View style={styles.switchRow}>
        <Text variant="bodyLarge">Producto activo</Text>
        <Switch value={activo} onValueChange={setActivo} />
      </View>

      <Button mode="contained" onPress={handleSave} style={styles.button}>
        {isEdit ? 'Actualizar' : 'Crear'} Producto
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.md },
  title: { marginBottom: spacing.lg, fontWeight: 'bold' },
  menuContainer: { marginVertical: spacing.sm },
  label: { marginBottom: spacing.xs },
  menuButton: { justifyContent: 'flex-start' },
  errorText: { color: colors.error, marginBottom: spacing.sm },
  infoContainer: { 
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  infoText: { 
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.md },
  button: { marginTop: spacing.lg },
});

export default ProductoFormScreen;

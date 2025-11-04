import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch, Menu } from 'react-native-paper';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';
import { Categoria, Subcategoria } from '@/types';

const ProductoFormScreen = ({ route, navigation }: any) => {
  const { productoId } = route.params || {};
  const isEdit = !!productoId;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [stock, setStock] = useState('0');
  const [precioLista3, setPrecioLista3] = useState('');
  const [precioLista4, setPrecioLista4] = useState('');
  const [categoria, setCategoria] = useState<number | null>(null);
  const [subcategoria, setSubcategoria] = useState<number | null>(null);
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoriaMenuVisible, setCategoriaMenuVisible] = useState(false);
  const [subcategoriaMenuVisible, setSubcategoriaMenuVisible] = useState(false);

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

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre);
      setDescripcion(producto.descripcion || '');
      setCodigo(producto.codigo || '');
      setStock(producto.stock.toString());
      setPrecioLista3(producto.precio_lista_3 || '');
      setPrecioLista4(producto.precio_lista_4 || '');
      setCategoria(producto.categoria || null);
      setSubcategoria(producto.subcategoria || null);
      setActivo(producto.activo);
    }
  }, [producto]);

  const handleSave = async () => {
    if (!nombre || !precioLista3 || !categoria) {
      Alert.alert('Error', 'Nombre, precio y categoría son obligatorios');
      return;
    }

    try {
      setSaving(true);
      const data: any = {
        nombre,
        descripcion,
        codigo,
        stock: parseInt(stock) || 0,
        precio_lista_3: precioLista3,
        precio_lista_4: precioLista4,
        categoria,
        activo,
      };

      if (subcategoria) {
        data.subcategoria = subcategoria;
      }

      if (isEdit) {
        await productosAPI.update(productoId, data);
      } else {
        await productosAPI.create(data);
      }

      Alert.alert('Éxito', `Producto ${isEdit ? 'actualizado' : 'creado'} correctamente`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'No se pudo guardar');
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
          onDismiss={() => setCategoriaMenuVisible(false)}
          anchor={
            <Button 
              mode="outlined" 
              onPress={() => setCategoriaMenuVisible(true)}
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
              onPress={() => {
                setCategoria(cat.id);
                setCategoriaMenuVisible(false);
              }}
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
            onDismiss={() => setSubcategoriaMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setSubcategoriaMenuVisible(true)}
                icon="chevron-down"
                contentStyle={styles.menuButton}
              >
                {subcategoria ? subcategoriasFiltradas.find((s: Subcategoria) => s.id === subcategoria)?.nombre || 'Seleccionar subcategoría' : 'Seleccionar subcategoría'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setSubcategoria(null);
                setSubcategoriaMenuVisible(false);
              }}
              title="Sin subcategoría"
            />
            {subcategoriasFiltradas.map((sub: Subcategoria) => (
              <Menu.Item
                key={sub.id}
                onPress={() => {
                  setSubcategoria(sub.id);
                  setSubcategoriaMenuVisible(false);
                }}
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
      <InputField label="Precio Lista 3" value={precioLista3} onChangeText={setPrecioLista3} keyboardType="decimal-pad" />
      <InputField label="Precio Lista 4" value={precioLista4} onChangeText={setPrecioLista4} keyboardType="decimal-pad" />

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
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: spacing.md },
  title: { marginBottom: spacing.lg, fontWeight: 'bold' },
  menuContainer: { marginVertical: spacing.sm },
  label: { marginBottom: spacing.xs },
  menuButton: { justifyContent: 'flex-start' },
  errorText: { color: theme.colors.error, marginBottom: spacing.sm },
  infoContainer: { 
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  infoText: { 
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.md },
  button: { marginTop: spacing.lg },
});

export default ProductoFormScreen;

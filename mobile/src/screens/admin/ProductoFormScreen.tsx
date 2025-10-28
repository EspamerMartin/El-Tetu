import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch } from 'react-native-paper';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';

const ProductoFormScreen = ({ route, navigation }: any) => {
  const { productoId } = route.params || {};
  const isEdit = !!productoId;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [stock, setStock] = useState('0');
  const [precioLista3, setPrecioLista3] = useState('');
  const [precioLista4, setPrecioLista4] = useState('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: producto, loading } = useFetch(
    isEdit ? () => productosAPI.getById(productoId) : () => Promise.resolve(null)
  );

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre);
      setDescripcion(producto.descripcion || '');
      setCodigo(producto.codigo || '');
      setStock(producto.stock.toString());
      setPrecioLista3(producto.precio_lista_3 || '');
      setPrecioLista4(producto.precio_lista_4 || '');
      setActivo(producto.activo);
    }
  }, [producto]);

  const handleSave = async () => {
    if (!nombre || !precioLista3) {
      Alert.alert('Error', 'Nombre y precio son obligatorios');
      return;
    }

    try {
      setSaving(true);
      const data = {
        nombre,
        descripcion,
        codigo,
        stock: parseInt(stock) || 0,
        precio_lista_3: precioLista3,
        precio_lista_4: precioLista4,
        activo,
      };

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {saving && <LoadingOverlay visible message="Guardando..." />}

      <Text variant="headlineSmall" style={styles.title}>
        {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
      </Text>

      <InputField label="Nombre" value={nombre} onChangeText={setNombre} />
      <InputField label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline numberOfLines={3} />
      <InputField label="Código" value={codigo} onChangeText={setCodigo} />
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.md },
  button: { marginTop: spacing.lg },
});

export default ProductoFormScreen;

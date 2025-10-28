import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch } from 'react-native-paper';
import { useFetch } from '@/hooks';
import { promocionesAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';

const PromocionFormScreen = ({ route, navigation }: any) => {
  const { promoId } = route.params || {};
  const isEdit = !!promoId;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('');
  const [descuento, setDescuento] = useState('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: promo, loading } = useFetch(
    isEdit ? () => promocionesAPI.getById(promoId) : () => Promise.resolve(null)
  );

  useEffect(() => {
    if (promo) {
      setNombre(promo.nombre);
      setDescripcion(promo.descripcion || '');
      setTipo(promo.tipo || '');
      setDescuento(promo.descuento?.toString() || '');
      setActivo(promo.activo);
    }
  }, [promo]);

  const handleSave = async () => {
    if (!nombre) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const data = { nombre, descripcion, tipo, descuento: parseFloat(descuento) || 0, activo };

      if (isEdit) {
        await promocionesAPI.update(promoId, data);
      } else {
        await promocionesAPI.create(data);
      }

      Alert.alert('Éxito', `Promoción ${isEdit ? 'actualizada' : 'creada'} correctamente`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingOverlay visible message="Cargando..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {saving && <LoadingOverlay visible message="Guardando..." />}

      <Text variant="headlineSmall" style={styles.title}>
        {isEdit ? 'Editar Promoción' : 'Nueva Promoción'}
      </Text>

      <InputField label="Nombre" value={nombre} onChangeText={setNombre} />
      <InputField label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
      <InputField label="Tipo" value={tipo} onChangeText={setTipo} placeholder="2x1, Descuento, etc." />
      <InputField label="Descuento (%)" value={descuento} onChangeText={setDescuento} keyboardType="decimal-pad" />

      <View style={styles.switchRow}>
        <Text variant="bodyLarge">Promoción activa</Text>
        <Switch value={activo} onValueChange={setActivo} />
      </View>

      <Button mode="contained" onPress={handleSave} style={styles.button}>
        {isEdit ? 'Actualizar' : 'Crear'} Promoción
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

export default PromocionFormScreen;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch, SegmentedButtons } from 'react-native-paper';
import { useFetch } from '@/hooks';
import { promocionesAPI } from '@/services/api';
import { InputField, LoadingOverlay, DateTimePickerField } from '@/components';
import { theme, spacing } from '@/theme';

const PromocionFormScreen = ({ route, navigation }: any) => {
  const { promoId } = route.params || {};
  const isEdit = !!promoId;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<string>('descuento_porcentaje');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState('');
  const [descuentoFijo, setDescuentoFijo] = useState('');
  const [cantidadMinima, setCantidadMinima] = useState('1');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: promo, loading } = useFetch(
    isEdit ? () => promocionesAPI.getById(promoId) : () => Promise.resolve(null)
  );

  useEffect(() => {
    if (promo) {
      setNombre(promo.nombre);
      setDescripcion(promo.descripcion || '');
      setTipo(promo.tipo || 'descuento_porcentaje');
      setDescuentoPorcentaje(promo.descuento_porcentaje?.toString() || '');
      setDescuentoFijo(promo.descuento_fijo?.toString() || '');
      setCantidadMinima(promo.cantidad_minima?.toString() || '1');
      setFechaInicio(promo.fecha_inicio || '');
      setFechaFin(promo.fecha_fin || '');
      setActivo(promo.activo);
    }
  }, [promo]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (!descripcion.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    if (!fechaInicio || !fechaFin) {
      Alert.alert('Error', 'Las fechas de inicio y fin son obligatorias');
      return;
    }

    if (tipo === 'descuento_porcentaje' && !descuentoPorcentaje) {
      Alert.alert('Error', 'El descuento porcentual es obligatorio para este tipo');
      return;
    }

    if (tipo === 'descuento_fijo' && !descuentoFijo) {
      Alert.alert('Error', 'El descuento fijo es obligatorio para este tipo');
      return;
    }

    try {
      setSaving(true);
      const data: any = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        tipo,
        cantidad_minima: parseInt(cantidadMinima) || 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        activo,
      };

      if (tipo === 'descuento_porcentaje' || tipo === 'combinable') {
        data.descuento_porcentaje = parseFloat(descuentoPorcentaje) || 0;
      }

      if (tipo === 'descuento_fijo') {
        data.descuento_fijo = parseFloat(descuentoFijo) || 0;
      }

      if (isEdit) {
        await promocionesAPI.update(promoId, data);
      } else {
        await promocionesAPI.create(data);
      }

      Alert.alert('Éxito', `Promoción ${isEdit ? 'actualizada' : 'creada'} correctamente`);
      navigation.goBack();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'No se pudo guardar';
      Alert.alert('Error', errorMsg);
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
      <InputField 
        label="Descripción" 
        value={descripcion} 
        onChangeText={setDescripcion} 
        multiline 
        numberOfLines={3}
      />

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>Tipo de Promoción</Text>
        <SegmentedButtons
          value={tipo}
          onValueChange={setTipo}
          buttons={[
            { value: 'descuento_porcentaje', label: '% Desc.' },
            { value: 'descuento_fijo', label: '$ Fijo' },
            { value: 'caja_cerrada', label: 'Caja' },
            { value: 'combinable', label: 'Comb.' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {(tipo === 'descuento_porcentaje' || tipo === 'combinable') && (
        <InputField 
          label="Descuento (%)" 
          value={descuentoPorcentaje} 
          onChangeText={setDescuentoPorcentaje} 
          keyboardType="decimal-pad" 
        />
      )}

      {tipo === 'descuento_fijo' && (
        <InputField 
          label="Descuento Fijo ($)" 
          value={descuentoFijo} 
          onChangeText={setDescuentoFijo} 
          keyboardType="decimal-pad" 
        />
      )}

      <InputField 
        label="Cantidad Mínima" 
        value={cantidadMinima} 
        onChangeText={setCantidadMinima} 
        keyboardType="numeric" 
      />

      <DateTimePickerField
        label="Fecha Inicio"
        value={fechaInicio}
        onChangeText={setFechaInicio}
        placeholder="2025-01-01 00:00"
      />

      <DateTimePickerField
        label="Fecha Fin"
        value={fechaFin}
        onChangeText={setFechaFin}
        placeholder="2025-12-31 23:59"
      />

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
  section: { marginVertical: spacing.md },
  label: { marginBottom: spacing.sm },
  segmentedButtons: { marginTop: spacing.xs },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.md },
  button: { marginTop: spacing.lg, marginBottom: spacing.xl },
});

export default PromocionFormScreen;

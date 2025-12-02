import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { listasAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'ListaPrecioForm'>;

/**
 * ListaPrecioFormScreen
 * 
 * Formulario para crear/editar listas de precios
 */
const ListaPrecioFormScreen = ({ route, navigation }: Props) => {
  const { listaId } = route.params || {};
  const isEdit = !!listaId;

  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descuento, setDescuento] = useState('0');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: lista, loading } = useFetch(
    isEdit ? () => listasAPI.getById(listaId) : () => Promise.resolve(null)
  );

  useEffect(() => {
    if (lista) {
      setNombre(lista.nombre);
      setCodigo(lista.codigo);
      setDescuento(lista.descuento_porcentaje.toString());
      setActivo(lista.activo);
    }
  }, [lista]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (!codigo.trim()) {
      Alert.alert('Error', 'El código es obligatorio');
      return;
    }

    const descuentoNum = parseFloat(descuento);
    if (isNaN(descuentoNum) || descuentoNum < 0) {
      Alert.alert('Error', 'El descuento debe ser un número válido mayor o igual a 0');
      return;
    }

    // Proteger Lista Base
    if (isEdit && lista?.codigo === 'base' && codigo !== 'base') {
      Alert.alert('No permitido', 'No se puede cambiar el código de la Lista Base');
      return;
    }

    try {
      setSaving(true);
      const data = {
        nombre: nombre.trim(),
        codigo: codigo.trim().toLowerCase(),
        descuento_porcentaje: descuentoNum.toString(),
        activo,
      };

      if (isEdit) {
        await listasAPI.update(listaId, data);
        Alert.alert('Éxito', 'Lista actualizada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await listasAPI.create(data);
        Alert.alert('Éxito', 'Lista creada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.codigo?.[0]
        || err.response?.data?.nombre?.[0]
        || 'No se pudo guardar la lista';
      Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingOverlay visible message="Cargando..." />;

  const esListaBase = isEdit && lista?.codigo === 'base';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {saving && <LoadingOverlay visible message="Guardando..." />}

      <Text variant="headlineSmall" style={styles.title}>
        {isEdit ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
      </Text>

      {esListaBase && (
        <View style={styles.warningBox}>
          <Text variant="bodyMedium" style={styles.warningText}>
            ⚠️ Esta es la Lista Base. No se puede cambiar el código ni eliminar.
          </Text>
        </View>
      )}

      <InputField
        label="Nombre *"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej: Lista Mayorista"
      />

      <InputField
        label="Código *"
        value={codigo}
        onChangeText={(text) => setCodigo(text.toLowerCase())}
        placeholder="Ej: mayorista"
        disabled={esListaBase}
        autoCapitalize="none"
      />

      <InputField
        label="Descuento (%)"
        value={descuento}
        onChangeText={setDescuento}
        keyboardType="decimal-pad"
        placeholder="Ej: 10.5"
      />

      <View style={styles.infoBox}>
        <Text variant="bodySmall" style={styles.infoText}>
          💡 El descuento se aplica sobre el precio base de cada producto.
        </Text>
        <Text variant="bodySmall" style={styles.infoText}>
          Ejemplo: Producto $100 con 10% descuento = $90
        </Text>
      </View>

      <View style={styles.switchRow}>
        <Text variant="bodyLarge">Lista activa</Text>
        <Switch value={activo} onValueChange={setActivo} />
      </View>

      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.button}
        disabled={saving}
      >
        {isEdit ? 'Guardar Cambios' : 'Crear Lista'}
      </Button>

      {!isEdit && (
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.button}>
          Cancelar
        </Button>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    marginBottom: spacing.lg,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: colors.errorContainer,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  warningText: {
    color: colors.onErrorContainer,
  },
  infoBox: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  infoText: {
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  button: {
    marginBottom: spacing.md,
  },
});

export default ListaPrecioFormScreen;

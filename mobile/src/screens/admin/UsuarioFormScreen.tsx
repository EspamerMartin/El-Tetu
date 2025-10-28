import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch } from 'react-native-paper';
import { useFetch } from '@/hooks';
import { clientesAPI, authAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { theme, spacing } from '@/theme';

const UsuarioFormScreen = ({ route, navigation }: any) => {
  const { usuarioId } = route.params || {};
  const isEdit = !!usuarioId;

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: usuario, loading } = useFetch(
    isEdit ? () => clientesAPI.getById(usuarioId) : () => Promise.resolve(null)
  );

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.usuario.nombre);
      setApellido(usuario.usuario.apellido);
      setEmail(usuario.usuario.email);
      setTelefono(usuario.telefono || '');
      setDireccion(usuario.direccion || '');
      setIsActive(usuario.usuario.is_active);
    }
  }, [usuario]);

  const handleSave = async () => {
    if (!nombre || !apellido || !email) {
      Alert.alert('Error', 'Nombre, apellido y email son obligatorios');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await clientesAPI.update(usuarioId, { nombre, apellido, telefono, direccion });
      } else {
        await authAPI.register({ nombre, apellido, email, password, rol: 'cliente' });
      }
      Alert.alert('Éxito', `Usuario ${isEdit ? 'actualizado' : 'creado'} correctamente`);
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
        {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
      </Text>

      <InputField label="Nombre" value={nombre} onChangeText={setNombre} />
      <InputField label="Apellido" value={apellido} onChangeText={setApellido} />
      <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" disabled={isEdit} />
      {!isEdit && <InputField label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />}
      <InputField label="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
      <InputField label="Dirección" value={direccion} onChangeText={setDireccion} />

      <View style={styles.switchRow}>
        <Text variant="bodyLarge">Usuario activo</Text>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>

      <Button mode="contained" onPress={handleSave} style={styles.button}>
        {isEdit ? 'Actualizar' : 'Crear'} Usuario
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

export default UsuarioFormScreen;

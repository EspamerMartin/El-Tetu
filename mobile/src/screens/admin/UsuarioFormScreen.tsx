import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch, SegmentedButtons } from 'react-native-paper';
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
  const [rol, setRol] = useState<'admin' | 'vendedor' | 'cliente'>('cliente');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: usuario, loading } = useFetch(
    isEdit ? () => clientesAPI.getById(usuarioId) : () => Promise.resolve(null)
  );

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setApellido(usuario.apellido);
      setEmail(usuario.email);
      setRol(usuario.rol || 'cliente');
      setTelefono(usuario.telefono || '');
      setDireccion(usuario.direccion || '');
      setIsActive(usuario.is_active);
    }
  }, [usuario]);

  const handleSave = async () => {
    if (!nombre.trim() || !apellido.trim() || !email.trim()) {
      Alert.alert('Error', 'Nombre, apellido y email son obligatorios');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'El email no es válido');
      return;
    }

    if (!isEdit) {
      if (!password) {
        Alert.alert('Error', 'La contraseña es obligatoria');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    try {
      setSaving(true);
      if (isEdit) {
        await clientesAPI.update(usuarioId, { 
          nombre: nombre.trim(), 
          apellido: apellido.trim(), 
          email: email.trim(),
          telefono: telefono.trim(), 
          direccion: direccion.trim(), 
          is_active: isActive, 
          rol 
        });
      } else {
        // Usar clientesAPI.create para permitir crear usuarios con cualquier rol (admin/vendedor/cliente)
        await clientesAPI.create({ 
          nombre: nombre.trim(), 
          apellido: apellido.trim(), 
          email: email.trim(), 
          password, 
          rol, 
          telefono: telefono.trim(), 
          direccion: direccion.trim(),
          is_active: isActive
        });
      }
      Alert.alert('Éxito', `Usuario ${isEdit ? 'actualizado' : 'creado'} correctamente`);
      navigation.goBack();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.password?.[0] || err.response?.data?.email?.[0] || 'No se pudo guardar';
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
        {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
      </Text>

      <InputField label="Nombre" value={nombre} onChangeText={setNombre} />
      <InputField label="Apellido" value={apellido} onChangeText={setApellido} />
      <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" disabled={isEdit} />
      {!isEdit && (
        <>
          <InputField 
            label="Contraseña (mínimo 6 caracteres)" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />
          {password.length > 0 && password.length < 6 && (
            <Text variant="bodySmall" style={styles.errorText}>
              La contraseña debe tener al menos 6 caracteres
            </Text>
          )}
        </>
      )}
      
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>Rol</Text>
        <SegmentedButtons
          value={rol}
          onValueChange={(value) => setRol(value as 'admin' | 'vendedor' | 'cliente')}
          buttons={[
            { value: 'cliente', label: 'Cliente' },
            { value: 'vendedor', label: 'Vendedor' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
      </View>

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
  section: { marginVertical: spacing.md },
  label: { marginBottom: spacing.sm },
  errorText: { color: theme.colors.error, marginTop: -spacing.sm, marginBottom: spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.md },
  button: { marginTop: spacing.lg },
});

export default UsuarioFormScreen;

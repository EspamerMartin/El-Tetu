import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Switch, SegmentedButtons, Menu, Divider, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { clientesAPI, zonasAPI } from '@/services/api';
import { InputField, LoadingOverlay } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { Zona, HorarioCliente, DiaSemana } from '@/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'UsuarioForm'>;

const DIAS_SEMANA: { value: DiaSemana; label: string }[] = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

const DEFAULT_HORARIOS: Omit<HorarioCliente, 'id' | 'dia_semana_display'>[] = DIAS_SEMANA.map((dia) => ({
  dia_semana: dia.value,
  horario_apertura: '08:00',
  horario_cierre: '18:00',
  cerrado: dia.value === 6, // Domingo cerrado por defecto
}));

const UsuarioFormScreen = ({ route, navigation }: Props) => {
  const { usuarioId } = route.params || {};
  const isEdit = !!usuarioId;

  // Campos básicos
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'admin' | 'vendedor' | 'cliente'>('cliente');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Campos nuevos compartidos (cliente y vendedor)
  const [cuitDni, setCuitDni] = useState('');
  
  // Campos específicos de cliente
  const [zonaId, setZonaId] = useState<number | null>(null);
  const [calle, setCalle] = useState('');
  const [entreCalles, setEntreCalles] = useState('');
  const [numero, setNumero] = useState('');
  const [descripcionUbicacion, setDescripcionUbicacion] = useState('');
  const [horarios, setHorarios] = useState<Omit<HorarioCliente, 'id' | 'dia_semana_display'>[]>(DEFAULT_HORARIOS);
  
  // UI State
  const [saving, setSaving] = useState(false);
  const [zonaMenuVisible, setZonaMenuVisible] = useState(false);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loadingZonas, setLoadingZonas] = useState(false);

  const { data: usuario, loading } = useFetch(
    isEdit ? () => clientesAPI.getById(usuarioId) : () => Promise.resolve(null)
  );

  // Cargar zonas
  useEffect(() => {
    const loadZonas = async () => {
      setLoadingZonas(true);
      try {
        const data = await zonasAPI.getAll({ activo: true });
        setZonas(data);
      } catch (error) {
        console.error('Error cargando zonas:', error);
      } finally {
        setLoadingZonas(false);
      }
    };
    loadZonas();
  }, []);

  // Cargar datos del usuario existente
  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setApellido(usuario.apellido);
      setEmail(usuario.email);
      setRol(usuario.rol || 'cliente');
      setTelefono(usuario.telefono || '');
      setDireccion(usuario.direccion || '');
      setIsActive(usuario.is_active);
      setCuitDni(usuario.cuit_dni || '');
      setZonaId(usuario.zona || null);
      setCalle(usuario.calle || '');
      setEntreCalles(usuario.entre_calles || '');
      setNumero(usuario.numero || '');
      setDescripcionUbicacion(usuario.descripcion_ubicacion || '');
      
      // Cargar horarios si existen
      if (usuario.horarios && usuario.horarios.length > 0) {
        const horariosMap = new Map(usuario.horarios.map(h => [h.dia_semana, h]));
        setHorarios(DIAS_SEMANA.map((dia) => {
          const existing = horariosMap.get(dia.value);
          if (existing) {
            return {
              dia_semana: existing.dia_semana,
              horario_apertura: existing.horario_apertura,
              horario_cierre: existing.horario_cierre,
              cerrado: existing.cerrado,
            };
          }
          return {
            dia_semana: dia.value,
            horario_apertura: '08:00',
            horario_cierre: '18:00',
            cerrado: true,
          };
        }));
      }
    }
  }, [usuario]);

  const getZonaNombre = useCallback(() => {
    if (!zonaId) return 'Seleccionar zona';
    const zona = zonas.find(z => z.id === zonaId);
    return zona?.nombre || 'Seleccionar zona';
  }, [zonaId, zonas]);

  const updateHorario = (diaSemana: DiaSemana, field: keyof Omit<HorarioCliente, 'id' | 'dia_semana_display' | 'dia_semana'>, value: string | boolean) => {
    setHorarios(prev => prev.map(h => 
      h.dia_semana === diaSemana ? { ...h, [field]: value } : h
    ));
  };

  const validateForm = (): boolean => {
    if (!nombre.trim() || !apellido.trim() || !email.trim()) {
      Alert.alert('Error', 'Nombre, apellido y email son obligatorios');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'El email no es válido');
      return false;
    }

    if (!isEdit) {
      if (!password) {
        Alert.alert('Error', 'La contraseña es obligatoria');
        return false;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return false;
      }
    }

    // Validaciones para vendedor
    if (rol === 'vendedor') {
      if (!telefono.trim()) {
        Alert.alert('Error', 'El teléfono es obligatorio para vendedores');
        return false;
      }
      if (!cuitDni.trim()) {
        Alert.alert('Error', 'El CUIT/DNI es obligatorio para vendedores');
        return false;
      }
    }

    // Validaciones para cliente
    if (rol === 'cliente') {
      if (!zonaId) {
        Alert.alert('Error', 'La zona es obligatoria para clientes');
        return false;
      }
      if (!calle.trim()) {
        Alert.alert('Error', 'La calle es obligatoria para clientes');
        return false;
      }
      if (!numero.trim()) {
        Alert.alert('Error', 'El número es obligatorio para clientes');
        return false;
      }
      if (!telefono.trim()) {
        Alert.alert('Error', 'El teléfono es obligatorio para clientes');
        return false;
      }
      if (!cuitDni.trim()) {
        Alert.alert('Error', 'El CUIT/DNI es obligatorio para clientes');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      const baseData = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        rol,
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        is_active: isActive,
      };

      // Agregar campos según el rol
      const roleData = (rol === 'cliente' || rol === 'vendedor') ? {
        cuit_dni: cuitDni.trim(),
      } : {};

      const clienteData = rol === 'cliente' ? {
        zona: zonaId,
        calle: calle.trim(),
        entre_calles: entreCalles.trim(),
        numero: numero.trim(),
        descripcion_ubicacion: descripcionUbicacion.trim(),
        horarios: horarios,
      } : {};

      if (isEdit) {
        await clientesAPI.update(usuarioId, {
          ...baseData,
          ...roleData,
          ...clienteData,
          email: email.trim(),
        });
      } else {
        await clientesAPI.create({
          ...baseData,
          ...roleData,
          ...clienteData,
          email: email.trim(),
          password,
        });
      }
      
      Alert.alert('Éxito', `Usuario ${isEdit ? 'actualizado' : 'creado'} correctamente`);
      navigation.goBack();
    } catch (err: any) {
      const errorData = err.response?.data;
      let errorMsg = 'No se pudo guardar';
      
      if (errorData) {
        // Buscar el primer mensaje de error
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData.error) {
          errorMsg = errorData.error;
        } else {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey) {
            const value = errorData[firstKey];
            errorMsg = Array.isArray(value) ? value[0] : value;
          }
        }
      }
      
      Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingZonas) return <LoadingOverlay visible message="Cargando..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {saving && <LoadingOverlay visible message="Guardando..." />}

      <Text variant="headlineSmall" style={styles.title}>
        {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
      </Text>

      {/* Datos básicos */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Datos básicos</Text>
      
      <InputField label="Nombre *" value={nombre} onChangeText={setNombre} />
      <InputField label="Apellido *" value={apellido} onChangeText={setApellido} />
      <InputField label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" disabled={isEdit} />
      
      {!isEdit && (
        <>
          <InputField 
            label="Contraseña * (mínimo 6 caracteres)" 
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

      {/* Campos para vendedor y cliente */}
      {(rol === 'vendedor' || rol === 'cliente') && (
        <>
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Datos de {rol === 'vendedor' ? 'Vendedor' : 'Cliente'}
          </Text>
          
          <InputField 
            label={`Teléfono ${rol === 'admin' ? '' : '*'}`}
            value={telefono} 
            onChangeText={setTelefono} 
            keyboardType="phone-pad" 
          />
          <InputField 
            label="CUIT/DNI *" 
            value={cuitDni} 
            onChangeText={setCuitDni} 
            keyboardType="numeric"
          />
        </>
      )}

      {/* Campos específicos de cliente */}
      {rol === 'cliente' && (
        <>
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>Dirección</Text>
          
          {/* Selector de zona */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>Zona *</Text>
            <Menu
              visible={zonaMenuVisible}
              onDismiss={() => setZonaMenuVisible(false)}
              anchor={
                <TouchableOpacity 
                  style={styles.dropdown} 
                  onPress={() => setZonaMenuVisible(true)}
                >
                  <Text style={zonaId ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {getZonaNombre()}
                  </Text>
                  <IconButton icon="chevron-down" size={20} />
                </TouchableOpacity>
              }
            >
              {zonas.map((zona) => (
                <Menu.Item
                  key={zona.id}
                  onPress={() => {
                    setZonaId(zona.id);
                    setZonaMenuVisible(false);
                  }}
                  title={zona.nombre}
                  style={zona.id === zonaId ? styles.selectedMenuItem : undefined}
                />
              ))}
            </Menu>
          </View>

          <InputField label="Calle *" value={calle} onChangeText={setCalle} />
          <InputField label="Número *" value={numero} onChangeText={setNumero} />
          <InputField label="Entre calles" value={entreCalles} onChangeText={setEntreCalles} />
          <InputField 
            label="Descripción de ubicación" 
            value={descripcionUbicacion} 
            onChangeText={setDescripcionUbicacion}
            multiline
            numberOfLines={2}
          />

          {/* Horarios */}
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>Horarios de atención</Text>
          
          {DIAS_SEMANA.map((dia) => {
            const horario = horarios.find(h => h.dia_semana === dia.value);
            if (!horario) return null;
            
            return (
              <View key={dia.value} style={styles.horarioRow}>
                <View style={styles.horarioDia}>
                  <Text variant="bodyMedium" style={styles.diaLabel}>{dia.label}</Text>
                  <View style={styles.cerradoContainer}>
                    <Text variant="bodySmall" style={styles.cerradoLabel}>Cerrado</Text>
                    <Switch
                      value={horario.cerrado}
                      onValueChange={(value) => updateHorario(dia.value, 'cerrado', value)}
                    />
                  </View>
                </View>
                
                {!horario.cerrado && (
                  <View style={styles.horarioTimes}>
                    <View style={styles.timeInput}>
                      <Text variant="labelSmall" style={styles.timeLabel}>Apertura</Text>
                      <InputField
                        label=""
                        value={horario.horario_apertura}
                        onChangeText={(value) => updateHorario(dia.value, 'horario_apertura', value)}
                        placeholder="HH:MM"
                        style={styles.timeField}
                      />
                    </View>
                    <View style={styles.timeInput}>
                      <Text variant="labelSmall" style={styles.timeLabel}>Cierre</Text>
                      <InputField
                        label=""
                        value={horario.horario_cierre}
                        onChangeText={(value) => updateHorario(dia.value, 'horario_cierre', value)}
                        placeholder="HH:MM"
                        style={styles.timeField}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* Campo teléfono y dirección para admin */}
      {rol === 'admin' && (
        <>
          <InputField label="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          <InputField label="Dirección" value={direccion} onChangeText={setDireccion} />
        </>
      )}

      <Divider style={styles.divider} />

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
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  content: { 
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: { 
    marginBottom: spacing.lg, 
    fontWeight: 'bold' 
  },
  sectionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    fontWeight: '600',
    color: colors.primary,
  },
  section: { 
    marginVertical: spacing.sm 
  },
  label: { 
    marginBottom: spacing.sm 
  },
  errorText: { 
    color: colors.error, 
    marginTop: -spacing.sm, 
    marginBottom: spacing.sm 
  },
  switchRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginVertical: spacing.md 
  },
  button: { 
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  divider: {
    marginVertical: spacing.md,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  selectedMenuItem: {
    backgroundColor: colors.primaryLight,
  },
  horarioRow: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  horarioDia: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  diaLabel: {
    fontWeight: '600',
    flex: 1,
  },
  cerradoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cerradoLabel: {
    marginRight: spacing.xs,
    color: colors.textSecondary,
  },
  horarioTimes: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },
  timeField: {
    marginBottom: 0,
  },
});

export default UsuarioFormScreen;

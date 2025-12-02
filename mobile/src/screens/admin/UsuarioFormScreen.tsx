import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Text, Button, Switch, SegmentedButtons, Menu, IconButton, ProgressBar } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { clientesAPI, zonasAPI } from '@/services/api';
import { InputField, LoadingOverlay, ScreenContainer } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { Zona, DiaSemana } from '@/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'UsuarioForm'>;

// Tipo para un rango de horario
interface RangoHorario {
  id: string; // ID temporal para el frontend
  dia_semana: DiaSemana;
  hora_desde: string;
  hora_hasta: string;
}

const DIAS_SEMANA: { value: DiaSemana; label: string; short: string }[] = [
  { value: 0, label: 'Lunes', short: 'Lun' },
  { value: 1, label: 'Martes', short: 'Mar' },
  { value: 2, label: 'Miércoles', short: 'Mié' },
  { value: 3, label: 'Jueves', short: 'Jue' },
  { value: 4, label: 'Viernes', short: 'Vie' },
  { value: 5, label: 'Sábado', short: 'Sáb' },
  { value: 6, label: 'Domingo', short: 'Dom' },
];

const UsuarioFormScreen = ({ route, navigation }: Props) => {
  const { usuarioId } = route.params || {};
  const isEdit = !!usuarioId;

  // Step actual
  const [currentStep, setCurrentStep] = useState(0);

  // Campos básicos (Step 1)
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'admin' | 'vendedor' | 'cliente'>('cliente');
  const [isActive, setIsActive] = useState(true);

  // Datos de contacto (Step 2 - vendedor/cliente)
  const [telefono, setTelefono] = useState('');
  const [cuitDni, setCuitDni] = useState('');

  // Dirección (Step 3 - cliente)
  const [zonaId, setZonaId] = useState<number | null>(null);
  const [calle, setCalle] = useState('');
  const [entreCalles, setEntreCalles] = useState('');
  const [numero, setNumero] = useState('');
  const [descripcionUbicacion, setDescripcionUbicacion] = useState('');

  // Horarios (Step 3 - cliente) - Array de rangos, permite múltiples por día
  const [horarios, setHorarios] = useState<RangoHorario[]>([]);

  // UI State
  const [saving, setSaving] = useState(false);
  const [zonaMenuVisible, setZonaMenuVisible] = useState(false);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [zonasLoaded, setZonasLoaded] = useState(false);

  const { data: usuario, loading } = useFetch(
    isEdit ? () => clientesAPI.getById(usuarioId) : () => Promise.resolve(null)
  );

  // Calcular número total de pasos según el rol
  // Admin: 1 paso (datos básicos)
  // Vendedor: 2 pasos (datos básicos, contacto)
  // Cliente: 3 pasos (datos básicos, contacto+dirección, horarios)
  const getTotalSteps = useCallback(() => {
    if (rol === 'admin') return 1;
    if (rol === 'vendedor') return 2;
    return 3; // cliente
  }, [rol]);

  // Cargar zonas solo cuando se necesite (paso 2 para cliente)
  useEffect(() => {
    if (rol === 'cliente' && currentStep === 1 && !zonasLoaded) {
      const loadZonas = async () => {
        try {
          const data = await zonasAPI.getAll({ activo: true });
          setZonas(data);
          setZonasLoaded(true);
        } catch (error) {
          console.error('Error cargando zonas:', error);
        }
      };
      loadZonas();
    }
  }, [rol, currentStep, zonasLoaded]);

  // Cargar datos del usuario existente
  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setApellido(usuario.apellido);
      setEmail(usuario.email);
      setRol(usuario.rol || 'cliente');
      setTelefono(usuario.telefono || '');
      setIsActive(usuario.is_active);
      setCuitDni(usuario.cuit_dni || '');
      setZonaId(usuario.zona || null);
      setCalle(usuario.calle || '');
      setEntreCalles(usuario.entre_calles || '');
      setNumero(usuario.numero || '');
      setDescripcionUbicacion(usuario.descripcion_ubicacion || '');

      // Cargar horarios con nuevo formato
      if (usuario.horarios && usuario.horarios.length > 0) {
        setHorarios(usuario.horarios.map((h, index) => ({
          id: `existing-${index}`,
          dia_semana: h.dia_semana,
          hora_desde: h.hora_desde,
          hora_hasta: h.hora_hasta,
        })));
      }
    }
  }, [usuario]);

  const getZonaNombre = useCallback(() => {
    if (!zonaId) return 'Seleccionar zona';
    const zona = zonas.find(z => z.id === zonaId);
    return zona?.nombre || 'Seleccionar zona';
  }, [zonaId, zonas]);

  // Funciones para manejar horarios
  const agregarHorario = (diaSemana: DiaSemana) => {
    const nuevoHorario: RangoHorario = {
      id: `new-${Date.now()}`,
      dia_semana: diaSemana,
      hora_desde: '08:00',
      hora_hasta: '18:00',
    };
    setHorarios(prev => [...prev, nuevoHorario]);
  };

  const eliminarHorario = (id: string) => {
    setHorarios(prev => prev.filter(h => h.id !== id));
  };

  const updateHorario = (id: string, field: 'hora_desde' | 'hora_hasta', value: string) => {
    setHorarios(prev => prev.map(h =>
      h.id === id ? { ...h, [field]: value } : h
    ));
  };

  const getHorariosPorDia = (diaSemana: DiaSemana) => {
    return horarios.filter(h => h.dia_semana === diaSemana);
  };

  // Validación por paso
  const validateCurrentStep = (): boolean => {
    // Paso 1: Datos básicos (todos los roles)
    if (currentStep === 0) {
      if (!nombre.trim() || !apellido.trim() || !email.trim()) {
        Alert.alert('Error', 'Nombre, apellido y email son obligatorios');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'El email no es válido');
        return false;
      }
      if (!isEdit && (!password || password.length < 6)) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      return true;
    }

    // Paso 2: Contacto (vendedor) o Contacto + Dirección (cliente)
    if (currentStep === 1) {
      // Validar contacto para vendedor y cliente
      if (!telefono.trim()) {
        Alert.alert('Error', 'El teléfono es obligatorio');
        return false;
      }
      if (!cuitDni.trim()) {
        Alert.alert('Error', 'El CUIT/DNI es obligatorio');
        return false;
      }
      
      // Validar dirección solo para cliente
      if (rol === 'cliente') {
        if (!zonaId) {
          Alert.alert('Error', 'La zona es obligatoria');
          return false;
        }
        if (!calle.trim()) {
          Alert.alert('Error', 'La calle es obligatoria');
          return false;
        }
        if (!numero.trim()) {
          Alert.alert('Error', 'El número es obligatorio');
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < getTotalSteps() - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSave();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const baseData = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        rol,
        is_active: isActive,
      };

      const contactData = (rol === 'cliente' || rol === 'vendedor') ? {
        telefono: telefono.trim(),
        cuit_dni: cuitDni.trim(),
      } : {};

      const clienteData = rol === 'cliente' ? {
        zona: zonaId,
        calle: calle.trim(),
        entre_calles: entreCalles.trim(),
        numero: numero.trim(),
        descripcion_ubicacion: descripcionUbicacion.trim(),
        // Enviar horarios sin el id temporal
        horarios: horarios.map(h => ({
          dia_semana: h.dia_semana,
          hora_desde: h.hora_desde,
          hora_hasta: h.hora_hasta,
        })),
      } : {};

      if (isEdit) {
        await clientesAPI.update(usuarioId, {
          ...baseData,
          ...contactData,
          ...clienteData,
          email: email.trim(),
        });
      } else {
        await clientesAPI.create({
          ...baseData,
          ...contactData,
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

  // Render del paso actual
  const renderStep = () => {
    // PASO 1: Datos básicos
    if (currentStep === 0) {
      return (
        <View>
          <Text variant="titleMedium" style={styles.stepTitle}>Datos básicos</Text>

          <InputField label="Nombre *" value={nombre} onChangeText={setNombre} />
          <InputField label="Apellido *" value={apellido} onChangeText={setApellido} />
          <InputField
            label="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            disabled={isEdit}
          />

          {!isEdit && (
            <InputField
              label="Contraseña * (mínimo 6 caracteres)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          )}

          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>Rol</Text>
            <SegmentedButtons
              value={rol}
              onValueChange={(value) => {
                setRol(value as 'admin' | 'vendedor' | 'cliente');
                setCurrentStep(0); // Reset al cambiar rol
              }}
              buttons={[
                { value: 'cliente', label: 'Cliente' },
                { value: 'vendedor', label: 'Vendedor' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </View>

          <View style={styles.switchRow}>
            <Text variant="bodyLarge">Usuario activo</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>
        </View>
      );
    }

    // PASO 2: Contacto (vendedor) o Contacto + Dirección (cliente)
    if (currentStep === 1 && (rol === 'vendedor' || rol === 'cliente')) {
      return (
        <View>
          <Text variant="titleMedium" style={styles.stepTitle}>
            {rol === 'vendedor' ? 'Datos de Vendedor' : 'Contacto y Dirección'}
          </Text>

          <InputField
            label="Teléfono *"
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

          {/* Campos de dirección solo para cliente */}
          {rol === 'cliente' && (
            <>
              <View style={styles.sectionDivider} />
              <Text variant="titleSmall" style={styles.subSectionTitle}>Dirección</Text>

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
                  {zonas.length === 0 && (
                    <Menu.Item title="No hay zonas disponibles" disabled />
                  )}
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
            </>
          )}
        </View>
      );
    }

    // PASO 3: Horarios (cliente)
    if (currentStep === 2 && rol === 'cliente') {
      return (
        <View>
          <Text variant="titleMedium" style={styles.stepTitle}>Horarios de atención</Text>
          <Text variant="bodySmall" style={styles.stepSubtitle}>
            Agrega los rangos de horario para cada día. Puedes tener múltiples rangos por día (ej: mañana y tarde).
          </Text>

          {DIAS_SEMANA.map((dia) => {
            const horariosDia = getHorariosPorDia(dia.value);

            return (
              <View key={dia.value} style={styles.horarioRow}>
                <View style={styles.horarioDiaHeader}>
                  <Text variant="bodyMedium" style={styles.diaLabel}>{dia.label}</Text>
                  <TouchableOpacity
                    style={styles.addHorarioButton}
                    onPress={() => agregarHorario(dia.value)}
                  >
                    <IconButton icon="plus" size={18} iconColor={colors.primary} />
                    <Text style={styles.addHorarioText}>Agregar</Text>
                  </TouchableOpacity>
                </View>

                {horariosDia.length === 0 ? (
                  <Text style={styles.sinHorarioText}>Sin horario (cerrado)</Text>
                ) : (
                  horariosDia.map((horario) => (
                    <View key={horario.id} style={styles.rangoHorario}>
                      <View style={styles.horarioTimes}>
                        <View style={styles.timeInput}>
                          <Text variant="labelSmall" style={styles.timeLabel}>Desde</Text>
                          <RNTextInput
                            value={horario.hora_desde}
                            onChangeText={(value) => updateHorario(horario.id, 'hora_desde', value)}
                            placeholder="HH:MM"
                            style={styles.nativeTimeInput}
                            placeholderTextColor={colors.textTertiary}
                            maxLength={5}
                          />
                        </View>
                        <View style={styles.timeInput}>
                          <Text variant="labelSmall" style={styles.timeLabel}>Hasta</Text>
                          <RNTextInput
                            value={horario.hora_hasta}
                            onChangeText={(value) => updateHorario(horario.id, 'hora_hasta', value)}
                            placeholder="HH:MM"
                            style={styles.nativeTimeInput}
                            placeholderTextColor={colors.textTertiary}
                            maxLength={5}
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.deleteHorarioButton}
                          onPress={() => eliminarHorario(horario.id)}
                        >
                          <IconButton icon="delete" size={20} iconColor={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </View>
      );
    }

    return null;
  };

  const getStepLabel = () => {
    const labels: Record<string, string[]> = {
      admin: ['Datos básicos'],
      vendedor: ['Datos básicos', 'Contacto'],
      cliente: ['Datos básicos', 'Contacto y Dirección', 'Horarios'],
    };
    return labels[rol]?.[currentStep] || '';
  };

  if (loading) return <LoadingOverlay visible message="Cargando..." />;

  const totalSteps = getTotalSteps();
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <ScreenContainer edges={['bottom']}>
      {saving && <LoadingOverlay visible message="Guardando..." />}

      {/* Header con progreso */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
        </Text>
        <Text variant="bodySmall" style={styles.stepIndicator}>
          Paso {currentStep + 1} de {totalSteps}: {getStepLabel()}
        </Text>
        <ProgressBar
          progress={(currentStep + 1) / totalSteps}
          color={colors.primary}
          style={styles.progressBar}
        />
      </View>

      {/* Contenido del paso */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      {/* Botones de navegación */}
      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <Button
            mode="outlined"
            onPress={handleBack}
            style={styles.backButton}
          >
            Anterior
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleNext}
          style={[styles.nextButton, currentStep === 0 && styles.fullWidthButton]}
        >
          {isLastStep ? (isEdit ? 'Actualizar' : 'Crear Usuario') : 'Siguiente'}
        </Button>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontWeight: 'bold',
    color: colors.text,
  },
  stepIndicator: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressBar: {
    marginTop: spacing.sm,
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  stepTitle: {
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  subSectionTitle: {
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.lg,
  },
  section: {
    marginVertical: spacing.sm,
  },
  label: {
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  fullWidthButton: {
    flex: 1,
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
    color: colors.textTertiary,
  },
  selectedMenuItem: {
    backgroundColor: colors.primarySurface,
  },
  horarioRow: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  horarioDiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  diaLabel: {
    fontWeight: '600',
    fontSize: 15,
    color: colors.text,
  },
  addHorarioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addHorarioText: {
    color: colors.primary,
    fontSize: 13,
    marginLeft: -spacing.xs,
  },
  sinHorarioText: {
    color: colors.textTertiary,
    fontStyle: 'italic',
    fontSize: 13,
    paddingVertical: spacing.xs,
  },
  rangoHorario: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  horarioTimes: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: spacing.xs,
    color: colors.textSecondary,
    fontSize: 12,
  },
  deleteHorarioButton: {
    marginBottom: -spacing.xs,
  },
  nativeTimeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
    textAlign: 'center',
  },
});

export default UsuarioFormScreen;

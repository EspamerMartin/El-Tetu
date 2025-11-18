import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch, Divider } from 'react-native-paper';
import { InputField } from '@/components';
import { theme, spacing, colors } from '@/theme';

/**
 * ConfiguracionesScreen - Configuraciones globales del comercio
 */
const ConfiguracionesScreen = () => {
  const [nombreComercio, setNombreComercio] = React.useState('El Tetu');
  const [moneda, setMoneda] = React.useState('ARS');
  const [iva, setIva] = React.useState('21');
  const [notificaciones, setNotificaciones] = React.useState(true);
  const [envioAutomatico, setEnvioAutomatico] = React.useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>Configuraciones</Text>

      <Text variant="titleMedium" style={styles.sectionTitle}>Datos del Comercio</Text>
      <InputField label="Nombre del Comercio" value={nombreComercio} onChangeText={setNombreComercio} />
      <InputField label="Moneda" value={moneda} onChangeText={setMoneda} placeholder="ARS, USD, etc." />
      <InputField label="IVA (%)" value={iva} onChangeText={setIva} keyboardType="decimal-pad" />

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.sectionTitle}>Preferencias</Text>

      <List.Item
        title="Notificaciones Push"
        description="Recibir notificaciones de nuevos pedidos"
        right={() => <Switch value={notificaciones} onValueChange={setNotificaciones} />}
      />

      <List.Item
        title="Envío Automático"
        description="Marcar pedidos confirmados como enviados"
        right={() => <Switch value={envioAutomatico} onValueChange={setEnvioAutomatico} />}
      />

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.sectionTitle}>Información del Sistema</Text>
      <List.Item title="Versión" description="1.0.0" />
      <List.Item title="Base de Datos" description="PostgreSQL 15" />
      <List.Item title="API Version" description="v1" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.md },
  title: { marginBottom: spacing.lg, fontWeight: 'bold' },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.md, fontWeight: '600' },
  divider: { marginVertical: spacing.lg },
});

export default ConfiguracionesScreen;

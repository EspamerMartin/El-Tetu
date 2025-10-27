import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClienteTabParamList } from '@/navigation/ClienteStack';
import { theme } from '@/theme';

type Props = NativeStackScreenProps<ClienteTabParamList, 'Home'>;

/**
 * HomeScreen (Cliente)
 * 
 * Pantalla principal del cliente con:
 * - Banner de bienvenida
 * - Promociones destacadas
 * - Accesos rápidos
 * - Categorías destacadas
 */
const HomeScreen = ({ navigation }: Props) => {
  return (
    <ScrollView style={styles.container}>
      {/* Banner */}
      <Surface style={styles.banner}>
        <Text variant="headlineMedium" style={styles.bannerTitle}>
          ¡Bienvenido a El-Tetu!
        </Text>
        <Text variant="bodyMedium" style={styles.bannerText}>
          Encuentra los mejores productos al mejor precio
        </Text>
      </Surface>

      {/* Accesos Rápidos */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Accesos Rápidos
        </Text>
        <View style={styles.quickActions}>
          <Card style={styles.actionCard} onPress={() => navigation.navigate('Catalogo')}>
            <Card.Content>
              <Text variant="titleMedium">📦 Catálogo</Text>
              <Text variant="bodySmall">Ver productos</Text>
            </Card.Content>
          </Card>
          <Card style={styles.actionCard} onPress={() => navigation.navigate('MisPedidos')}>
            <Card.Content>
              <Text variant="titleMedium">📋 Mis Pedidos</Text>
              <Text variant="bodySmall">Ver historial</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Promociones */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Promociones Activas
        </Text>
        <Card style={styles.promoCard}>
          <Card.Content>
            <Text variant="titleMedium">🎉 Ofertas Especiales</Text>
            <Text variant="bodyMedium">Descuentos en productos seleccionados</Text>
            <Button mode="contained" style={styles.promoButton}>
              Ver Promociones
            </Button>
          </Card.Content>
        </Card>
      </View>

      {/* TODO: Agregar categorías destacadas */}
      {/* TODO: Agregar productos destacados */}
      {/* TODO: Agregar últimas novedades */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  banner: {
    padding: theme.spacing.xl,
    margin: theme.spacing.md,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: theme.colors.primaryContainer,
  },
  bannerTitle: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  bannerText: {
    color: theme.colors.onPrimaryContainer,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
  },
  promoCard: {
    marginBottom: theme.spacing.md,
  },
  promoButton: {
    marginTop: theme.spacing.md,
  },
});

export default HomeScreen;

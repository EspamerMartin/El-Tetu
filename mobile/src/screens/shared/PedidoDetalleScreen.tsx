import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, Surface, Chip, Divider, DataTable, Modal, Portal, RadioButton } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { pedidosAPI } from '@/services/api';
import { Pedido, PedidoItem } from '@/types';
import { LoadingOverlay, ScreenContainer } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';
import { formatPrice, formatDateTime, formatDate } from '@/utils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Transportador {
  id: number;
  nombre: string;
  apellido: string;
  full_name: string;
  email: string;
  telefono?: string;
}

interface PedidoDetalleScreenProps {
  route: { params: { pedidoId: number } };
  navigation: any;
}

/**
 * PedidoDetalleScreen - Pantalla unificada para ver detalle de pedido
 * 
 * Funciona para admin y vendedor con:
 * - Admin: Puede gestionar todos los estados y asignar transportador
 * - Vendedor: Puede aprobar, facturar y asignar transportador
 * - Ambos: Ven toda la información del pedido
 */
const PedidoDetalleScreen = ({ route, navigation }: PedidoDetalleScreenProps) => {
  const { pedidoId } = route.params;
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.rol === 'admin';
  const isAdminOrVendedor = user?.rol === 'admin' || user?.rol === 'vendedor';
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para modal de transportador
  const [transportadorModalVisible, setTransportadorModalVisible] = useState(false);
  const [transportadores, setTransportadores] = useState<Transportador[]>([]);
  const [loadingTransportadores, setLoadingTransportadores] = useState(false);
  const [selectedTransportadorId, setSelectedTransportadorId] = useState<number | null>(null);

  // Estado para descarga de PDF
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchPedido();
  }, [pedidoId]);

  const fetchPedido = async () => {
    try {
      setError(null);
      const data = await pedidosAPI.getById(pedidoId);
      setPedido(data);
      setSelectedTransportadorId(data.transportador || null);
    } catch (err: any) {
      setError('Error al cargar el pedido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransportadores = async () => {
    try {
      setLoadingTransportadores(true);
      const data = await pedidosAPI.getTransportadores();
      setTransportadores(data);
    } catch (err: any) {
      console.error('Error al cargar transportadores:', err);
      Alert.alert('Error', 'No se pudieron cargar los transportadores');
    } finally {
      setLoadingTransportadores(false);
    }
  };

  const handleOpenTransportadorModal = async () => {
    await fetchTransportadores();
    setSelectedTransportadorId(pedido?.transportador || null);
    setTransportadorModalVisible(true);
  };

  // Función para descargar el PDF del remito
  const handleDescargarPdf = async () => {
    if (!pedido) return;

    try {
      setDownloadingPdf(true);

      // Obtener token de autenticación
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Error', 'No hay sesión activa');
        return;
      }

      // URL del endpoint PDF
      const pdfUrl = pedidosAPI.getPdfUrl(pedido.id);
      const filename = `remito_pedido_${pedido.id}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Descargar el archivo
      const downloadResult = await FileSystem.downloadAsync(
        pdfUrl,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status !== 200) {
        throw new Error('Error al descargar el PDF');
      }

      // Verificar si se puede compartir (para iOS/Android)
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        // Compartir/abrir el archivo
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Remito Pedido #${pedido.id}`,
        });
      } else {
        Alert.alert(
          'Descarga completada',
          `El archivo se guardó en: ${fileUri}`
        );
      }
    } catch (err: any) {
      console.error('Error al descargar PDF:', err);
      Alert.alert('Error', 'No se pudo descargar el PDF del remito');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleAsignarTransportador = async () => {
    if (!pedido) return;

    try {
      setProcessing(true);
      await pedidosAPI.asignarTransportador(pedido.id, selectedTransportadorId);
      setTransportadorModalVisible(false);
      
      const transportadorNombre = selectedTransportadorId 
        ? transportadores.find(t => t.id === selectedTransportadorId)?.full_name 
        : null;
      
      Alert.alert(
        'Éxito',
        selectedTransportadorId 
          ? `Transportador ${transportadorNombre} asignado correctamente`
          : 'Transportador removido del pedido'
      );
      await fetchPedido();
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.error || 
        err.response?.data?.transportador?.[0] ||
        err.message ||
        'No se pudo asignar el transportador';
      
      console.error('Error al asignar transportador:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleAprobar = async () => {
    if (!pedido) return;

    Alert.alert(
      'Aprobar Pedido',
      `¿Confirmar el pedido #${pedido.id}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            try {
              setProcessing(true);
              await pedidosAPI.updateEstado(pedido.id, 'EN_PREPARACION');
              Alert.alert('Éxito', 'Pedido aprobado y pasado a preparación');
              await fetchPedido();
            } catch (err: any) {
              const errorMessage = 
                err.response?.data?.error || 
                err.response?.data?.message ||
                err.message ||
                'No se pudo aprobar el pedido';
              
              Alert.alert('Error al aprobar pedido', errorMessage);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleRechazar = async () => {
    if (!pedido) return;

    Alert.alert(
      'Rechazar Pedido',
      `¿Está seguro que desea rechazar el pedido #${pedido.id}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              await pedidosAPI.rechazar(pedido.id);
              Alert.alert('Pedido Rechazado', 'El pedido ha sido rechazado');
              await fetchPedido();
            } catch (err: any) {
              const errorMessage = 
                err.response?.data?.error || 
                err.message ||
                'No se pudo rechazar el pedido';
              
              Alert.alert('Error al rechazar pedido', errorMessage);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!pedido) return;

    const estadoLabels: Record<string, string> = {
      'FACTURADO': 'facturado',
      'ENTREGADO': 'entregado',
    };

    const label = estadoLabels[nuevoEstado] || nuevoEstado.toLowerCase();

    Alert.alert(
      'Cambiar Estado',
      `¿Marcar el pedido #${pedido.id} como ${label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setProcessing(true);
              await pedidosAPI.updateEstado(pedido.id, nuevoEstado);
              Alert.alert('Éxito', `Pedido marcado como ${label}`);
              await fetchPedido();
            } catch (err: any) {
              const errorMessage = 
                err.response?.data?.error || 
                err.message ||
                'No se pudo actualizar el pedido';
              
              Alert.alert('Error', errorMessage);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingOverlay visible message="Cargando pedido..." />;
  }

  if (error || !pedido) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error || 'Pedido no encontrado'}
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            Volver
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return colors.secondary;
      case 'EN_PREPARACION':
        return colors.info;
      case 'FACTURADO':
        return colors.invoice;
      case 'ENTREGADO':
        return colors.success;
      case 'RECHAZADO':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EN_PREPARACION':
        return 'En Preparación';
      case 'FACTURADO':
        return 'Facturado';
      case 'ENTREGADO':
        return 'Entregado';
      case 'RECHAZADO':
        return 'Rechazado';
      default:
        return estado;
    }
  };

  // Determinar si se puede marcar como entregado directamente
  // Solo admin puede entregar sin transportador, o si ya tiene transportador asignado
  const puedeEntregarDirectamente = isAdmin || pedido.transportador;

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall" style={styles.title}>
                Pedido #{pedido.id}
              </Text>
              <Text variant="bodyMedium" style={styles.date}>
                {isAdmin ? formatDateTime(pedido.fecha_creacion) : formatDate(pedido.fecha_creacion)}
              </Text>
            </View>
            <Chip
              style={[styles.estadoChip, { backgroundColor: getEstadoColor(pedido.estado) }]}
              textStyle={styles.estadoChipText}
            >
              {getEstadoLabel(pedido.estado)}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          {/* Información del Cliente */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Cliente
            </Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>Nombre:</Text>
              <Text variant="bodyMedium" style={styles.value}>{pedido.cliente_nombre || 'N/A'}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Transportador Asignado (visible cuando está facturado o tiene transportador) */}
          {(pedido.estado === 'FACTURADO' || pedido.transportador) && isAdminOrVendedor && (
            <>
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  <Icon name="truck-delivery" size={20} color={colors.primary} /> Transportador
                </Text>
                
                {pedido.transportador ? (
                  <View style={styles.transportadorInfo}>
                    <View style={styles.transportadorAsignado}>
                      <Icon name="account-check" size={24} color={colors.success} />
                      <View style={styles.transportadorTexto}>
                        <Text variant="bodyLarge" style={styles.transportadorNombre}>
                          {pedido.transportador_nombre}
                        </Text>
                        <Text variant="bodySmall" style={styles.transportadorLabel}>
                          Asignado para entrega
                        </Text>
                      </View>
                    </View>
                    {pedido.estado === 'FACTURADO' && (
                      <Button
                        mode="outlined"
                        onPress={handleOpenTransportadorModal}
                        compact
                        icon="pencil"
                      >
                        Cambiar
                      </Button>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.asignarTransportadorButton}
                    onPress={handleOpenTransportadorModal}
                  >
                    <Icon name="truck-plus" size={24} color={colors.primary} />
                    <Text variant="bodyLarge" style={styles.asignarTransportadorText}>
                      Asignar Transportador
                    </Text>
                    <Icon name="chevron-right" size={24} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              <Divider style={styles.divider} />
            </>
          )}

          {/* Items del Pedido */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Productos
            </Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Producto</DataTable.Title>
                <DataTable.Title numeric>Cant.</DataTable.Title>
                <DataTable.Title numeric>Precio</DataTable.Title>
                <DataTable.Title numeric>Subtotal</DataTable.Title>
              </DataTable.Header>

              {pedido.items && pedido.items.map((item: PedidoItem) => {
                const productoNombre = item.producto_nombre || item.producto_detalle?.nombre || 'Producto eliminado';
                return (
                  <DataTable.Row key={item.id}>
                    <DataTable.Cell>{productoNombre}</DataTable.Cell>
                    <DataTable.Cell numeric>{item.cantidad}</DataTable.Cell>
                    <DataTable.Cell numeric>{formatPrice(item.precio_unitario)}</DataTable.Cell>
                    <DataTable.Cell numeric>{formatPrice(item.subtotal)}</DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          </View>

          <Divider style={styles.divider} />

          {/* Resumen de Precios */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Resumen
            </Text>
            
            <View style={styles.priceRow}>
              <Text variant="bodyLarge">Subtotal:</Text>
              <Text variant="bodyLarge">{formatPrice(pedido.subtotal)}</Text>
            </View>

            {parseFloat(pedido.descuento_total) > 0 && (
              <View style={styles.priceRow}>
                <Text variant="bodyLarge" style={styles.discountText}>Descuento:</Text>
                <Text variant="bodyLarge" style={styles.discountText}>
                  -{formatPrice(pedido.descuento_total)}
                </Text>
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.priceRow}>
              <Text variant="headlineSmall" style={styles.totalLabel}>Total:</Text>
              <Text variant="headlineSmall" style={styles.totalValue}>
                {formatPrice(pedido.total)}
              </Text>
            </View>
          </View>

          {/* Notas */}
          {pedido.notas && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Notas</Text>
                <Text variant="bodyMedium">{pedido.notas}</Text>
              </View>
            </>
          )}

          {/* Botones de Acción (Admin y Vendedor) */}
          {isAdminOrVendedor && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.actionsSection}>
                {pedido.estado === 'PENDIENTE' && (
                  <>
                    <Button
                      mode="contained"
                      onPress={handleAprobar}
                      disabled={processing}
                      loading={processing}
                      style={styles.aprobarButton}
                      icon="check-circle"
                    >
                      Aprobar Pedido
                    </Button>

                    <Button
                      mode="contained"
                      onPress={handleRechazar}
                      disabled={processing}
                      loading={processing}
                      style={styles.rechazarButton}
                      buttonColor={colors.error}
                      icon="close-circle"
                    >
                      Rechazar Pedido
                    </Button>
                  </>
                )}

                {pedido.estado === 'EN_PREPARACION' && (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => handleCambiarEstado('FACTURADO')}
                      disabled={processing}
                      loading={processing}
                      style={[styles.aprobarButton, { backgroundColor: colors.invoice }]}
                      icon="file-document-outline"
                    >
                      Marcar como Facturado
                    </Button>

                    <Button
                      mode="contained"
                      onPress={handleRechazar}
                      disabled={processing}
                      loading={processing}
                      style={styles.rechazarButton}
                      buttonColor={colors.error}
                      icon="close-circle"
                    >
                      Rechazar Pedido
                    </Button>
                  </>
                )}

                {pedido.estado === 'FACTURADO' && (
                  <>
                    {/* Botón de entregar - solo disponible si tiene transportador o es admin */}
                    {puedeEntregarDirectamente ? (
                      <Button
                        mode="contained"
                        onPress={() => handleCambiarEstado('ENTREGADO')}
                        disabled={processing}
                        loading={processing}
                        style={[styles.aprobarButton, { backgroundColor: colors.success }]}
                        icon="truck-check"
                      >
                        Marcar como Entregado
                      </Button>
                    ) : (
                      <View style={styles.advertenciaTransportador}>
                        <Icon name="information" size={20} color={colors.info} />
                        <Text variant="bodySmall" style={styles.advertenciaText}>
                          Asigna un transportador para poder marcar como entregado
                        </Text>
                      </View>
                    )}

                    <Button
                      mode="contained"
                      onPress={handleRechazar}
                      disabled={processing}
                      loading={processing}
                      style={styles.rechazarButton}
                      buttonColor={colors.error}
                      icon="close-circle"
                    >
                      Rechazar Pedido
                    </Button>
                  </>
                )}

                {(pedido.estado === 'ENTREGADO' || pedido.estado === 'RECHAZADO') && (
                  <View style={styles.estadoInfo}>
                    <Text variant="bodyLarge" style={styles.estadoInfoText}>
                      Este pedido está {getEstadoLabel(pedido.estado).toLowerCase()}
                    </Text>
                    {pedido.estado === 'ENTREGADO' && pedido.transportador_nombre && (
                      <Text variant="bodySmall" style={styles.estadoInfoSubtext}>
                        Entregado por: {pedido.transportador_nombre}
                      </Text>
                    )}
                  </View>
                )}

                {/* Botón Descargar PDF */}
                <Divider style={styles.divider} />
                <Button
                  mode="outlined"
                  onPress={handleDescargarPdf}
                  disabled={downloadingPdf}
                  loading={downloadingPdf}
                  style={styles.pdfButton}
                  icon="file-pdf-box"
                >
                  {downloadingPdf ? 'Descargando...' : 'Descargar Remito PDF'}
                </Button>
              </View>
            </>
          )}
        </Surface>
      </ScrollView>

      {/* Modal para seleccionar transportador */}
      <Portal>
        <Modal
          visible={transportadorModalVisible}
          onDismiss={() => setTransportadorModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Asignar Transportador
          </Text>
          
          {loadingTransportadores ? (
            <View style={styles.modalLoading}>
              <LoadingOverlay visible message="Cargando..." />
            </View>
          ) : transportadores.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Icon name="account-off" size={48} color={colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.modalEmptyText}>
                No hay transportadores disponibles
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.modalScrollView}>
              <RadioButton.Group
                onValueChange={(value) => setSelectedTransportadorId(value ? parseInt(value) : null)}
                value={selectedTransportadorId?.toString() || ''}
              >
                {/* Opción para quitar transportador */}
                <TouchableOpacity
                  style={styles.transportadorOption}
                  onPress={() => setSelectedTransportadorId(null)}
                >
                  <RadioButton value="" />
                  <View style={styles.transportadorOptionInfo}>
                    <Text variant="bodyLarge" style={styles.transportadorOptionNombre}>
                      Sin transportador
                    </Text>
                    <Text variant="bodySmall" style={styles.transportadorOptionEmail}>
                      Quitar asignación
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <Divider />
                
                {transportadores.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.transportadorOption}
                    onPress={() => setSelectedTransportadorId(t.id)}
                  >
                    <RadioButton value={t.id.toString()} />
                    <View style={styles.transportadorOptionInfo}>
                      <Text variant="bodyLarge" style={styles.transportadorOptionNombre}>
                        {t.full_name}
                      </Text>
                      <Text variant="bodySmall" style={styles.transportadorOptionEmail}>
                        {t.email}
                        {t.telefono && ` • ${t.telefono}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </RadioButton.Group>
            </ScrollView>
          )}

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setTransportadorModalVisible(false)}
              style={styles.modalCancelButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleAsignarTransportador}
              disabled={processing || loadingTransportadores}
              loading={processing}
              style={styles.modalConfirmButton}
            >
              Confirmar
            </Button>
          </View>
        </Modal>
      </Portal>

      <LoadingOverlay visible={processing} message="Procesando..." />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  surface: {
    padding: spacing.lg,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: colors.surface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  date: {
    color: colors.onSurfaceVariant,
  },
  estadoChip: {
    marginLeft: spacing.sm,
  },
  estadoChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  label: {
    fontWeight: 'bold',
    width: 80,
    color: colors.onSurfaceVariant,
  },
  value: {
    flex: 1,
    color: colors.onSurface,
  },
  // Estilos de transportador
  transportadorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transportadorAsignado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  transportadorTexto: {
    flex: 1,
  },
  transportadorNombre: {
    fontWeight: '600',
    color: colors.text,
  },
  transportadorLabel: {
    color: colors.success,
  },
  asignarTransportadorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  asignarTransportadorText: {
    flex: 1,
    color: colors.primary,
    fontWeight: '500',
  },
  advertenciaTransportador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  advertenciaText: {
    flex: 1,
    color: colors.info,
  },
  // Estilos de precios
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  discountText: {
    color: colors.tertiary,
  },
  totalLabel: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalValue: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  // Estilos de acciones
  actionsSection: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  aprobarButton: {
    backgroundColor: colors.tertiary,
  },
  rechazarButton: {
    // buttonColor prop se usa en el componente
  },
  pdfButton: {
    marginTop: spacing.md,
    borderColor: colors.primary,
  },
  estadoInfo: {
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    alignItems: 'center',
  },
  estadoInfoText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  estadoInfoSubtext: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Estilos del modal
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalLoading: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmpty: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  modalEmptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  transportadorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  transportadorOptionInfo: {
    flex: 1,
  },
  transportadorOptionNombre: {
    fontWeight: '500',
    color: colors.text,
  },
  transportadorOptionEmail: {
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalConfirmButton: {
    flex: 1,
  },
});

export default PedidoDetalleScreen;

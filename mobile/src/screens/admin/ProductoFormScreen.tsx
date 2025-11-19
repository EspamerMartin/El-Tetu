import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch, Menu, Divider, Surface, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '@/navigation/AdminStack';
import { useFetch } from '@/hooks';
import { productosAPI } from '@/services/api';
import { InputField, LoadingOverlay, ScreenContainer } from '@/components';
import { theme, spacing } from '@/theme';
import { Categoria, Subcategoria, Producto, Marca, UnidadTamaño } from '@/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'ProductoForm'>;

/**
 * ProductoFormScreen
 * 
 * Wizard para crear/editar productos en 3 pasos:
 * Paso 1: Información básica (nombre, descripción, código de barra)
 * Paso 2: Clasificación (marca, categoría/subcategoría, tamaño, unidad)
 * Paso 3: Detalles (unidades_caja, stock, precio_base, url_imagen)
 */
const ProductoFormScreen = ({ route, navigation }: Props) => {
  const { productoId } = route.params || {};
  const isEdit = !!productoId;

  // Estado del wizard
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Paso 1: Información básica
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigoBarra, setCodigoBarra] = useState('');

  // Paso 2: Clasificación
  const [marca, setMarca] = useState<number | null>(null);
  const [categoria, setCategoria] = useState<number | null>(null);
  const [subcategoria, setSubcategoria] = useState<number | null>(null);
  const [tamaño, setTamaño] = useState('');
  const [unidadTamaño, setUnidadTamaño] = useState<UnidadTamaño>('ud');

  // Paso 3: Detalles
  const [unidadesCaja, setUnidadesCaja] = useState('1');
  const [stock, setStock] = useState('0');
  const [precioBase, setPrecioBase] = useState('');
  const [urlImagen, setUrlImagen] = useState('');
  const [activo, setActivo] = useState(true);

  // Estados de UI
  const [saving, setSaving] = useState(false);
  const [marcaMenuVisible, setMarcaMenuVisible] = useState(false);
  const [categoriaMenuVisible, setCategoriaMenuVisible] = useState(false);
  const [subcategoriaMenuVisible, setSubcategoriaMenuVisible] = useState(false);
  
  // Refs para timeouts de menús
  const marcaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoriaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subcategoriaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch de datos
  const { data: producto, loading } = useFetch(
    isEdit ? () => productosAPI.getById(productoId) : () => Promise.resolve(null)
  );

  const { data: marcasData, loading: loadingMarcas } = useFetch(() => productosAPI.getMarcas({ activo: 'true' }));
  const { data: categoriasData, loading: loadingCategorias } = useFetch(() => productosAPI.getCategorias({ activo: 'true' }));
  const { data: subcategoriasData, loading: loadingSubcategorias } = useFetch(() => 
    productosAPI.getSubcategorias({ activo: 'true' })
  );

  const marcas: Marca[] = marcasData?.results || [];
  const categorias: Categoria[] = categoriasData?.results || [];
  const todasSubcategorias: Subcategoria[] = subcategoriasData?.results || [];
  
  // Filtrar subcategorías por categoría seleccionada (ya vienen filtradas por activo desde el backend)
  const subcategoriasFiltradas = categoria 
    ? todasSubcategorias.filter(sub => sub.categoria === categoria)
    : [];

  // Opciones de unidades de tamaño
  const unidadesOpciones: Array<{ value: UnidadTamaño; label: string }> = [
    { value: 'ud', label: 'Unidad' },
    { value: 'ml', label: 'Mililitros' },
    { value: 'l', label: 'Litros' },
    { value: 'g', label: 'Gramos' },
    { value: 'kg', label: 'Kilogramos' },
    { value: 'cm', label: 'Centímetros' },
    { value: 'm', label: 'Metros' },
  ];

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (marcaMenuTimeoutRef.current) clearTimeout(marcaMenuTimeoutRef.current);
      if (categoriaMenuTimeoutRef.current) clearTimeout(categoriaMenuTimeoutRef.current);
      if (subcategoriaMenuTimeoutRef.current) clearTimeout(subcategoriaMenuTimeoutRef.current);
    };
  }, []);

  // Cargar datos del producto si es edición
  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre);
      setDescripcion(producto.descripcion || '');
      setCodigoBarra(producto.codigo_barra || '');
      setMarca(producto.marca || null);
      setCategoria(producto.categoria || null);
      setSubcategoria(producto.subcategoria || null);
      setTamaño(producto.tamaño || '');
      setUnidadTamaño(producto.unidad_tamaño || 'ud');
      setUnidadesCaja(producto.unidades_caja?.toString() || '1');
      setStock(producto.stock.toString());
      setPrecioBase(producto.precio_base || '');
      setUrlImagen(producto.url_imagen || '');
      setActivo(producto.activo);
    }
  }, [producto]);

  // Limpiar subcategoría cuando se cambia de categoría
  useEffect(() => {
    if (categoria && subcategoria) {
      const subcategoriaValida = subcategoriasFiltradas.find(sub => sub.id === subcategoria);
      if (!subcategoriaValida) {
        setSubcategoria(null);
      }
    }
  }, [categoria, subcategoriasFiltradas, subcategoria]);

  // Handlers de menús - Marca
  const handleOpenMarcaMenu = useCallback(() => {
    if (marcaMenuTimeoutRef.current) {
      clearTimeout(marcaMenuTimeoutRef.current);
      marcaMenuTimeoutRef.current = null;
    }
    marcaMenuTimeoutRef.current = setTimeout(() => {
      setMarcaMenuVisible(true);
      marcaMenuTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleCloseMarcaMenu = useCallback(() => {
    if (marcaMenuTimeoutRef.current) {
      clearTimeout(marcaMenuTimeoutRef.current);
      marcaMenuTimeoutRef.current = null;
    }
    setMarcaMenuVisible(false);
  }, []);

  const handleSelectMarca = useCallback((marcaId: number) => {
    setMarcaMenuVisible(false);
    setTimeout(() => {
      setMarca(marcaId);
    }, 100);
  }, []);

  // Handlers de menús - Categoría
  const handleOpenCategoriaMenu = useCallback(() => {
    if (categoriaMenuTimeoutRef.current) {
      clearTimeout(categoriaMenuTimeoutRef.current);
      categoriaMenuTimeoutRef.current = null;
    }
    categoriaMenuTimeoutRef.current = setTimeout(() => {
      setCategoriaMenuVisible(true);
      categoriaMenuTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleCloseCategoriaMenu = useCallback(() => {
    if (categoriaMenuTimeoutRef.current) {
      clearTimeout(categoriaMenuTimeoutRef.current);
      categoriaMenuTimeoutRef.current = null;
    }
    setCategoriaMenuVisible(false);
  }, []);

  const handleSelectCategoria = useCallback((catId: number) => {
    setCategoriaMenuVisible(false);
    setTimeout(() => {
      setCategoria(catId);
    }, 100);
  }, []);

  // Handlers de menús - Subcategoría
  const handleOpenSubcategoriaMenu = useCallback(() => {
    if (subcategoriaMenuTimeoutRef.current) {
      clearTimeout(subcategoriaMenuTimeoutRef.current);
      subcategoriaMenuTimeoutRef.current = null;
    }
    subcategoriaMenuTimeoutRef.current = setTimeout(() => {
      setSubcategoriaMenuVisible(true);
      subcategoriaMenuTimeoutRef.current = null;
    }, 50);
  }, []);

  const handleCloseSubcategoriaMenu = useCallback(() => {
    if (subcategoriaMenuTimeoutRef.current) {
      clearTimeout(subcategoriaMenuTimeoutRef.current);
      subcategoriaMenuTimeoutRef.current = null;
    }
    setSubcategoriaMenuVisible(false);
  }, []);

  const handleSelectSubcategoria = useCallback((subId: number | null) => {
    setSubcategoriaMenuVisible(false);
    setTimeout(() => {
      setSubcategoria(subId);
    }, 100);
  }, []);

  // Validación por pasos
  const validarPaso1 = (): boolean => {
    if (!nombre || !nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return false;
    }
    if (!codigoBarra || !codigoBarra.trim()) {
      Alert.alert('Error', 'El código de barra es obligatorio');
      return false;
    }
    return true;
  };

  const validarPaso2 = (): boolean => {
    if (!marca) {
      Alert.alert('Error', 'Debe seleccionar una marca');
      return false;
    }
    if (!categoria) {
      Alert.alert('Error', 'Debe seleccionar una categoría');
      return false;
    }
    if (!tamaño || !tamaño.trim()) {
      Alert.alert('Error', 'El tamaño es obligatorio');
      return false;
    }
    const tamañoNum = parseFloat(tamaño);
    if (isNaN(tamañoNum) || tamañoNum <= 0) {
      Alert.alert('Error', 'El tamaño debe ser un número válido mayor a 0');
      return false;
    }
    return true;
  };

  const validarPaso3 = (): boolean => {
    const unidadesCajaNum = parseInt(unidadesCaja);
    if (isNaN(unidadesCajaNum) || unidadesCajaNum <= 0) {
      Alert.alert('Error', 'Las unidades por caja deben ser un número válido mayor a 0');
      return false;
    }
    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Error', 'El stock debe ser un número válido mayor o igual a 0');
      return false;
    }
    if (!precioBase || !precioBase.trim()) {
      Alert.alert('Error', 'El precio base es obligatorio');
      return false;
    }
    const precioBaseNum = parseFloat(precioBase);
    if (isNaN(precioBaseNum) || precioBaseNum < 0) {
      Alert.alert('Error', 'El precio base debe ser un número válido mayor o igual a 0');
      return false;
    }
    return true;
  };

  // Navegación entre pasos
  const handleSiguiente = () => {
    if (paso === 1 && !validarPaso1()) return;
    if (paso === 2 && !validarPaso2()) return;
    if (paso < 3) {
      setPaso((paso + 1) as 1 | 2 | 3);
    }
  };

  const handleAtras = () => {
    if (paso > 1) {
      setPaso((paso - 1) as 1 | 2 | 3);
    }
  };

  // Guardar producto
  const handleSave = async () => {
    if (!validarPaso3()) return;

    try {
      setSaving(true);
      const data: Partial<Producto> = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        codigo_barra: codigoBarra.trim(),
        marca: marca || undefined,
        categoria: categoria || undefined,
        tamaño: parseFloat(tamaño).toString(),
        unidad_tamaño: unidadTamaño,
        unidades_caja: parseInt(unidadesCaja),
        stock: parseInt(stock),
        stock_minimo: 0,
        precio_base: parseFloat(precioBase).toString(),
        url_imagen: urlImagen.trim() || undefined,
        activo,
      };

      if (subcategoria) {
        data.subcategoria = subcategoria;
      } else {
        data.subcategoria = undefined;
      }

      if (isEdit) {
        await productosAPI.update(productoId, data);
      } else {
        await productosAPI.create(data);
      }

      Alert.alert('Éxito', `Producto ${isEdit ? 'actualizado' : 'creado'} correctamente`);
      navigation.goBack();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.codigo_barra?.[0] || 
                       err.response?.data?.marca?.[0] ||
                       err.response?.data?.precio_base?.[0] ||
                       err.response?.data?.tamaño?.[0] ||
                       err.response?.data?.unidad_tamaño?.[0] ||
                       err.response?.data?.unidades_caja?.[0] ||
                       err.response?.data?.categoria?.[0] ||
                       err.response?.data?.subcategoria?.[0] ||
                       err.message || 
                       'No se pudo guardar';
      Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingOverlay visible message="Cargando..." />;

  const hayCategorias = categorias.length > 0;
  const hayMarcas = marcas.length > 0;

  return (
    <ScreenContainer>
      {saving && <LoadingOverlay visible message="Guardando..." />}
      {(loadingCategorias || loadingMarcas) && <LoadingOverlay visible message="Cargando..." />}

      {/* Stepper */}
      <View style={styles.stepper}>
        <View style={[styles.step, paso >= 1 && styles.stepActive]}>
          <Text variant="labelSmall" style={paso >= 1 && styles.stepTextActive}>
            1. Información Básica
          </Text>
        </View>
        <Divider style={styles.stepDivider} />
        <View style={[styles.step, paso >= 2 && styles.stepActive]}>
          <Text variant="labelSmall" style={paso >= 2 && styles.stepTextActive}>
            2. Clasificación
          </Text>
        </View>
        <Divider style={styles.stepDivider} />
        <View style={[styles.step, paso >= 3 && styles.stepActive]}>
          <Text variant="labelSmall" style={paso >= 3 && styles.stepTextActive}>
            3. Detalles
          </Text>
        </View>
      </View>

      {/* PASO 1: Información Básica */}
      {paso === 1 && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text variant="titleLarge" style={styles.title}>
            {isEdit ? 'Editar' : 'Nuevo'} Producto - Información Básica
          </Text>

          <InputField 
            label="Nombre *" 
            value={nombre} 
            onChangeText={setNombre}
            placeholder="Nombre del producto"
          />
          
          <InputField 
            label="Descripción" 
            value={descripcion} 
            onChangeText={setDescripcion} 
            multiline 
            numberOfLines={3}
            placeholder="Descripción opcional del producto"
          />
          
          <InputField 
            label="Código de Barra *" 
            value={codigoBarra} 
            onChangeText={setCodigoBarra} 
            keyboardType="numeric"
            placeholder="Ej: 7790070612106"
          />

          <View style={styles.actions}>
            <Button mode="outlined" onPress={() => navigation.goBack()}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleSiguiente}>
              Siguiente
            </Button>
          </View>
        </ScrollView>
      )}

      {/* PASO 2: Clasificación */}
      {paso === 2 && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text variant="titleLarge" style={styles.title}>
            Clasificación del Producto
          </Text>

          <View style={styles.menuContainer}>
            <Text variant="labelLarge" style={styles.label}>Marca *</Text>
            {!hayMarcas && !loadingMarcas && (
              <Text variant="bodySmall" style={styles.errorText}>
                No hay marcas disponibles. Crea una marca primero.
              </Text>
            )}
            <Menu
              visible={marcaMenuVisible}
              onDismiss={handleCloseMarcaMenu}
              anchor={
                <Button 
                  mode="outlined" 
                  onPress={handleOpenMarcaMenu}
                  icon="chevron-down"
                  contentStyle={styles.menuButton}
                  style={styles.selectButton}
                  disabled={!hayMarcas}
                >
                  {marca ? marcas.find(m => m.id === marca)?.nombre || 'Seleccionar marca' : 'Seleccionar marca'}
                </Button>
              }
            >
              {marcas.map((m) => (
                <Menu.Item
                  key={m.id}
                  onPress={() => handleSelectMarca(m.id)}
                  title={m.nombre}
                />
              ))}
            </Menu>
          </View>

          <View style={styles.menuContainer}>
            <Text variant="labelLarge" style={styles.label}>Categoría *</Text>
            {!hayCategorias && !loadingCategorias && (
              <Text variant="bodySmall" style={styles.errorText}>
                No hay categorías disponibles. Crea una categoría primero.
              </Text>
            )}
            <Menu
              visible={categoriaMenuVisible}
              onDismiss={handleCloseCategoriaMenu}
              anchor={
                <Button 
                  mode="outlined" 
                  onPress={handleOpenCategoriaMenu}
                  icon="chevron-down"
                  contentStyle={styles.menuButton}
                  style={styles.selectButton}
                  disabled={!hayCategorias}
                >
                  {categoria ? categorias.find(c => c.id === categoria)?.nombre || 'Seleccionar categoría' : 'Seleccionar categoría'}
                </Button>
              }
            >
              {categorias.map((cat) => (
                <Menu.Item
                  key={cat.id}
                  onPress={() => handleSelectCategoria(cat.id)}
                  title={cat.nombre}
                />
              ))}
            </Menu>
          </View>

          {categoria && subcategoriasFiltradas && subcategoriasFiltradas.length > 0 && (
            <View style={styles.menuContainer}>
              <Text variant="labelLarge" style={styles.label}>Subcategoría (Opcional)</Text>
              <Menu
                visible={subcategoriaMenuVisible}
                onDismiss={handleCloseSubcategoriaMenu}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={handleOpenSubcategoriaMenu}
                    icon="chevron-down"
                    contentStyle={styles.menuButton}
                    style={styles.selectButton}
                  >
                    {subcategoria ? subcategoriasFiltradas.find((s: Subcategoria) => s.id === subcategoria)?.nombre || 'Seleccionar subcategoría' : 'Seleccionar subcategoría'}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => handleSelectSubcategoria(null)}
                  title="Sin subcategoría"
                />
                {subcategoriasFiltradas.map((sub: Subcategoria) => (
                  <Menu.Item
                    key={sub.id}
                    onPress={() => handleSelectSubcategoria(sub.id)}
                    title={sub.nombre}
                  />
                ))}
              </Menu>
            </View>
          )}

          {categoria && subcategoriasFiltradas.length === 0 && (
            <View style={styles.infoContainer}>
              <Text variant="bodySmall" style={styles.infoText}>
                Esta categoría no tiene subcategorías. Puedes agregar subcategorías desde el panel de Categorías.
              </Text>
            </View>
          )}

          <InputField label="Tamaño *" value={tamaño} onChangeText={setTamaño} keyboardType="decimal-pad" />
          
          <View style={styles.unidadSection}>
            <Text variant="labelLarge" style={styles.label}>Unidad de Tamaño *</Text>
            <Surface style={styles.unidadSelectorContainer} elevation={0}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unidadSelector}
              >
                {unidadesOpciones.map((unidad) => {
                  const isSelected = unidadTamaño === unidad.value;
                  return (
                    <Button
                      key={unidad.value}
                      mode={isSelected ? 'contained' : 'outlined'}
                      onPress={() => setUnidadTamaño(unidad.value)}
                      style={[
                        styles.unidadButton,
                        isSelected && styles.unidadButtonSelected
                      ]}
                      contentStyle={styles.unidadButtonContent}
                      labelStyle={[
                        styles.unidadButtonLabel,
                        isSelected && styles.unidadButtonLabelSelected
                      ]}
                    >
                      {unidad.label}
                    </Button>
                  );
                })}
              </ScrollView>
            </Surface>
          </View>

          <View style={styles.actions}>
            <Button mode="outlined" onPress={handleAtras}>
              Atrás
            </Button>
            <Button mode="contained" onPress={handleSiguiente}>
              Siguiente
            </Button>
          </View>
        </ScrollView>
      )}

      {/* PASO 3: Detalles */}
      {paso === 3 && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text variant="titleLarge" style={styles.title}>
            Detalles del Producto
          </Text>

          <InputField 
            label="Unidades por Caja *" 
            value={unidadesCaja} 
            onChangeText={setUnidadesCaja} 
            keyboardType="numeric"
            placeholder="Ej: 1"
          />
          
          <InputField 
            label="Stock" 
            value={stock} 
            onChangeText={setStock} 
            keyboardType="numeric"
            placeholder="Cantidad en stock"
          />
          
          <InputField 
            label="Precio Base *" 
            value={precioBase} 
            onChangeText={setPrecioBase} 
            keyboardType="decimal-pad"
            placeholder="Precio sin descuentos"
          />
          
          <InputField 
            label="URL de Imagen (S3)" 
            value={urlImagen} 
            onChangeText={setUrlImagen}
            placeholder="https://s3.amazonaws.com/..."
          />

          <View style={styles.switchRow}>
            <Text variant="bodyLarge">Producto activo</Text>
            <Switch value={activo} onValueChange={setActivo} />
          </View>

          <View style={styles.actions}>
            <Button mode="outlined" onPress={handleAtras}>
              Atrás
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
              {isEdit ? 'Actualizar' : 'Crear'} Producto
            </Button>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  stepActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
  stepTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  stepDivider: {
    width: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + spacing.xl,
  },
  title: {
    marginBottom: spacing.lg,
    fontWeight: 'bold',
  },
  label: {
    marginBottom: spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: spacing.sm,
  },
  menuContainer: {
    marginVertical: spacing.sm,
  },
  menuButton: {
    justifyContent: 'flex-start',
  },
  selectButton: {
    height: 56,
  },
  infoContainer: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  infoText: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  unidadSection: {
    marginBottom: spacing.md,
  },
  unidadSelectorContainer: {
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline + '20',
  },
  unidadSelector: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  unidadButton: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 6,
    minWidth: 85,
    height: 44,
  },
  unidadButtonSelected: {
    elevation: 0,
  },
  unidadButtonContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unidadButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 18,
    textAlign: 'center',
  },
  unidadButtonLabelSelected: {
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 18,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
  },
});

export default ProductoFormScreen;

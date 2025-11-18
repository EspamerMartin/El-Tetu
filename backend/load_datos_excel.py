"""
Script específico para cargar datos desde datos.xlsx
Carga: Marcas, Categorías, Subcategorías, Productos y Precios
"""
import os
import sys
import django
import pandas as pd
from decimal import Decimal, InvalidOperation
from django.db import transaction

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.productos.models import Marca, Categoria, Subcategoria, Producto


def normalize_text(text):
    """Normaliza texto: elimina espacios, convierte a minúsculas."""
    if pd.isna(text):
        return None
    return str(text).strip()


def get_or_create_marca(nombre):
    """Obtiene o crea una marca."""
    if not nombre or pd.isna(nombre):
        return None
    
    nombre = normalize_text(nombre)
    marca, created = Marca.objects.get_or_create(
        nombre=nombre,
        defaults={'descripcion': f'Marca {nombre}', 'activo': True}
    )
    return marca


def get_or_create_categoria(nombre):
    """Obtiene o crea una categoría."""
    if not nombre or pd.isna(nombre):
        return None
    
    nombre = normalize_text(nombre)
    categoria, created = Categoria.objects.get_or_create(
        nombre=nombre,
        defaults={'descripcion': f'Categoría {nombre}', 'activo': True}
    )
    return categoria


def get_or_create_subcategoria(categoria, nombre):
    """Obtiene o crea una subcategoría."""
    if not categoria or not nombre or pd.isna(nombre):
        return None
    
    nombre = normalize_text(nombre)
    subcategoria, created = Subcategoria.objects.get_or_create(
        categoria=categoria,
        nombre=nombre,
        defaults={'descripcion': f'Subcategoría {nombre}', 'activo': True}
    )
    return subcategoria


def convert_codigo_barra(codigo):
    """Convierte código de barras a string, manejando notación científica."""
    if pd.isna(codigo):
        return None
    
    # Si es float con notación científica, convertir a int primero
    if isinstance(codigo, float):
        try:
            # Si es muy grande, puede ser notación científica
            if codigo > 1e10:
                codigo = int(codigo)
            else:
                codigo = int(codigo)
        except (ValueError, OverflowError):
            pass
    
    # Convertir a string sin decimales
    if isinstance(codigo, (int, float)):
        return str(int(codigo))
    
    return str(codigo).strip().replace('.0', '')


def convert_precio(precio):
    """Convierte precio a Decimal."""
    if pd.isna(precio):
        return Decimal('0')
    
    try:
        if isinstance(precio, str):
            precio = precio.replace(',', '.')
        return Decimal(str(precio))
    except (InvalidOperation, ValueError):
        return Decimal('0')


def load_marcas_categorias_subcategorias(df):
    """Carga marcas, categorías y subcategorías desde el DataFrame."""
    print("\n" + "="*60)
    print("CARGANDO MARCAS, CATEGORIAS Y SUBCATEGORIAS")
    print("="*60)
    
    marcas_creadas = 0
    categorias_creadas = 0
    subcategorias_creadas = 0
    
    # Obtener valores únicos
    marcas_unicas = df['marca'].dropna().unique()
    categorias_unicas = df['categoria'].dropna().unique()
    
    # Cargar marcas
    print("\nCargando marcas...")
    for marca_nombre in marcas_unicas:
        marca = get_or_create_marca(marca_nombre)
        if marca:
            marcas_creadas += 1
            print(f"  [OK] {marca.nombre}")
    
    # Cargar categorías
    print("\nCargando categorias...")
    categorias_dict = {}
    for categoria_nombre in categorias_unicas:
        categoria = get_or_create_categoria(categoria_nombre)
        if categoria:
            categorias_dict[categoria_nombre] = categoria
            categorias_creadas += 1
            print(f"  [OK] {categoria.nombre}")
    
    # Cargar subcategorías
    print("\nCargando subcategorias...")
    subcategorias_unicas = df[['categoria', 'subcategoria']].dropna().drop_duplicates()
    for _, row in subcategorias_unicas.iterrows():
        categoria_nombre = row['categoria']
        subcategoria_nombre = row['subcategoria']
        
        categoria = categorias_dict.get(categoria_nombre)
        if categoria:
            subcategoria = get_or_create_subcategoria(categoria, subcategoria_nombre)
            if subcategoria:
                subcategorias_creadas += 1
                print(f"  [OK] {categoria.nombre} > {subcategoria.nombre}")
    
    print(f"\n[RESUMEN] {marcas_creadas} marcas, {categorias_creadas} categorias, {subcategorias_creadas} subcategorias")
    return categorias_dict


def load_productos(df, categorias_dict):
    """Carga productos desde el DataFrame."""
    print("\n" + "="*60)
    print("CARGANDO PRODUCTOS")
    print("="*60)
    
    productos_creados = 0
    productos_actualizados = 0
    errores = 0
    
    # Mapeo de unidades
    unidad_mapping = {
        'L': 'l',
        'ML': 'ml',
        'G': 'g',
        'KG': 'kg',
        'CM': 'cm',
        'M': 'm',
        'UD': 'ud',
    }
    
    with transaction.atomic():
        for idx, row in df.iterrows():
            try:
                # Validar campos obligatorios
                codigo_barra = convert_codigo_barra(row.get('codigodebarra'))
                if not codigo_barra:
                    print(f"  [ADVERTENCIA] Fila {idx + 2}: Sin codigo de barras, saltando...")
                    errores += 1
                    continue
                
                nombre_producto = normalize_text(row.get('descripcionproducto'))
                if not nombre_producto:
                    print(f"  [ADVERTENCIA] Fila {idx + 2}: Sin nombre de producto, saltando...")
                    errores += 1
                    continue
                
                # Obtener relaciones
                marca = get_or_create_marca(row.get('marca'))
                if not marca:
                    print(f"  [ADVERTENCIA] Fila {idx + 2}: Sin marca valida, saltando...")
                    errores += 1
                    continue
                
                categoria_nombre = normalize_text(row.get('categoria'))
                categoria = categorias_dict.get(categoria_nombre) if categoria_nombre else None
                if not categoria:
                    print(f"  [ADVERTENCIA] Fila {idx + 2}: Sin categoria valida, saltando...")
                    errores += 1
                    continue
                
                subcategoria = None
                subcategoria_nombre = normalize_text(row.get('subcategoria'))
                if subcategoria_nombre:
                    subcategoria = get_or_create_subcategoria(categoria, subcategoria_nombre)
                
                # Obtener o crear producto
                producto, created = Producto.objects.get_or_create(
                    codigo_barra=codigo_barra,
                    defaults={
                        'nombre': nombre_producto,
                        'marca': marca,
                        'categoria': categoria,
                        'subcategoria': subcategoria,
                        'tamaño': Decimal(str(row.get('tamano', 1.0))),
                        'unidad_tamaño': unidad_mapping.get(
                            str(row.get('unidaddetamano', 'UD')).upper(), 'ud'
                        ),
                        'unidades_caja': int(row.get('unidadescaja', 1)),
                        'precio_base': convert_precio(row.get('precio_base', 0)),
                        'stock': 0,
                        'stock_minimo': 0,
                        'url_imagen': normalize_text(row.get('imagen')),
                        'activo': True,
                    }
                )
                
                # Si ya existe, actualizar
                if not created:
                    producto.nombre = nombre_producto
                    producto.marca = marca
                    producto.categoria = categoria
                    producto.subcategoria = subcategoria
                    producto.tamaño = Decimal(str(row.get('tamano', 1.0)))
                    producto.unidad_tamaño = unidad_mapping.get(
                        str(row.get('unidaddetamano', 'UD')).upper(), 'ud'
                    )
                    producto.unidades_caja = int(row.get('unidadescaja', 1))
                    producto.url_imagen = normalize_text(row.get('imagen'))
                    producto.save()
                    productos_actualizados += 1
                else:
                    productos_creados += 1
                
                if (idx + 1) % 50 == 0:
                    print(f"  Procesados {idx + 1} productos...")
                    
            except Exception as e:
                errores += 1
                print(f"  [ERROR] Fila {idx + 2}: {e}")
                continue
    
    print(f"\n[RESUMEN] {productos_creados} creados, {productos_actualizados} actualizados, {errores} errores")
    return productos_creados + productos_actualizados


def load_precios(excel_path):
    """Carga precios desde la hoja 'Precios' y actualiza productos por código de barras.
    Los productos que no se encuentren en Precios recibirán precio_base = 1."""
    print("\n" + "="*60)
    print("CARGANDO PRECIOS DESDE LISTA 4")
    print("="*60)
    
    try:
        df_precios = pd.read_excel(excel_path, sheet_name='Precios')
    except Exception as e:
        print(f"[ERROR] Error al leer hoja 'Precios': {e}")
        return 0
    
    # Limpiar columnas
    if 'Cod. Barras' not in df_precios.columns:
        print("[ERROR] No se encontro la columna 'Cod. Barras' en la hoja Precios")
        return 0
    
    if 'Lista 4' not in df_precios.columns:
        print("[ERROR] No se encontro la columna 'Lista 4' en la hoja Precios")
        return 0
    
    precios_actualizados = 0
    no_encontrados = 0
    productos_con_precio = set()  # Para trackear qué productos recibieron precio
    
    print(f"\nProcesando {len(df_precios)} registros de precios...")
    
    with transaction.atomic():
        # Paso 1: Actualizar precios desde la hoja Precios
        for idx, row in df_precios.iterrows():
            try:
                codigo_barra_raw = row.get('Cod. Barras')
                if pd.isna(codigo_barra_raw):
                    continue
                
                codigo_barra = convert_codigo_barra(codigo_barra_raw)
                if not codigo_barra:
                    continue
                
                precio_lista4 = convert_precio(row.get('Lista 4'))
                if precio_lista4 <= 0:
                    continue
                
                # Buscar producto por código de barras (búsqueda exacta)
                try:
                    producto = Producto.objects.get(codigo_barra=codigo_barra)
                    producto.precio_base = precio_lista4
                    producto.save()
                    productos_con_precio.add(producto.id)
                    precios_actualizados += 1
                    
                    if precios_actualizados <= 5:  # Mostrar los primeros 5
                        print(f"  [OK] {producto.nombre[:50]}: ${precio_lista4}")
                    elif precios_actualizados % 50 == 0:
                        print(f"  Procesados {precios_actualizados} precios...")
                        
                except Producto.DoesNotExist:
                    no_encontrados += 1
                    if no_encontrados <= 10:  # Mostrar solo los primeros 10
                        print(f"  [ADVERTENCIA] Producto no encontrado con codigo: {codigo_barra}")
                    
            except Exception as e:
                print(f"  [ERROR] Fila {idx + 2} de Precios: {e}")
                continue
        
        # Paso 2: Asignar precio 1 a productos que no recibieron precio
        print(f"\nAsignando precio 1 a productos sin precio en Precios...")
        productos_sin_precio = Producto.objects.exclude(id__in=productos_con_precio)
        cantidad_sin_precio = productos_sin_precio.count()
        
        if cantidad_sin_precio > 0:
            productos_sin_precio.update(precio_base=Decimal('1'))
            print(f"  [OK] {cantidad_sin_precio} productos recibieron precio_base = 1")
        else:
            print(f"  [OK] Todos los productos tienen precio asignado")
    
    print(f"\n[RESUMEN] {precios_actualizados} precios actualizados desde Precios, {cantidad_sin_precio} productos con precio 1, {no_encontrados} codigos no encontrados en BD")
    if no_encontrados > 0:
        print(f"  [NOTA] Si hay muchos productos no encontrados, verifica que los codigos de barras coincidan entre Sheet1 y Precios")
    return precios_actualizados


def main():
    """Función principal."""
    excel_path = os.path.join(os.path.dirname(__file__), 'datos.xlsx')
    
    if not os.path.exists(excel_path):
        print(f"[ERROR] No se encontro el archivo: {excel_path}")
        return False
    
    print("\n" + "="*60)
    print("INICIANDO CARGA DE DATOS DESDE EXCEL")
    print("="*60)
    print(f"\nArchivo: {excel_path}\n")
    
    try:
        # Leer Sheet1
        df = pd.read_excel(excel_path, sheet_name='Sheet1')
        print(f"[OK] Leidas {len(df)} filas de Sheet1")
        
        # Paso 1: Cargar marcas, categorías y subcategorías
        categorias_dict = load_marcas_categorias_subcategorias(df)
        
        # Paso 2: Cargar productos
        productos_cargados = load_productos(df, categorias_dict)
        
        # Paso 3: Cargar precios desde hoja Precios
        precios_cargados = load_precios(excel_path)
        
        print("\n" + "="*60)
        print("CARGA COMPLETADA")
        print("="*60)
        print(f"  • Productos procesados: {productos_cargados}")
        print(f"  • Precios actualizados: {precios_cargados}")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Error general: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    main()


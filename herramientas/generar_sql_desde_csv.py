"""
Script para generar scripts SQL desde un CSV para cargar datos en PostgreSQL.
Ajusta los datos según los modelos y setea valores por defecto.

USO:
    python generar_sql_desde_csv.py <archivo.csv> [stock_default]
    
    Ejemplo:
    python generar_sql_desde_csv.py productos.csv 10

FORMATO CSV ESPERADO:
    El CSV debe tener las siguientes columnas (case-insensitive):
    - categoria (OBLIGATORIO)
    - subcategoria (OPCIONAL)
    - marca (OBLIGATORIO)
    - decripcionproducto (OBLIGATORIO - es el nombre del producto)
    - tamano (OPCIONAL, default: 1.0)
    - unidaddetamano (OPCIONAL, default: 'ud')
    - unidadescaja (OPCIONAL, default: 1)
    - precio_base (OPCIONAL, default: 0)
    - codigodebarra (OBLIGATORIO)
    - imagen (OPCIONAL - URL de la imagen)
    
    NOTA: El stock se setea automáticamente en el valor por defecto (10 o el especificado)

SALIDA:
    Genera un archivo .sql con el mismo nombre que el CSV, listo para ejecutar en PostgreSQL.
    El script incluye:
    - INSERT de marcas (con ON CONFLICT DO NOTHING)
    - INSERT de categorías (con ON CONFLICT DO NOTHING)
    - INSERT de subcategorías (con ON CONFLICT DO NOTHING)
    - INSERT/UPDATE de productos (con ON CONFLICT DO UPDATE)
"""
import csv
import os
import sys
from decimal import Decimal, InvalidOperation
from datetime import datetime


def normalize_text(text):
    """Normaliza texto: elimina espacios, maneja None."""
    if text is None or text == '':
        return None
    return str(text).strip()


def convert_codigo_barra(codigo):
    """Convierte código de barras a string."""
    if codigo is None or codigo == '':
        return None
    
    # Si es float, convertir a int primero
    if isinstance(codigo, float):
        try:
            codigo = int(codigo)
        except (ValueError, OverflowError):
            pass
    
    # Convertir a string sin decimales
    if isinstance(codigo, (int, float)):
        return str(int(codigo))
    
    return str(codigo).strip().replace('.0', '')


def convert_precio(precio):
    """Convierte precio a Decimal."""
    if precio is None or precio == '':
        return Decimal('0')
    
    try:
        if isinstance(precio, str):
            precio = precio.replace(',', '.')
        return Decimal(str(precio))
    except (InvalidOperation, ValueError):
        return Decimal('0')


def convert_decimal(valor, default=0):
    """Convierte valor a Decimal."""
    if valor is None or valor == '':
        return Decimal(str(default))
    
    try:
        if isinstance(valor, str):
            valor = valor.replace(',', '.')
        return Decimal(str(valor))
    except (InvalidOperation, ValueError):
        return Decimal(str(default))


def convert_int(valor, default=0):
    """Convierte valor a int."""
    if valor is None or valor == '':
        return default
    
    try:
        return int(float(valor))
    except (ValueError, TypeError):
        return default


def escape_sql_string(text):
    """Escapa strings para SQL."""
    if text is None:
        return 'NULL'
    # Reemplazar comillas simples por dos comillas simples (escape SQL)
    text = str(text).replace("'", "''")
    return f"'{text}'"


def generar_sql_marcas(marcas_unicas):
    """Genera SQL para insertar marcas."""
    sql_lines = []
    sql_lines.append("-- ============================================")
    sql_lines.append("-- INSERTAR MARCAS")
    sql_lines.append("-- ============================================\n")
    
    for idx, marca_nombre in enumerate(marcas_unicas, 1):
        nombre = normalize_text(marca_nombre)
        if not nombre:
            continue
        
        # Verificar si ya existe (usando nombre)
        sql_lines.append(f"-- Marca: {nombre}")
        sql_lines.append(f"INSERT INTO productos_marca (nombre, descripcion, activo, fecha_creacion, fecha_actualizacion, fecha_eliminacion, eliminado_por_id)")
        sql_lines.append(f"VALUES ({escape_sql_string(nombre)}, {escape_sql_string(f'Marca {nombre}')}, true, NOW(), NOW(), NULL, NULL)")
        sql_lines.append(f"ON CONFLICT (nombre) DO NOTHING;")
        sql_lines.append("")
    
    return "\n".join(sql_lines)


def generar_sql_categorias(categorias_unicas):
    """Genera SQL para insertar categorías."""
    sql_lines = []
    sql_lines.append("-- ============================================")
    sql_lines.append("-- INSERTAR CATEGORIAS")
    sql_lines.append("-- ============================================\n")
    
    for idx, categoria_nombre in enumerate(categorias_unicas, 1):
        nombre = normalize_text(categoria_nombre)
        if not nombre:
            continue
        
        sql_lines.append(f"-- Categoría: {nombre}")
        sql_lines.append(f"INSERT INTO productos_categoria (nombre, descripcion, activo, fecha_creacion, fecha_actualizacion, fecha_eliminacion, eliminado_por_id)")
        sql_lines.append(f"VALUES ({escape_sql_string(nombre)}, {escape_sql_string(f'Categoría {nombre}')}, true, NOW(), NOW(), NULL, NULL)")
        sql_lines.append(f"ON CONFLICT (nombre) DO NOTHING;")
        sql_lines.append("")
    
    return "\n".join(sql_lines)


def generar_sql_subcategorias(subcategorias_dict):
    """Genera SQL para insertar subcategorías."""
    sql_lines = []
    sql_lines.append("-- ============================================")
    sql_lines.append("-- INSERTAR SUBCATEGORIAS")
    sql_lines.append("-- ============================================\n")
    
    for (categoria_nombre, subcategoria_nombre) in subcategorias_dict:
        categoria = normalize_text(categoria_nombre)
        subcategoria = normalize_text(subcategoria_nombre)
        
        if not categoria or not subcategoria:
            continue
        
        sql_lines.append(f"-- Subcategoría: {categoria} > {subcategoria}")
        sql_lines.append(f"INSERT INTO productos_subcategoria (categoria_id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion, fecha_eliminacion, eliminado_por_id)")
        sql_lines.append(f"SELECT id, {escape_sql_string(subcategoria)}, {escape_sql_string(f'Subcategoría {subcategoria}')}, true, NOW(), NOW(), NULL, NULL")
        sql_lines.append(f"FROM productos_categoria WHERE nombre = {escape_sql_string(categoria)}")
        sql_lines.append(f"ON CONFLICT (categoria_id, nombre) DO NOTHING;")
        sql_lines.append("")
    
    return "\n".join(sql_lines)


def generar_sql_productos(productos_data, stock_default=10):
    """Genera SQL para insertar productos."""
    sql_lines = []
    sql_lines.append("-- ============================================")
    sql_lines.append("-- INSERTAR PRODUCTOS")
    sql_lines.append("-- ============================================\n")
    
    # Mapeo de unidades
    unidad_mapping = {
        'L': 'l',
        'ML': 'ml',
        'G': 'g',
        'KG': 'kg',
        'CM': 'cm',
        'M': 'm',
        'UD': 'ud',
        'U': 'ud',
        'UN': 'ud',
        'UNIDAD': 'ud',
        'UNIDADES': 'ud',
    }
    
    productos_procesados = 0
    productos_omitidos = 0
    
    for producto in productos_data:
        # Leer columnas exactas del CSV (case-insensitive)
        codigo_barra = convert_codigo_barra(producto.get('codigodebarra'))
        nombre = normalize_text(producto.get('decripcionproducto'))  # Nota: decripcionproducto (sin 's')
        marca_nombre = normalize_text(producto.get('marca'))
        categoria_nombre = normalize_text(producto.get('categoria'))
        subcategoria_nombre = normalize_text(producto.get('subcategoria'))
        
        # Validar campos obligatorios
        if not codigo_barra:
            productos_omitidos += 1
            continue
        if not nombre:
            productos_omitidos += 1
            continue
        if not marca_nombre:
            productos_omitidos += 1
            continue
        if not categoria_nombre:
            productos_omitidos += 1
            continue
        
        # Valores por defecto según las columnas del CSV
        tamaño = convert_decimal(producto.get('tamano'), 1.0)
        unidad_raw = str(producto.get('unidaddetamano') or 'UD').upper()
        unidad_tamaño = unidad_mapping.get(unidad_raw, 'ud')
        unidades_caja = convert_int(producto.get('unidadescaja'), 1)
        precio_base = convert_precio(producto.get('precio_base'))
        stock = stock_default  # Siempre usar el valor por defecto (10 o el especificado)
        stock_minimo = 0  # Valor por defecto
        url_imagen = normalize_text(producto.get('imagen'))
        descripcion = None  # No hay columna descripcion en el CSV
        
        sql_lines.append(f"-- Producto: {nombre[:50]} (Código: {codigo_barra})")
        sql_lines.append(f"INSERT INTO productos_producto (")
        sql_lines.append(f"    codigo_barra, nombre, descripcion, marca_id, categoria_id, subcategoria_id,")
        sql_lines.append(f"    tamaño, unidad_tamaño, unidades_caja, precio_base, stock, stock_minimo,")
        sql_lines.append(f"    url_imagen, activo, fecha_creacion, fecha_actualizacion, fecha_eliminacion, eliminado_por_id")
        sql_lines.append(f") VALUES (")
        sql_lines.append(f"    {escape_sql_string(codigo_barra)},")
        sql_lines.append(f"    {escape_sql_string(nombre)},")
        sql_lines.append(f"    {escape_sql_string(descripcion) if descripcion else 'NULL'},")
        sql_lines.append(f"    (SELECT id FROM productos_marca WHERE nombre = {escape_sql_string(marca_nombre)} LIMIT 1),")
        sql_lines.append(f"    (SELECT id FROM productos_categoria WHERE nombre = {escape_sql_string(categoria_nombre)} LIMIT 1),")
        
        if subcategoria_nombre:
            sql_lines.append(f"    (SELECT id FROM productos_subcategoria WHERE nombre = {escape_sql_string(subcategoria_nombre)} AND categoria_id = (SELECT id FROM productos_categoria WHERE nombre = {escape_sql_string(categoria_nombre)} LIMIT 1) LIMIT 1),")
        else:
            sql_lines.append(f"    NULL,")
        
        sql_lines.append(f"    {tamaño},")
        sql_lines.append(f"    {escape_sql_string(unidad_tamaño)},")
        sql_lines.append(f"    {unidades_caja},")
        sql_lines.append(f"    {precio_base},")
        sql_lines.append(f"    {stock},")
        sql_lines.append(f"    {stock_minimo},")
        sql_lines.append(f"    {escape_sql_string(url_imagen) if url_imagen else 'NULL'},")
        sql_lines.append(f"    true,")
        sql_lines.append(f"    NOW(),")
        sql_lines.append(f"    NOW(),")
        sql_lines.append(f"    NULL,")
        sql_lines.append(f"    NULL")
        sql_lines.append(f")")
        sql_lines.append(f"ON CONFLICT (codigo_barra) DO UPDATE SET")
        sql_lines.append(f"    nombre = EXCLUDED.nombre,")
        sql_lines.append(f"    descripcion = EXCLUDED.descripcion,")
        sql_lines.append(f"    marca_id = EXCLUDED.marca_id,")
        sql_lines.append(f"    categoria_id = EXCLUDED.categoria_id,")
        sql_lines.append(f"    subcategoria_id = EXCLUDED.subcategoria_id,")
        sql_lines.append(f"    tamaño = EXCLUDED.tamaño,")
        sql_lines.append(f"    unidad_tamaño = EXCLUDED.unidad_tamaño,")
        sql_lines.append(f"    unidades_caja = EXCLUDED.unidades_caja,")
        sql_lines.append(f"    precio_base = EXCLUDED.precio_base,")
        sql_lines.append(f"    stock = EXCLUDED.stock,")
        sql_lines.append(f"    stock_minimo = EXCLUDED.stock_minimo,")
        sql_lines.append(f"    url_imagen = EXCLUDED.url_imagen,")
        sql_lines.append(f"    fecha_actualizacion = NOW();")
        sql_lines.append("")
        
        productos_procesados += 1
    
    sql_lines.append(f"\n-- Total productos procesados: {productos_procesados}")
    if productos_omitidos > 0:
        sql_lines.append(f"-- Productos omitidos (faltan datos obligatorios): {productos_omitidos}")
    
    return "\n".join(sql_lines)


def leer_csv(csv_path):
    """Lee un archivo CSV y retorna los datos."""
    productos = []
    marcas_unicas = set()
    categorias_unicas = set()
    subcategorias_dict = set()
    
    # Intentar detectar el encoding
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    
    for encoding in encodings:
        try:
            with open(csv_path, 'r', encoding=encoding, newline='') as f:
                # Detectar delimitador
                sample = f.read(1024)
                f.seek(0)
                sniffer = csv.Sniffer()
                delimiter = sniffer.sniff(sample).delimiter
                
                reader = csv.DictReader(f, delimiter=delimiter)
                
                for row in reader:
                    # Normalizar nombres de columnas (case insensitive)
                    row_normalized = {k.lower().strip(): v for k, v in row.items()}
                    productos.append(row_normalized)
                    
                    # Extraer marcas, categorías y subcategorías únicas
                    marca = normalize_text(row_normalized.get('marca'))
                    categoria = normalize_text(row_normalized.get('categoria'))
                    subcategoria = normalize_text(row_normalized.get('subcategoria'))
                    
                    if marca:
                        marcas_unicas.add(marca)
                    if categoria:
                        categorias_unicas.add(categoria)
                    if categoria and subcategoria:
                        subcategorias_dict.add((categoria, subcategoria))
                
                print(f"[OK] CSV leído correctamente con encoding {encoding}")
                break
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"[ERROR] Error al leer CSV con encoding {encoding}: {e}")
            continue
    else:
        raise Exception("No se pudo leer el CSV con ningún encoding")
    
    return productos, marcas_unicas, categorias_unicas, subcategorias_dict


def main():
    """Función principal."""
    if len(sys.argv) < 2:
        print("Uso: python generar_sql_desde_csv.py <archivo.csv> [stock_default]")
        print("Ejemplo: python generar_sql_desde_csv.py productos.csv 10")
        return
    
    csv_path = sys.argv[1]
    stock_default = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    if not os.path.exists(csv_path):
        print(f"[ERROR] No se encontró el archivo: {csv_path}")
        return
    
    print("\n" + "="*60)
    print("GENERANDO SCRIPTS SQL DESDE CSV")
    print("="*60)
    print(f"\nArchivo CSV: {csv_path}")
    print(f"Stock por defecto: {stock_default}\n")
    
    try:
        # Leer CSV
        productos, marcas_unicas, categorias_unicas, subcategorias_dict = leer_csv(csv_path)
        print(f"[OK] Leídas {len(productos)} filas del CSV")
        print(f"[OK] {len(marcas_unicas)} marcas únicas")
        print(f"[OK] {len(categorias_unicas)} categorías únicas")
        print(f"[OK] {len(subcategorias_dict)} subcategorías únicas")
        print(f"[INFO] Stock por defecto para productos: {stock_default}\n")
        
        # Generar SQL
        sql_output = []
        sql_output.append("-- ============================================")
        sql_output.append("-- SCRIPT SQL GENERADO DESDE CSV")
        sql_output.append(f"-- Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        sql_output.append(f"-- Archivo CSV: {csv_path}")
        sql_output.append(f"-- Stock por defecto: {stock_default}")
        sql_output.append("-- ============================================\n")
        sql_output.append("BEGIN;\n")
        
        # Generar SQL para marcas
        sql_output.append(generar_sql_marcas(sorted(marcas_unicas)))
        sql_output.append("\n")
        
        # Generar SQL para categorías
        sql_output.append(generar_sql_categorias(sorted(categorias_unicas)))
        sql_output.append("\n")
        
        # Generar SQL para subcategorías
        sql_output.append(generar_sql_subcategorias(sorted(subcategorias_dict)))
        sql_output.append("\n")
        
        # Generar SQL para productos
        sql_output.append(generar_sql_productos(productos, stock_default))
        sql_output.append("\n")
        
        sql_output.append("COMMIT;")
        sql_output.append("\n")
        sql_output.append("-- ============================================")
        sql_output.append("-- FIN DEL SCRIPT")
        sql_output.append("-- ============================================")
        
        # Guardar archivo SQL
        sql_path = csv_path.replace('.csv', '.sql')
        if sql_path == csv_path:
            sql_path = csv_path + '.sql'
        
        with open(sql_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(sql_output))
        
        print("="*60)
        print("SCRIPT SQL GENERADO EXITOSAMENTE")
        print("="*60)
        print(f"Archivo SQL: {sql_path}")
        print(f"Total de productos procesados: {len(productos)}")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Error general: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    main()


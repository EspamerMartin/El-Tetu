"""
Script para cargar datos SQL en SQLite desde un archivo SQL generado.
Este script es útil para desarrollo local.

USO:
    python cargar_datos_sqlite.py [archivo.sql] [db.sqlite3]
    
    Si no se especifica archivo, busca datos_sqlite.sql en el directorio actual.
    Si no se especifica base de datos, usa db.sqlite3 en el directorio actual.
"""
import os
import sys
import sqlite3


def cargar_sql_en_sqlite(sql_path, db_path=None):
    """Carga un archivo SQL en SQLite."""
    if db_path is None:
        db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
    
    if not os.path.exists(sql_path):
        print(f"[ERROR] No se encontró el archivo SQL: {sql_path}")
        return False
    
    if not os.path.exists(db_path):
        print(f"[ERROR] No se encontró la base de datos: {db_path}")
        print(f"[INFO] Ejecuta primero: python manage.py migrate")
        return False
    
    print(f"\n{'='*60}")
    print("CARGANDO DATOS EN SQLITE")
    print(f"{'='*60}")
    print(f"Archivo SQL: {sql_path}")
    print(f"Base de datos: {db_path}\n")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Leer y ejecutar el archivo SQL
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # Ejecutar el script (SQLite ejecuta múltiples comandos)
        cursor.executescript(sql_script)
        
        conn.commit()
        
        # Verificar cuántos registros se insertaron
        cursor.execute("SELECT COUNT(*) FROM productos_producto")
        total_productos = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM productos_marca")
        total_marcas = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM productos_categoria")
        total_categorias = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM productos_subcategoria")
        total_subcategorias = cursor.fetchone()[0]
        
        conn.close()
        
        print(f"{'='*60}")
        print("DATOS CARGADOS EXITOSAMENTE")
        print(f"{'='*60}")
        print(f"  • Productos: {total_productos}")
        print(f"  • Marcas: {total_marcas}")
        print(f"  • Categorías: {total_categorias}")
        print(f"  • Subcategorías: {total_subcategorias}")
        print(f"{'='*60}\n")
        
        return True
        
    except sqlite3.Error as e:
        print(f"\n[ERROR] Error de SQLite: {e}")
        return False
    except Exception as e:
        print(f"\n[ERROR] Error general: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Función principal."""
    # Obtener ruta del script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    
    # Buscar archivo SQL
    if len(sys.argv) > 1:
        sql_path = sys.argv[1]
        if not os.path.isabs(sql_path):
            sql_path = os.path.join(os.getcwd(), sql_path)
    else:
        # Buscar datos_sqlite.sql en varios lugares
        posibles_rutas = [
            os.path.join(script_dir, 'datos_sqlite.sql'),
            os.path.join(parent_dir, 'datos_sqlite.sql'),
            os.path.join(os.getcwd(), 'datos_sqlite.sql'),
        ]
        sql_path = None
        for ruta in posibles_rutas:
            if os.path.exists(ruta):
                sql_path = ruta
                break
    
    # Buscar base de datos
    if len(sys.argv) > 2:
        db_path = sys.argv[2]
        if not os.path.isabs(db_path):
            db_path = os.path.join(os.getcwd(), db_path)
    else:
        # Buscar db.sqlite3 en varios lugares
        posibles_rutas_db = [
            os.path.join(script_dir, 'db.sqlite3'),
            os.path.join(parent_dir, 'db.sqlite3'),
            os.path.join(os.getcwd(), 'db.sqlite3'),
        ]
        db_path = None
        for ruta in posibles_rutas_db:
            if os.path.exists(ruta):
                db_path = ruta
                break
    
    if not sql_path or not os.path.exists(sql_path):
        print("Uso: python cargar_datos_sqlite.py [archivo.sql] [db.sqlite3]")
        print("\nEjemplo:")
        print("  python cargar_datos_sqlite.py datos_sqlite.sql")
        print("  python cargar_datos_sqlite.py datos_sqlite.sql db.sqlite3")
        print("\nEl script buscará automáticamente en:")
        print(f"  - {script_dir}")
        print(f"  - {parent_dir}")
        print(f"  - {os.getcwd()}")
        return
    
    if not db_path:
        print("[ERROR] No se encontró db.sqlite3")
        print("Ejecuta primero: python manage.py migrate")
        return
    
    cargar_sql_en_sqlite(sql_path, db_path)


if __name__ == '__main__':
    main()


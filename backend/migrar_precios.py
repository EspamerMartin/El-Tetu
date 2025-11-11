"""
Script para migrar datos de precios antiguos al nuevo sistema.
Este script:
1. Crea la Lista Base (precio sin descuentos)
2. Migra precio_lista_3 como precio_base
3. Crea listas adicionales si es necesario
"""

import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.productos.models import ListaPrecio, Producto
from apps.users.models import CustomUser
from decimal import Decimal

def migrar_precios():
    """Migra los precios del sistema antiguo al nuevo."""
    
    print("=" * 60)
    print("MIGRANDO SISTEMA DE PRECIOS")
    print("=" * 60)
    
    # 1. Crear lista base (0% descuento)
    print("\n1. Creando Lista Base...")
    lista_base, created = ListaPrecio.objects.get_or_create(
        codigo='lista_base',
        defaults={
            'nombre': 'Lista Base',
            'descuento_porcentaje': Decimal('0.00'),
            'activo': True
        }
    )
    if created:
        print(f"   ✓ Lista Base creada: {lista_base}")
    else:
        print(f"   → Lista Base ya existe: {lista_base}")
    
    # 2. Migrar productos si tienen los campos antiguos
    print("\n2. Migrando precios de productos...")
    productos_migrados = 0
    productos_saltados = 0
    
    for producto in Producto.objects.all():
        try:
            # Si el producto tiene precio_base, ya fue migrado
            if hasattr(producto, 'precio_base') and producto.precio_base > 0:
                productos_saltados += 1
                continue
            
            # Si tiene precio_lista_3, usarlo como base
            if hasattr(producto, 'precio_lista_3'):
                producto.precio_base = producto.precio_lista_3
                producto.save(update_fields=['precio_base'])
                productos_migrados += 1
                if productos_migrados <= 5:  # Mostrar solo los primeros 5
                    print(f"   ✓ {producto.codigo}: {producto.precio_base}")
        except Exception as e:
            print(f"   ✗ Error migrando {producto.codigo}: {e}")
    
    print(f"\n   Total migrados: {productos_migrados}")
    print(f"   Total saltados: {productos_saltados}")
    
    # 3. Crear listas adicionales con descuentos
    print("\n3. Creando listas de precios adicionales...")
    
    listas_adicionales = [
        {'codigo': 'lista_3', 'nombre': 'Lista 3', 'descuento': 0},
        {'codigo': 'lista_4', 'nombre': 'Lista 4', 'descuento': 5},
        {'codigo': 'lista_mayorista', 'nombre': 'Lista Mayorista', 'descuento': 10},
        {'codigo': 'lista_vip', 'nombre': 'Lista VIP', 'descuento': 15},
    ]
    
    for lista_data in listas_adicionales:
        lista, created = ListaPrecio.objects.get_or_create(
            codigo=lista_data['codigo'],
            defaults={
                'nombre': lista_data['nombre'],
                'descuento_porcentaje': Decimal(str(lista_data['descuento'])),
                'activo': True
            }
        )
        if created:
            print(f"   ✓ {lista.nombre} ({lista.descuento_porcentaje}% desc.)")
        else:
            print(f"   → {lista.nombre} ya existe")
    
    # 4. Resetear listas de precios de usuarios (null = lista base)
    print("\n4. Reseteando asignación de listas a clientes...")
    clientes_actualizados = CustomUser.objects.filter(
        rol='cliente'
    ).update(lista_precio=None)
    print(f"   ✓ {clientes_actualizados} clientes ahora usan Lista Base")
    
    print("\n" + "=" * 60)
    print("✓ MIGRACIÓN COMPLETADA")
    print("=" * 60)
    print("\nResumen:")
    print(f"- Productos migrados: {productos_migrados}")
    print(f"- Listas de precios creadas: {ListaPrecio.objects.count()}")
    print(f"- Todos los clientes usan Lista Base por defecto")
    print("\nPuedes asignar listas personalizadas a clientes desde el admin.")

if __name__ == '__main__':
    migrar_precios()

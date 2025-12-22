"""
Script para inicializar el usuario administrador en producción.

USO:
- En PRODUCCIÓN: Configura ADMIN_EMAIL y ADMIN_PASSWORD en variables de entorno
- En DESARROLLO: No es necesario, se crean usuarios de prueba automáticamente

Este script se ejecuta automáticamente en cada deploy (entrypoint.sh).
Solo crea usuarios si no existen.
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from decouple import config

User = get_user_model()

# Detectar si estamos en producción
DEBUG = config('DEBUG', default=True, cast=bool)
IS_PRODUCTION = not DEBUG


def crear_admin_produccion():
    """Crea el usuario administrador en producción usando variables de entorno."""
    try:
        admin_email = config('ADMIN_EMAIL')
        admin_password = config('ADMIN_PASSWORD')
    except Exception:
        print("[SKIP] ADMIN_EMAIL o ADMIN_PASSWORD no configurados - saltando creación de admin")
        return False
    
    if User.objects.filter(email=admin_email).exists():
        print(f"[OK] Admin ya existe: {admin_email}")
        return False
    
    User.objects.create_user(
        email=admin_email,
        password=admin_password,
        nombre='Admin',
        apellido='Sistema',
        rol='admin',
        is_staff=True,
        is_superuser=True,
    )
    print(f"[CREATED] Admin creado: {admin_email}")
    return True


def crear_usuarios_desarrollo():
    """Crea usuarios de prueba para desarrollo local."""
    usuarios = [
        {
            'email': 'admin@mail.com',
            'password': 'admin123',
            'nombre': 'Admin',
            'apellido': 'Test',
            'rol': 'admin',
            'is_staff': True,
            'is_superuser': True,
        },
        {
            'email': 'vendedor@mail.com',
            'password': 'vendedor123',
            'nombre': 'Vendedor',
            'apellido': 'Test',
            'rol': 'vendedor',
            'is_staff': True,
            'is_superuser': False,
        },
        {
            'email': 'cliente@mail.com',
            'password': 'cliente123',
            'nombre': 'Cliente',
            'apellido': 'Test',
            'rol': 'cliente',
            'is_staff': False,
            'is_superuser': False,
        },
        {
            'email': 'transportador@mail.com',
            'password': 'transportador123',
            'nombre': 'Transportador',
            'apellido': 'Test',
            'rol': 'transportador',
            'telefono': '1122334455',
            'is_staff': False,
            'is_superuser': False,
        },
    ]
    
    creados = 0
    for user_data in usuarios:
        email = user_data['email']
        if not User.objects.filter(email=email).exists():
            password = user_data.pop('password')
            User.objects.create_user(password=password, **user_data)
            print(f"✓ Usuario creado: {email} / {user_data.get('rol')}")
            creados += 1
    
    if creados == 0:
        print("[OK] Usuarios de desarrollo ya existen")
    
    return creados > 0


def main():
    """Punto de entrada principal."""
    print(f"[ENV] {'PRODUCCIÓN' if IS_PRODUCTION else 'DESARROLLO'}")
    
    if IS_PRODUCTION:
        crear_admin_produccion()
    else:
        crear_usuarios_desarrollo()


if __name__ == '__main__':
    main()

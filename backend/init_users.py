"""
Script para inicializar usuarios de prueba en la base de datos.
Crea un usuario por cada rol (admin, vendedor, cliente) solo si no existen.
Las credenciales se obtienen de variables de entorno para mayor seguridad.

IMPORTANTE: En producción, TODAS las credenciales deben estar en variables de entorno.
No se usan defaults en producción para evitar vulnerabilidades.
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

# Obtener credenciales de variables de entorno
# En PRODUCCIÓN: NO hay defaults - deben estar configuradas
# En DESARROLLO: Usar defaults solo para facilitar desarrollo local
if IS_PRODUCTION:
    # En producción, las credenciales son OBLIGATORIAS
    ADMIN_EMAIL = config('ADMIN_EMAIL')  # Sin default - falla si no existe
    ADMIN_PASSWORD = config('ADMIN_PASSWORD')  # Sin default - falla si no existe
    VENDEDOR_EMAIL = config('VENDEDOR_EMAIL', default=None)
    VENDEDOR_PASSWORD = config('VENDEDOR_PASSWORD', default=None)
    CLIENTE_EMAIL = config('CLIENTE_EMAIL', default=None)
    CLIENTE_PASSWORD = config('CLIENTE_PASSWORD', default=None)
else:
    # En desarrollo, usar defaults para facilitar testing
    ADMIN_EMAIL = config('ADMIN_EMAIL', default='admin@mail.com')
    ADMIN_PASSWORD = config('ADMIN_PASSWORD', default='admin123')
    VENDEDOR_EMAIL = config('VENDEDOR_EMAIL', default='vendedor@mail.com')
    VENDEDOR_PASSWORD = config('VENDEDOR_PASSWORD', default='vendedor123')
    CLIENTE_EMAIL = config('CLIENTE_EMAIL', default='cliente@mail.com')
    CLIENTE_PASSWORD = config('CLIENTE_PASSWORD', default='cliente123')

# Definir usuarios de prueba
USUARIOS_INICIALES = [
    {
        'email': ADMIN_EMAIL,
        'password': ADMIN_PASSWORD,
        'nombre': 'Admin',
        'apellido': 'Principal',
        'rol': 'admin',
        'is_staff': True,
        'is_superuser': True,
        'telefono': '+598 99 123 456',
        'direccion': 'Montevideo, Uruguay'
    },
    {
        'email': VENDEDOR_EMAIL,
        'password': VENDEDOR_PASSWORD,
        'nombre': 'Carlos',
        'apellido': 'Vendedor',
        'rol': 'vendedor',
        'is_staff': True,
        'is_superuser': False,
        'telefono': '+598 99 234 567',
        'direccion': 'Montevideo, Uruguay'
    },
    {
        'email': CLIENTE_EMAIL,
        'password': CLIENTE_PASSWORD,
        'nombre': 'María',
        'apellido': 'Cliente',
        'rol': 'cliente',
        'is_staff': False,
        'is_superuser': False,
        'telefono': '+598 99 345 678',
        'direccion': 'Montevideo, Uruguay'
    },
]

def crear_usuarios():
    """Crea usuarios de prueba solo si no existen."""
    # Validar que en producción al menos ADMIN tenga credenciales
    if IS_PRODUCTION:
        if not ADMIN_EMAIL or not ADMIN_PASSWORD:
            print("ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in production!")
            return False
    
    usuarios_creados = 0
    usuarios_existentes = 0
    
    for user_data in USUARIOS_INICIALES:
        email = user_data.get('email')
        password = user_data.get('password')
        
        # Saltar si no hay credenciales (solo en producción para usuarios opcionales)
        if not email or not password:
            if IS_PRODUCTION and user_data.get('rol') != 'admin':
                # En producción, vendedor y cliente son opcionales
                continue
            elif IS_PRODUCTION:
                # Admin es obligatorio en producción
                print(f"ERROR: Missing credentials for {user_data.get('rol', 'unknown')} user")
                return False
        
        if User.objects.filter(email=email).exists():
            usuarios_existentes += 1
        else:
            # Crear usuario sin exponer password en logs
            password_value = user_data.pop('password')
            user = User.objects.create_user(password=password_value, **user_data)
            usuarios_creados += 1
            if not IS_PRODUCTION:
                # Solo en desarrollo mostrar credenciales
                print(f"✓ Usuario creado: {email} ({user_data.get('rol', 'unknown')})")
    
    # Solo mostrar información si se crearon usuarios nuevos
    if usuarios_creados > 0:
        if IS_PRODUCTION:
            print(f"[INFO] {usuarios_creados} usuario(s) inicial(es) creado(s) (credenciales desde variables de entorno)")
        else:
            print(f"[INFO] {usuarios_creados} usuario(s) inicial(es) creado(s)")
    
    # Si todos los usuarios ya existen, no hacer nada (silencioso)
    if usuarios_existentes == len([u for u in USUARIOS_INICIALES if u.get('email') and u.get('password')]):
        return False  # Indica que no se crearon usuarios nuevos
    
    return True  # Indica que se crearon usuarios

if __name__ == '__main__':
    crear_usuarios()

"""
Script para inicializar usuarios de prueba en la base de datos.
Crea un usuario por cada rol (admin, vendedor, cliente).
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Definir usuarios de prueba
USUARIOS_INICIALES = [
    {
        'email': 'admin@eltetu.com',
        'password': 'admin123',
        'nombre': 'Admin',
        'apellido': 'Principal',
        'rol': 'admin',
        'is_staff': True,
        'is_superuser': True,
        'telefono': '+598 99 123 456',
        'direccion': 'Montevideo, Uruguay'
    },
    {
        'email': 'vendedor@eltetu.com',
        'password': 'vendedor123',
        'nombre': 'Carlos',
        'apellido': 'Vendedor',
        'rol': 'vendedor',
        'is_staff': True,
        'is_superuser': False,
        'telefono': '+598 99 234 567',
        'direccion': 'Montevideo, Uruguay'
    },
    {
        'email': 'cliente@eltetu.com',
        'password': 'cliente123',
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
    """Crea usuarios de prueba si no existen."""
    print("\n" + "="*60)
    print("INICIALIZANDO USUARIOS DE PRUEBA")
    print("="*60 + "\n")
    
    for user_data in USUARIOS_INICIALES:
        email = user_data['email']
        
        if User.objects.filter(email=email).exists():
            print(f"✓ Usuario ya existe: {email} ({user_data['rol']})")
        else:
            password = user_data.pop('password')
            user = User.objects.create_user(password=password, **user_data)
            print(f"✓ Usuario creado: {email} ({user_data['rol']})")
            print(f"  Password: {password}")
    
    print("\n" + "="*60)
    print("CREDENCIALES DE ACCESO")
    print("="*60)
    print("\n🔐 ADMINISTRADOR:")
    print("   Email: admin@eltetu.com")
    print("   Password: admin123")
    print("\n👔 VENDEDOR:")
    print("   Email: vendedor@eltetu.com")
    print("   Password: vendedor123")
    print("\n👤 CLIENTE:")
    print("   Email: cliente@eltetu.com")
    print("   Password: cliente123")
    print("\n" + "="*60 + "\n")

if __name__ == '__main__':
    crear_usuarios()

#!/bin/bash
set -e

echo "=== Starting Django Application ==="

# Validar SECRET_KEY en producción
if [ -z "$SECRET_KEY" ] && [ "${DEBUG:-False}" != "True" ]; then
  echo "ERROR: SECRET_KEY must be set in production!"
  exit 1
fi

# Validar conexión a la base de datos antes de continuar
echo "Checking database connection..."
python << EOF
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    print("✓ Database connection successful")
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
  echo "ERROR: Cannot connect to database. Exiting."
  exit 1
fi

# Ejecutar migraciones con timeout
# migrate es idempotente (no hace daño ejecutarlo múltiples veces)
echo "Running database migrations..."
timeout 300 python manage.py migrate --noinput || {
  echo "ERROR: Migrations failed or timed out"
  exit 1
}

# Recolectar archivos estáticos (sin --clear para evitar borrar todo cada vez)
# Solo usar --clear si STATICFILES_DIRS cambió o hay problemas
echo "Collecting static files..."
python manage.py collectstatic --noinput || {
  echo "WARNING: collectstatic failed, trying with --clear..."
  python manage.py collectstatic --noinput --clear || {
    echo "ERROR: collectstatic failed even with --clear"
    exit 1
  }
}

# Crear usuarios iniciales solo si la base de datos está vacía
# Verificar si ya hay usuarios en la BD
echo "Checking if initial users are needed..."
python << EOF
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

user_count = User.objects.count()
if user_count == 0:
    print("No users found, will create initial users")
    sys.exit(0)  # Exit code 0 = crear usuarios
else:
    print(f"Found {user_count} user(s), skipping initial user creation")
    sys.exit(1)  # Exit code 1 = no crear usuarios
EOF

if [ $? -eq 0 ]; then
  echo "Creating initial users..."
  python init_users.py || {
    echo "WARNING: Failed to create initial users, continuing anyway..."
  }
else
  echo "Skipping initial user creation (users already exist)"
fi

# Ensure PORT is set (Railway provides this, fallback to 8000)
export PORT=${PORT:-8000}

echo "Starting Gunicorn server on 0.0.0.0:$PORT..."
echo "Using configuration from gunicorn.conf.py"

# Usar configuración desde archivo
exec gunicorn config.wsgi:application -c gunicorn.conf.py

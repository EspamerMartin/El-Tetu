#!/bin/bash
set -e

echo "=== Ejecutando migraciones ==="
python manage.py migrate --noinput

echo "=== Recolectando archivos estáticos ==="
python manage.py collectstatic --noinput || true

echo "=== Inicializando usuarios ==="
python init_users.py

echo "=== Iniciando servidor ==="
export PORT=${PORT:-8000}
exec gunicorn config.wsgi:application -c gunicorn.conf.py

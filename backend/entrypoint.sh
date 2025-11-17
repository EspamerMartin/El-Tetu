#!/bin/bash
set -e

echo "=== Starting Django Application ==="

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Creating initial users..."
python init_users.py || echo "Users may already exist, continuing..."

# Ensure PORT is set (Railway provides this, fallback to 8000)
export PORT=${PORT:-8000}

echo "Starting Gunicorn server on 0.0.0.0:$PORT..."
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:$PORT \
  --workers 3 \
  --log-level info \
  --access-logfile - \
  --error-logfile -

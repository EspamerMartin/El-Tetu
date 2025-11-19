#!/bin/bash
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput || true

python << EOF
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth import get_user_model
if get_user_model().objects.count() == 0:
    import subprocess
    subprocess.run(['python', 'init_users.py'], check=False)
EOF

export PORT=${PORT:-8000}
exec gunicorn config.wsgi:application -c gunicorn.conf.py

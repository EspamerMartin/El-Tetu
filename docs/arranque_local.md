# Arranque local El-Tetu

## Backend (Django + DRF)

1. Crear `.env` en `backend/` (ejemplo):

```
SECRET_KEY=django-insecure-dev
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,10.0.2.2,192.168.0.0/16
CORS_ALLOWED_ORIGINS=http://localhost:19006,http://127.0.0.1:19006
DATABASE_URL=sqlite:///db.sqlite3
```

2. Instalar dependencias y migrar:

```
cd El-Tetu/backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

3. Endpoints base: `http://<HOST>:8000/api/`

## Mobile (Expo React Native)

1. Variables de entorno (archivo `.env` en `mobile/` o export en shell):

```
EXPO_PUBLIC_API_URL=http://<IP_LAN_DEL_HOST>:8000/api
```

2. Instalar dependencias con versiones compatibles del SDK de Expo:

```
cd El-Tetu/mobile
npm install
npx expo install
```

3. Ejecutar en desarrollo:

```
npm run start
```

Notas:
- En emulador Android, el backend local se alcanza por `http://10.0.2.2:8000/api` si no usas IP LAN.
- En dispositivo físico, usa la IP LAN del host (misma red Wi‑Fi) en `EXPO_PUBLIC_API_URL`.

## Despliegue (backend)

- Configurar `DEBUG=False`, `SECRET_KEY`, `ALLOWED_HOSTS` con dominio y `DATABASE_URL` (Postgres).
- Ejecutar `python manage.py collectstatic` y usar `gunicorn` con `whitenoise`.





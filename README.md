# El-Tetu - Plataforma B2B/B2C

Aplicación móvil de comercio B2B/B2C con backend Django y frontend React Native.

**Integrantes:**
* Molteni Baltazar
* Serra Facundo
* Espamer Martin

---

## 🏗️ Arquitectura

- **Backend:** Django 4.x + Django REST Framework + SimpleJWT
- **Base de datos:** PostgreSQL (Railway)
- **Frontend:** React Native (Expo + TypeScript)
- **Infraestructura:** Docker & docker-compose

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker & Docker Compose
- Node.js 18+ y npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Python 3.11+ (opcional, para desarrollo sin Docker)

### 1. Configuración del Backend

```bash
# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL (Railway)

# Levantar servicios con Docker
docker-compose up -d

# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Cargar datos iniciales (opcional)
docker-compose exec backend python manage.py loaddata initial_data
```

El backend estará disponible en `http://localhost:8000`

### 2. Configuración del Frontend

```bash
cd mobile

# Instalar dependencias
npm install

# Configurar API endpoint
# Editar mobile/.env con la URL del backend

# Iniciar Expo
npm start

# Escanear QR con Expo Go o usar emulador
```

## 🔑 Usuarios de Prueba

Después de ejecutar `loaddata initial_data`:

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@mail.com | admin123 |
| Vendedor | vendedor@mail.com | vendedor123 |
| Cliente | cliente@mail.com | cliente123 |

## 🛠️ Stack Tecnológico

### Backend
- Django 4.2
- Django REST Framework 3.14
- djangorestframework-simplejwt
- psycopg2-binary
- django-cors-headers
- python-decouple
- gunicorn
- whitenoise

### Frontend
- React Native (Expo SDK 49)
- TypeScript
- React Navigation
- Redux Toolkit
- Axios
- React Native Paper
- Expo AsyncStorage
  
## 📄 Licencia

Propietario - El-Tetu © 2025

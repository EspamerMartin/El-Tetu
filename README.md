# El-Tetu - Punto de Venta B2B/B2C

Sistema de punto de venta desarrollado con Django REST Framework y React Native (Expo), desplegado en Railway con PostgreSQL.

**Integrantes:**
- Molteni Baltazar
- Serra Facundo
- Espamer Martin

---

## 🏗️ Arquitectura

- **Backend:** Django 4.2 + Django REST Framework + SimpleJWT
- **Base de datos:** PostgreSQL (Railway) / SQLite (desarrollo local)
- **Frontend:** React Native (Expo SDK 49) + TypeScript
- **Infraestructura:** Docker & docker-compose
- **Deploy:** Railway

---

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

# Editar .env con tus credenciales

# Levantar servicios con Docker
docker-compose up -d

# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Cargar datos desde Excel (opcional)
# Colocar datos.xlsx en backend/ y ejecutar:
docker-compose exec backend python load_datos_excel.py
```

**Sin Docker (Windows):**
```bash
cd backend
start_backend.bat
```

El backend estará disponible en `http://localhost:8000`

### 2. Configuración del Frontend

```bash
cd mobile

# Instalar dependencias
npm install

# Configurar API endpoint
# Crear mobile/.env con:
# EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:8000/api

# Iniciar Expo
npm start

# Escanear QR con Expo Go o usar emulador
```

**⚠️ Importante:** El backend debe ejecutarse en `0.0.0.0:8000` (no `127.0.0.1`) para que la app móvil pueda conectarse desde la red local.

---

## 🔑 Usuarios de Prueba

Después de ejecutar `init_users.py` o `loaddata initial_data`:

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@mail.com | admin123 |
| Vendedor | vendedor@mail.com | vendedor123 |
| Cliente | cliente@mail.com | cliente123 |

---

## 📊 Carga de Datos desde Excel

El sistema permite cargar productos, marcas, categorías y precios desde un archivo Excel (`datos.xlsx`):

### Estructura del Excel

**Sheet1:**
- Columnas requeridas: `Marca`, `Categoria`, `Subcategoria`, `Nombre`, `Cod. Barras`, etc.
- El script crea automáticamente marcas, categorías y subcategorías únicas
- Los productos se vinculan por código de barras

**Hoja 'Precios':**
- Columnas: `Cod. Barras`, `Lista 4`
- Los precios se actualizan por código de barras
- Productos sin precio en esta hoja reciben `precio_base = 1`

### Ejecución

```bash
# Colocar datos.xlsx en backend/
cd backend
python load_datos_excel.py
```

El script se ejecuta automáticamente al iniciar el backend con `start_backend.bat`.

---

## 🛠️ Stack Tecnológico

### Backend
- Django 4.2
- Django REST Framework 3.14
- djangorestframework-simplejwt
- psycopg2-binary (PostgreSQL)
- django-cors-headers
- python-decouple
- gunicorn
- whitenoise
- pandas & openpyxl (carga de Excel)

### Frontend
- React Native (Expo SDK 49)
- TypeScript
- React Navigation 6
- Redux Toolkit + Redux Persist
- Axios
- React Native Paper
- Expo AsyncStorage

---

## 📁 Estructura del Proyecto

```
El-Tetu/
├── backend/
│   ├── apps/
│   │   ├── users/          # Autenticación y usuarios
│   │   ├── productos/      # Catálogo de productos
│   │   ├── pedidos/        # Gestión de pedidos
│   │   └── informacion/    # Información general
│   ├── config/             # Configuración Django
│   ├── load_datos_excel.py # Script de carga de Excel
│   ├── init_users.py       # Script de usuarios iniciales
│   ├── requirements.txt
│   └── Dockerfile
├── mobile/
│   ├── src/
│   │   ├── navigation/     # React Navigation
│   │   ├── screens/        # Pantallas por rol
│   │   ├── components/    # Componentes reutilizables
│   │   ├── store/          # Redux Toolkit
│   │   ├── services/api/   # Axios y métodos API
│   │   ├── types/          # TypeScript types
│   │   └── theme/           # Estilos y tema
│   └── package.json
└── docker-compose.yml
```

---

## 🔌 Endpoints Principales

### Autenticación
- `POST /api/auth/register/` - Registro de usuario
- `POST /api/auth/login/` - Login (retorna access + refresh tokens)
- `POST /api/auth/refresh/` - Renovar access token
- `GET /api/auth/me/` - Obtener usuario autenticado
- `PUT /api/auth/profile/` - Actualizar perfil
- `POST /api/auth/change-password/` - Cambiar contraseña

### Productos
- `GET /api/productos/` - Listar productos (con filtros: `categoria`, `activo`, `search`, etc.)
- `GET /api/productos/{id}/` - Detalle de producto
- `POST /api/productos/` - Crear producto (admin)
- `PUT /api/productos/{id}/` - Actualizar producto (admin)
- `DELETE /api/productos/{id}/` - Eliminar producto (admin)
- `GET /api/productos/categorias/` - Listar categorías
- `GET /api/productos/subcategorias/` - Listar subcategorías

### Pedidos
- `GET /api/pedidos/` - Listar pedidos (filtros: `estado`, `cliente`, `mine=true`)
- `POST /api/pedidos/` - Crear pedido
- `GET /api/pedidos/{id}/` - Detalle de pedido
- `PUT /api/pedidos/{id}/estado/` - Actualizar estado (vendedor/admin)
- `GET /api/pedidos/{id}/pdf/` - Exportar comprobante PDF

### Usuarios (Admin/Vendedor)
- `GET /api/auth/users/` - Listar usuarios (filtros: `rol`, `search`)
- `POST /api/auth/users/` - Crear usuario (admin)
- `GET /api/auth/users/{id}/` - Detalle usuario
- `PUT /api/auth/users/{id}/` - Actualizar usuario (admin)

---

## 🚢 Deploy a Railway

### 1. Preparación

1. Conectar repositorio en Railway
2. Crear servicio PostgreSQL
3. Configurar variables de entorno:
   ```
   SECRET_KEY=<generar-con-comando-abajo>
   DEBUG=False
   ALLOWED_HOSTS=*.railway.app
   DATABASE_URL=<auto-provisionado>
   CORS_ALLOWED_ORIGINS=https://tu-app.railway.app
   ```

### 2. Generar SECRET_KEY

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Deploy

Railway detectará automáticamente el Dockerfile. Después del deploy:

```bash
# Ejecutar migraciones
railway run python manage.py migrate

# Crear superusuario
railway run python manage.py createsuperuser
```

### 4. Configurar Mobile App

Actualizar `mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://tu-app.railway.app/api
```

---

## 🔐 Seguridad

- Passwords hasheadas con Django's `make_password()`
- Autenticación JWT con SimpleJWT (access + refresh tokens)
- CORS configurado para desarrollo y producción
- Variables sensibles en `.env`
- Permisos por rol (admin, vendedor, cliente)
- SQL injection prevention (Django ORM)

---

## 📱 Navegación Mobile

La app tiene 3 roles con navegación diferenciada:

- **Cliente:** Bottom Tabs (Inicio, Catálogo, Carrito, Pedidos, Perfil)
- **Vendedor:** Drawer (Dashboard, Clientes, Pedidos, Nuevo Pedido, Perfil)
- **Admin:** Drawer (Dashboard, Productos, Categorías, Pedidos, Usuarios, Promociones, Perfil)

---

## 🧪 Comandos Útiles

### Backend
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Shell interactivo
python manage.py shell

# Colectar archivos estáticos
python manage.py collectstatic

# Crear superusuario
python manage.py createsuperuser
```

### Frontend
```bash
# Verificar tipos TypeScript
npm run tsc

# Limpiar caché
expo start -c

# Build para Android
expo build:android

# Build para iOS
expo build:ios
```

---

## 🐛 Troubleshooting

### La app no se conecta al backend
- Verificar que el backend esté corriendo en `0.0.0.0:8000`
- Asegurarse de usar IP local en `.env`, no `localhost`
- Verificar CORS en `settings.py`

### Error de autenticación
- Limpiar AsyncStorage: desinstalar y reinstalar la app
- Verificar que los tokens sean válidos en el backend

### Productos no se muestran
- Verificar que existan productos activos en el backend
- Revisar la consola de Expo para errores de API

---

## 📄 Licencia

Propietario - El-Tetu © 2025

---

## 📚 Documentación Adicional

Para más detalles sobre:
- **API completa:** Ver código fuente en `backend/apps/*/views.py` y `backend/apps/*/serializers.py`
- **Modelos de datos:** Ver `backend/apps/*/models.py`
- **Navegación mobile:** Ver `mobile/src/navigation/`

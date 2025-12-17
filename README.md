# El-Tetu - Punto de Venta B2B/B2C

Sistema de punto de venta desarrollado con Django REST Framework y React Native (Expo), desplegado en Railway con PostgreSQL.

**Integrantes:**
- Molteni Baltazar
- Serra Facundo
- Espamer Martin
  

Video Muestra youtube: "https://youtu.be/2tnhd32hF-U"
---

## 🏗️ Arquitectura

- **Backend:** Django 4.2 + Django REST Framework + SimpleJWT
- **Base de datos:** PostgreSQL (Railway) / SQLite (desarrollo local)
- **Frontend:** React Native (Expo SDK 54) + TypeScript
- **Infraestructura:** Docker & docker-compose
- **Deploy:** Railway

---

## 🔑 Usuarios

### En Desarrollo (local)

Se crean automáticamente al ejecutar `python init_users.py`:

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@mail.com | admin123 |
| Vendedor | vendedor@mail.com | vendedor123 |
| Cliente | cliente@mail.com | cliente123 |

### En Producción (Railway)

**⚠️ IMPORTANTE:** Los usuarios de prueba NO se crean en producción.

Debes configurar estas variables de entorno en Railway:

| Variable | Descripción |
|----------|-------------|
| `ADMIN_EMAIL` | Email del administrador |
| `ADMIN_PASSWORD` | Contraseña del administrador |

El admin se crea automáticamente en el deploy si estas variables están configuradas.

**Para acceder al panel de Django Admin:**
```
https://tu-app.railway.app/admin/
```

---

## 📊 Carga de Datos

El sistema permite cargar productos desde un archivo CSV (`datos.csv`):

### Estructura del CSV

Columnas requeridas:
- `categoria`, `subcategoria`, `marca`
- `decripcionproducto` (nombre del producto)
- `tamano`, `unidaddetamano`, `unidadescaja`
- `precio_base`, `codigodebarra`, `imagen`

### Generación de SQL

```bash
cd backend
python generar_productos_sql.py
```

Esto genera un archivo `datos.sql` con los INSERT statements para PostgreSQL.

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
- React Native (Expo SDK 54)
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
│   ├── generar_productos_sql.py # Script de generación SQL desde CSV
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
- `POST /api/auth/login/` - Login (retorna access + refresh tokens)
- `POST /api/auth/refresh/` - Renovar access token
- `GET /api/auth/me/` - Obtener usuario autenticado
- `PUT /api/auth/profile/` - Actualizar perfil
- `POST /api/auth/change-password/` - Cambiar contraseña

### Productos
- `GET /api/productos/` - Listar todos los productos sin paginación (con filtros: `categoria`, `activo`, `search`, etc.)
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
- `GET /api/auth/users/` - Listar usuarios (filtros: `rol`, `search`, `zona`)
- `POST /api/auth/users/` - Crear usuario (admin)
- `GET /api/auth/users/{id}/` - Detalle usuario
- `PUT /api/auth/users/{id}/` - Actualizar usuario (admin)

### Zonas (Admin)
- `GET /api/auth/zonas/` - Listar zonas
- `POST /api/auth/zonas/` - Crear zona (admin)
- `PUT /api/auth/zonas/{id}/` - Actualizar zona (admin)
- `DELETE /api/auth/zonas/{id}/` - Eliminar zona (admin)

---

## 🚢 Deploy a Railway

### 1. Preparación

1. Conectar repositorio en Railway
2. Crear servicio PostgreSQL
3. Configurar variables de entorno:

| Variable | Valor | Obligatorio |
|----------|-------|-------------|
| `SECRET_KEY` | Generar con comando abajo | ✅ |
| `DEBUG` | `False` | ✅ |
| `ALLOWED_HOSTS` | `*.railway.app` | ✅ |
| `DATABASE_URL` | Auto-provisionado por Railway | ✅ |
| `CORS_ALLOWED_ORIGINS` | `https://tu-app.railway.app` | ✅ |
| `ADMIN_EMAIL` | Email del admin | ✅ |
| `ADMIN_PASSWORD` | Contraseña segura | ✅ |

### 2. Generar SECRET_KEY

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Deploy

Railway detectará automáticamente el Dockerfile. El deploy ejecutará:
1. Migraciones automáticas
2. Collectstatic
3. Creación del usuario admin (si `ADMIN_EMAIL` y `ADMIN_PASSWORD` están configurados)

**Panel de administración:** `https://tu-app.railway.app/admin/`

### 4. Configurar Mobile App

La app móvil está configurada para usar la URL de producción por defecto en `mobile/app.config.js`. Para builds de producción, la URL se configura automáticamente desde `mobile/eas.json`.

---

## 🔐 Seguridad

- Passwords hasheadas con Django's `make_password()`
- Autenticación JWT con SimpleJWT (access + refresh tokens)
- CORS configurado para desarrollo y producción
- Variables sensibles en `.env`
- Permisos por rol (admin, vendedor, cliente)
- SQL injection prevention (Django ORM)

### ⏰ Configuración de Tokens JWT

**Por defecto, los tokens están configurados para NO expirar** (365 días access / 10 años refresh) para facilitar el desarrollo y testing.

Para configurar expiración en producción, agregar estas variables de entorno:

| Variable | Descripción | Valor recomendado producción |
|----------|-------------|------------------------------|
| `JWT_ACCESS_TOKEN_LIFETIME_DAYS` | Duración del access token en días | `1` (o usar minutos) |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Duración del refresh token en días | `7` |

**Ejemplo para producción con expiración normal:**
```bash
JWT_ACCESS_TOKEN_LIFETIME_DAYS=1
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

> ⚠️ **Nota:** Si no se configuran estas variables, los tokens durarán 365 días / 10 años respectivamente.

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

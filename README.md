# El-Tetu - Plataforma B2B/B2C

Aplicación móvil de comercio B2B/B2C con backend Django y frontend React Native.

**Integrantes:**
* Molteni Baltazar
* Serra Facundo
* Espamer Martin

---

## 📊 Estado del Proyecto

**Fase 4 - Frontend Mobile:** ✅ **100% COMPLETADO**

- **Pantallas implementadas:** 19/19
- **Módulos:** Cliente (7), Vendedor (6), Admin (10)
- **Líneas de código:** ~3,500+ TypeScript/TSX
- **Ver resumen completo:** [RESUMEN_FASE4.md](RESUMEN_FASE4.md)
- **Progreso detallado:** [PROGRESS.md](PROGRESS.md)

## 🏗️ Arquitectura

- **Backend:** Django 4.x + Django REST Framework + SimpleJWT
- **Base de datos:** PostgreSQL (Railway)
- **Frontend:** React Native (Expo + TypeScript)
- **Infraestructura:** Docker & docker-compose

## 📁 Estructura del Proyecto

```
El-Tetu/
├── backend/          # API Django REST Framework
├── mobile/           # App React Native (Expo)
├── docs/             # Documentación técnica
├── docker-compose.yml
├── .env.example
└── README.md
```

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
| Admin | admin@eltetu.com | admin123 |
| Vendedor | vendedor@eltetu.com | vendedor123 |
| Cliente | cliente@eltetu.com | cliente123 |

## 📚 Documentación

- [Contrato de API](docs/contract.md) - Endpoints y modelos
- [Rutas de Navegación](docs/rutas_mapping.md) - Estructura de la app móvil
- [Supuestos Técnicos](docs/assumptions.md) - Decisiones de diseño
- [Checklist de Entregables](docs/deliverables_checklist.md) - Estado del proyecto

## 🔧 Desarrollo

### Backend

```bash
# Logs
docker-compose logs -f backend

# Shell Django
docker-compose exec backend python manage.py shell

# Crear nueva app
docker-compose exec backend python manage.py startapp nombre_app
```

### Frontend

```bash
cd mobile

# Ejecutar en iOS
npm run ios

# Ejecutar en Android
npm run android

# Ejecutar en web
npm run web

# TypeScript check
npm run tsc
```

## 🚢 Deploy a Railway

### Backend + PostgreSQL

1. Crear proyecto en Railway
2. Agregar servicio PostgreSQL
3. Conectar repositorio GitHub
4. Configurar variables de entorno en Railway:
   ```
   DATABASE_URL=postgresql://...
   SECRET_KEY=tu-secret-key-seguro
   DEBUG=False
   ALLOWED_HOSTS=*.railway.app
   ```
5. Railway detectará automáticamente el Dockerfile
6. Deploy automático en cada push a `main`

### Frontend

La app móvil se distribuye mediante:
- **iOS:** App Store (requiere cuenta de desarrollador)
- **Android:** Google Play Store o APK directo
- **Expo:** `expo build:android` / `expo build:ios`

Ver [documentación de Expo](https://docs.expo.dev/distribution/introduction/) para más detalles.

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

## 📝 Funcionalidades

### ✅ Autenticación
- Registro de usuarios (Admin, Vendedor, Cliente)
- Login con JWT (access + refresh tokens)
- Protección de rutas por rol

### ✅ Módulo Cliente (7 pantallas)
- Dashboard con productos destacados
- Catálogo completo con filtros categoría/subcategoría
- Detalle de producto + agregar al carrito
- Carrito de compras con edición de cantidades
- Historial de pedidos con estados
- Detalle de pedido + descarga PDF
- Edición de perfil

### ✅ Módulo Vendedor (6 pantallas)
- Dashboard con KPIs (clientes, pedidos, ventas del mes)
- Lista de clientes asignados con búsqueda
- Detalle del cliente + historial de pedidos
- Todos los pedidos con filtros por estado (6 estados)
- Detalle de pedido + cambiar estado
- Nuevo pedido en 3 pasos (cliente → productos → confirmar)

### ✅ Módulo Admin (10 pantallas) ✨ NUEVO
- **Dashboard Global:** 4 KPIs (usuarios, productos activos, pedidos del mes, ventas del mes)
- **CRUD Usuarios:** Lista con búsqueda + formulario (6 campos + activo)
- **CRUD Productos:** Lista con búsqueda + formulario (7 campos + activo)
- **CRUD Categorías:** Lista con Dialog inline para crear/editar
- **CRUD Promociones:** Lista con búsqueda + formulario (tipo, descuento %, activo)
- **Configuraciones:** Ajustes globales del comercio + preferencias + info del sistema
- **Todos los Pedidos:** Vista global con filtros por estado (admin view)

### ✅ Gestión de Pedidos
- Crear pedido con múltiples items
- Aplicación automática de promociones
- Estados: Pendiente, Confirmado, En Camino, Entregado, Cancelado
- Control de stock
- Cambio de estado por vendedor/admin

### ✅ Promociones
- Caja cerrada (descuento por cantidad exacta)
- Combinables (descuento por familia de productos)
- Gestión CRUD por admin

## 🔐 Seguridad

- Passwords hasheadas con Django's `make_password`
- JWT con refresh tokens
- CORS configurado
- Variables sensibles en `.env`
- SQL injection prevention (Django ORM)
- Rate limiting (futuro)

## 🎯 Roadmap

- [ ] Sistema de notificaciones push
- [ ] Integración de pagos (Stripe/MercadoPago)
- [ ] Chat vendedor-cliente
- [ ] Dashboard analytics
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Sistema de trazabilidad avanzado
- [ ] Tests unitarios y de integración
- [ ] CI/CD con GitHub Actions

## 📄 Licencia

Propietario - El-Tetu © 2025

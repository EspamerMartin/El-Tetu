# 🔌 Guía de Integración Backend - El-Tetu

## Fecha: 27 de Octubre, 2025
## Estado: ✅ Integración Completa

---

## 📋 Resumen

Esta guía documenta la integración completa entre el frontend móvil React Native y el backend Django REST Framework.

---

## 🚀 Configuración Inicial

### 1. Variables de Entorno

**Backend (.env):**
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,*.railway.app
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CORS_ALLOWED_ORIGINS=http://localhost:19006,exp://192.168.1.xxx:19000
```

**Frontend (mobile/.env):**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.xxx:8000/api
```

> **Nota:** Reemplaza `192.168.1.xxx` con tu IP local o dominio de Railway.

---

## 🔐 Autenticación JWT

### Flow de Autenticación

```
1. Usuario → Login (email + password)
2. Backend → Valida credenciales
3. Backend → Genera JWT (access + refresh)
4. Frontend → Guarda tokens en AsyncStorage
5. Frontend → Incluye Bearer token en todas las requests
6. Si 401 → Auto-refresh token → Reintentar request
7. Si refresh falla → Logout automático
```

### Endpoints de Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Registro de nuevos usuarios |
| POST | `/api/auth/login/` | Login y obtención de tokens |
| POST | `/api/auth/refresh/` | Renovar access token |
| GET | `/api/auth/me/` | Datos del usuario autenticado |
| PUT | `/api/auth/profile/` | Actualizar perfil |
| POST | `/api/auth/change-password/` | Cambiar contraseña |

### Ejemplo de Request Autenticada

```typescript
// El interceptor agrega automáticamente el token
const productos = await productosAPI.getAll();

// Headers enviados:
// Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 📦 Endpoints CRUD Completos

### Productos

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| GET | `/api/productos/` | Autenticado | Lista paginada de productos |
| POST | `/api/productos/` | Admin | Crear producto |
| GET | `/api/productos/{id}/` | Autenticado | Detalle de producto |
| PUT | `/api/productos/{id}/` | Admin | Actualizar producto |
| DELETE | `/api/productos/{id}/` | Admin | Eliminar producto |

**Filtros disponibles:**
- `?categoria=1` - Filtrar por categoría
- `?subcategoria=2` - Filtrar por subcategoría
- `?search=arroz` - Búsqueda por nombre/código
- `?activo=true` - Solo productos activos
- `?disponible=true` - Solo con stock disponible
- `?page=2` - Paginación

### Categorías

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| GET | `/api/productos/categorias/` | Autenticado | Lista de categorías |
| POST | `/api/productos/categorias/` | Admin | Crear categoría |
| GET | `/api/productos/categorias/{id}/` | Autenticado | Detalle categoría |
| PUT | `/api/productos/categorias/{id}/` | Admin | Actualizar categoría |
| DELETE | `/api/productos/categorias/{id}/` | Admin | Eliminar categoría |

### Subcategorías

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| GET | `/api/productos/subcategorias/` | Autenticado | Lista de subcategorías |
| POST | `/api/productos/subcategorias/` | Admin | Crear subcategoría |
| GET | `/api/productos/subcategorias/{id}/` | Autenticado | Detalle subcategoría |
| PUT | `/api/productos/subcategorias/{id}/` | Admin | Actualizar subcategoría |
| DELETE | `/api/productos/subcategorias/{id}/` | Admin | Eliminar subcategoría |

**Filtros:**
- `?categoria=1` - Subcategorías de una categoría

### Pedidos

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| GET | `/api/pedidos/` | Autenticado | Lista paginada de pedidos |
| POST | `/api/pedidos/` | Autenticado | Crear pedido |
| GET | `/api/pedidos/{id}/` | Autenticado | Detalle de pedido |
| PUT | `/api/pedidos/{id}/estado/` | Vendedor/Admin | Actualizar estado |
| GET | `/api/pedidos/{id}/pdf/` | Autenticado | Exportar a PDF |

**Filtros:**
- `?mine=true` - Solo mis pedidos (cliente)
- `?estado=PENDIENTE` - Filtrar por estado
- `?cliente=5` - Pedidos de un cliente (vendedor/admin)
- `?page=2` - Paginación

### Promociones

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| GET | `/api/promociones/` | Autenticado | Lista de promociones |
| POST | `/api/promociones/` | Admin | Crear promoción |
| GET | `/api/promociones/{id}/` | Autenticado | Detalle promoción |
| PUT | `/api/promociones/{id}/` | Admin | Actualizar promoción |
| DELETE | `/api/promociones/{id}/` | Admin | Eliminar promoción |

### Usuarios (Admin)

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| GET | `/api/auth/users/` | Admin/Vendedor | Lista paginada de usuarios |
| POST | `/api/auth/users/` | Admin | Crear usuario |
| GET | `/api/auth/users/{id}/` | Admin/Vendedor | Detalle usuario |
| PUT | `/api/auth/users/{id}/` | Admin | Actualizar usuario |
| DELETE | `/api/auth/users/{id}/` | Admin | Eliminar usuario |

**Filtros:**
- `?search=juan` - Búsqueda por nombre/email
- `?rol=cliente` - Filtrar por rol
- `?page=2` - Paginación

---

## 📊 Estructura de Respuestas

### Respuesta Paginada (DRF Standard)

```json
{
  "count": 150,
  "next": "http://api.example.com/productos/?page=3",
  "previous": "http://api.example.com/productos/?page=1",
  "results": [
    { "id": 1, "nombre": "Producto 1", ... },
    { "id": 2, "nombre": "Producto 2", ... }
  ]
}
```

### Respuesta de Autenticación

```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "nombre": "Admin",
    "apellido": "Sistema",
    "rol": "admin",
    "is_active": true
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Respuesta de Error

```json
{
  "error": "Credenciales inválidas."
}
```

---

## 🎯 Flujos End-to-End

### 1. Flujo de Registro y Login

```
Usuario → RegisterScreen → POST /api/auth/register
       ← { user, access, refresh }
       → Guardar en AsyncStorage
       → Navegar a ClienteStack/VendedorStack/AdminStack
```

### 2. Flujo de Compra (Cliente)

```
1. CatalogoScreen → GET /api/productos/?page=1
2. Seleccionar producto → ProductoDetalleScreen
3. Agregar al carrito → Redux (cartSlice)
4. CarritoScreen → Confirmar pedido
5. POST /api/pedidos/ { cliente_id, items: [...] }
6. ← Pedido creado { id: 123, estado: 'PENDIENTE', total: 5000 }
7. MisPedidosScreen → GET /api/pedidos/?mine=true
```

### 3. Flujo de Gestión de Pedidos (Vendedor)

```
1. PedidosListScreen → GET /api/pedidos/?estado=PENDIENTE
2. Seleccionar pedido → PedidoDetalleScreen
3. Cambiar estado → PUT /api/pedidos/123/estado/ { estado: 'CONFIRMADO' }
4. ← Pedido actualizado
5. Refetch → Actualizar lista
```

### 4. Flujo CRUD Productos (Admin)

```
1. ProductosListScreen → GET /api/productos/
2. Crear producto → ProductoFormScreen
3. POST /api/productos/ { nombre, codigo, stock, precio_lista_3, ... }
4. ← Producto creado
5. Editar → ProductoFormScreen (edit mode)
6. PUT /api/productos/456/ { stock: 100 }
7. Eliminar → Alert.alert → DELETE /api/productos/456/
```

---

## 🔒 Permisos por Rol

| Endpoint | Cliente | Vendedor | Admin |
|----------|---------|----------|-------|
| GET /productos | ✅ | ✅ | ✅ |
| POST /productos | ❌ | ❌ | ✅ |
| POST /pedidos | ✅ | ✅ | ✅ |
| PUT /pedidos/estado | ❌ | ✅ | ✅ |
| GET /users | ❌ | ✅ (limitado) | ✅ |
| POST /users | ❌ | ❌ | ✅ |
| DELETE /productos | ❌ | ❌ | ✅ |

---

## 🧪 Testing de Integración

### Comandos de Testing

```bash
# Backend (Django)
cd backend
python manage.py test

# Frontend (React Native)
cd mobile
npm test

# E2E Manual
1. Iniciar backend: python manage.py runserver
2. Crear superuser: python manage.py createsuperuser
3. Iniciar mobile: npm start
4. Login como admin → Probar CRUD completo
5. Login como vendedor → Probar gestión pedidos
6. Login como cliente → Probar flujo compra
```

### Checklist de Testing

- [ ] Login con credenciales válidas
- [ ] Login con credenciales inválidas (error 401)
- [ ] Refresh token automático después de 5 minutos
- [ ] Crear producto (admin)
- [ ] Editar producto (admin)
- [ ] Eliminar producto (admin)
- [ ] Ver catálogo (todos los roles)
- [ ] Filtrar productos por categoría
- [ ] Buscar productos por nombre
- [ ] Agregar al carrito
- [ ] Crear pedido
- [ ] Ver mis pedidos (cliente)
- [ ] Actualizar estado de pedido (vendedor)
- [ ] Ver todos los pedidos (admin)
- [ ] Exportar pedido a PDF
- [ ] Crear usuario (admin)
- [ ] Editar usuario (admin)
- [ ] Cerrar sesión (logout)

---

## 🚀 Deploy a Railway

### 1. Backend

```bash
# Railway detecta automáticamente Django
railway login
railway link
railway up

# Ejecutar migraciones
railway run python manage.py migrate

# Crear superuser
railway run python manage.py createsuperuser

# Variables de entorno en Railway:
# - SECRET_KEY
# - DATABASE_URL (auto-provisionado)
# - ALLOWED_HOSTS
# - CORS_ALLOWED_ORIGINS
```

### 2. Frontend

```bash
# Actualizar .env con URL de Railway
EXPO_PUBLIC_API_URL=https://tu-app.railway.app/api

# Build
npm run build

# Publicar en Expo
expo publish
```

---

## 🐛 Troubleshooting

### Error: "Network request failed"
- Verificar que backend esté corriendo
- Verificar IP local en EXPO_PUBLIC_API_URL
- Verificar CORS en settings.py

### Error: 401 Unauthorized
- Verificar que token esté guardado en AsyncStorage
- Verificar formato del header: `Bearer <token>`
- Revisar expiración del token (5 minutos access, 1 día refresh)

### Error: "Cannot connect to database"
- Verificar DATABASE_URL en .env
- Verificar que PostgreSQL esté corriendo
- En Railway, verificar que addon esté provisionado

### Productos no aparecen en catálogo
- Verificar filtro `activo=True` en request
- Verificar stock > 0 si filtro `disponible=True`
- Revisar permisos del usuario

---

## 📚 Recursos

- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [SimpleJWT Docs](https://django-rest-framework-simplejwt.readthedocs.io/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Docs](https://docs.expo.dev/)
- [Railway Docs](https://docs.railway.app/)

---

**Última actualización:** 27 de Octubre, 2025  
**Autor:** Equipo El-Tetu  
**Estado:** ✅ Integración Completa

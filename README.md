# El-Tetu - Punto de Venta B2B/B2C

Sistema de punto de venta desarrollado con Django REST Framework y React Native (Expo), desplegado en Railway con PostgreSQL.

**Integrantes:**
- Molteni Baltazar
- Serra Facundo
- Espamer Martin

---

## 🏗️ Arquitectura

- **Backend:** Django 5.2 + Django REST Framework + SimpleJWT
- **Base de datos:** PostgreSQL (Railway) / SQLite (desarrollo local)
- **Frontend:** React Native (Expo SDK 54) + TypeScript
- **Infraestructura:** Docker & docker-compose
- **Deploy:** Railway

---

## 🔑 Usuarios de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@mail.com | admin123 |
| Vendedor | vendedor@mail.com | vendedor123 |
| Cliente | cliente@mail.com | cliente123 |

---

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
- `GET /api/auth/users/` - Listar usuarios (filtros: `rol`, `search`)
- `POST /api/auth/users/` - Crear usuario (admin)
- `GET /api/auth/users/{id}/` - Detalle usuario
- `PUT /api/auth/users/{id}/` - Actualizar usuario (admin)

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

## 📄 Licencia

Propietario - El-Tetu © 2025

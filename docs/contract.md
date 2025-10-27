# Contrato de API - El-Tetu

Este documento describe todos los endpoints, modelos y ejemplos de la API REST de El-Tetu.

## Base URL

- **Desarrollo:** `http://localhost:8000/api`
- **Producción:** `https://tu-app.railway.app/api`

## Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación.

### Headers requeridos

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación-auth)
2. [Usuarios](#usuarios)
3. [Productos](#productos)
4. [Categorías y Subcategorías](#categorías-y-subcategorías)
5. [Pedidos](#pedidos)
6. [Promociones](#promociones)
7. [Información General](#información-general)
8. [Códigos de Estado](#códigos-de-estado)

---

## Autenticación (`/auth`)

### Registro de Usuario

**POST** `/api/auth/register/`

Crea un nuevo usuario en el sistema.

**Body:**
```json
{
  "email": "cliente@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "rol": "cliente",
  "telefono": "+54911234567",
  "direccion": "Calle Falsa 123, CABA"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": 1,
    "email": "cliente@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "full_name": "Juan Pérez",
    "rol": "cliente",
    "telefono": "+54911234567",
    "direccion": "Calle Falsa 123, CABA",
    "is_active": true,
    "date_joined": "2025-10-26T10:30:00Z"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Login

**POST** `/api/auth/login/`

Autentica un usuario y retorna tokens JWT.

**Body:**
```json
{
  "email": "cliente@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "cliente@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "full_name": "Juan Pérez",
    "rol": "cliente",
    "telefono": "+54911234567",
    "direccion": "Calle Falsa 123, CABA",
    "is_active": true,
    "date_joined": "2025-10-26T10:30:00Z"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Renovar Token

**POST** `/api/auth/refresh/`

Renueva el access token usando el refresh token.

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Usuario Actual

**GET** `/api/auth/me/`

Obtiene los datos del usuario autenticado.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "cliente@example.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "full_name": "Juan Pérez",
  "rol": "cliente",
  "telefono": "+54911234567",
  "direccion": "Calle Falsa 123, CABA",
  "is_active": true,
  "date_joined": "2025-10-26T10:30:00Z"
}
```

---

### Actualizar Perfil

**PUT** `/api/auth/profile/`

Actualiza el perfil del usuario autenticado.

**Body:**
```json
{
  "nombre": "Juan Carlos",
  "telefono": "+54911111111",
  "direccion": "Nueva Dirección 456"
}
```

**Response:** `200 OK`

---

### Cambiar Contraseña

**POST** `/api/auth/change-password/`

Cambia la contraseña del usuario autenticado.

**Body:**
```json
{
  "old_password": "password123",
  "new_password": "newpassword456",
  "new_password_confirm": "newpassword456"
}
```

**Response:** `200 OK`
```json
{
  "message": "Contraseña actualizada exitosamente."
}
```

---

## Usuarios

### Listar Usuarios (Admin)

**GET** `/api/auth/users/`

Lista todos los usuarios (solo admin).

**Query Params:**
- `rol`: Filtrar por rol (`admin`, `vendedor`, `cliente`)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "email": "cliente@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "full_name": "Juan Pérez",
    "rol": "cliente",
    "telefono": "+54911234567",
    "direccion": "Calle Falsa 123",
    "is_active": true,
    "date_joined": "2025-10-26T10:30:00Z"
  }
]
```

---

## Productos

### Listar Productos

**GET** `/api/productos/`

Lista todos los productos del catálogo.

**Query Params:**
- `categoria`: ID de categoría
- `subcategoria`: ID de subcategoría
- `activo`: `true` o `false`
- `stock_min`: Stock mínimo
- `disponible`: `true` (solo con stock > 0)
- `search`: Búsqueda por nombre o código
- `ordering`: `nombre`, `precio_lista_3`, `stock`, etc.

**Response:** `200 OK`
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/productos/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "codigo": "PROD001",
      "nombre": "Producto Ejemplo",
      "categoria": 1,
      "categoria_nombre": "Bebidas",
      "subcategoria": 1,
      "subcategoria_nombre": "Gaseosas",
      "precio_lista_3": "1500.00",
      "precio_lista_4": "1200.00",
      "stock": 100,
      "tiene_stock": true,
      "stock_bajo": false,
      "activo": true,
      "imagen": "http://localhost:8000/media/productos/producto1.jpg"
    }
  ]
}
```

---

### Detalle de Producto

**GET** `/api/productos/{id}/`

Obtiene el detalle completo de un producto.

**Response:** `200 OK`
```json
{
  "id": 1,
  "codigo": "PROD001",
  "nombre": "Producto Ejemplo",
  "descripcion": "Descripción detallada del producto",
  "categoria": 1,
  "categoria_nombre": "Bebidas",
  "subcategoria": 1,
  "subcategoria_nombre": "Gaseosas",
  "precio_lista_3": "1500.00",
  "precio_lista_4": "1200.00",
  "stock": 100,
  "stock_minimo": 10,
  "tiene_stock": true,
  "stock_bajo": false,
  "imagen": "http://localhost:8000/media/productos/producto1.jpg",
  "activo": true,
  "fecha_creacion": "2025-10-26T10:00:00Z",
  "fecha_actualizacion": "2025-10-26T11:00:00Z"
}
```

---

### Crear Producto (Admin)

**POST** `/api/productos/`

Crea un nuevo producto (solo admin).

**Body:**
```json
{
  "codigo": "PROD002",
  "nombre": "Nuevo Producto",
  "descripcion": "Descripción del producto",
  "categoria": 1,
  "subcategoria": 1,
  "precio_lista_3": "2000.00",
  "precio_lista_4": "1800.00",
  "stock": 50,
  "stock_minimo": 5,
  "activo": true
}
```

**Response:** `201 Created`

---

## Categorías y Subcategorías

### Listar Categorías

**GET** `/api/productos/categorias/`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "nombre": "Bebidas",
    "descripcion": "Bebidas varias",
    "activo": true,
    "fecha_creacion": "2025-10-26T10:00:00Z"
  }
]
```

---

### Listar Subcategorías

**GET** `/api/productos/subcategorias/`

**Query Params:**
- `categoria`: ID de categoría

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "categoria": 1,
    "categoria_nombre": "Bebidas",
    "nombre": "Gaseosas",
    "descripcion": "Gaseosas y refrescos",
    "activo": true,
    "fecha_creacion": "2025-10-26T10:00:00Z"
  }
]
```

---

## Pedidos

### Listar Pedidos

**GET** `/api/pedidos/`

Lista los pedidos según el rol del usuario.

**Query Params:**
- `mine=true`: Solo mis pedidos
- `estado`: `PENDIENTE`, `CONFIRMADO`, `EN_CAMINO`, `ENTREGADO`, `CANCELADO`
- `cliente`: ID del cliente (solo admin/vendedor)

**Response:** `200 OK`
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "cliente": 1,
      "cliente_nombre": "Juan Pérez",
      "estado": "CONFIRMADO",
      "lista_precio": "lista_3",
      "subtotal": "15000.00",
      "descuento_total": "500.00",
      "total": "14500.00",
      "items": [
        {
          "id": 1,
          "producto": 1,
          "producto_detalle": {
            "id": 1,
            "codigo": "PROD001",
            "nombre": "Producto Ejemplo",
            "precio_lista_3": "1500.00"
          },
          "cantidad": 10,
          "precio_unitario": "1500.00",
          "subtotal": "15000.00",
          "descuento": "500.00"
        }
      ],
      "promociones_aplicadas_detalle": [
        {
          "id": 1,
          "nombre": "Caja Cerrada x10",
          "tipo": "caja_cerrada"
        }
      ],
      "notas": "Entregar antes de las 18hs",
      "fecha_creacion": "2025-10-26T12:00:00Z",
      "fecha_actualizacion": "2025-10-26T12:30:00Z",
      "fecha_confirmacion": "2025-10-26T12:30:00Z",
      "fecha_entrega": null
    }
  ]
}
```

---

### Crear Pedido

**POST** `/api/pedidos/`

Crea un nuevo pedido.

**Body:**
```json
{
  "cliente": 1,
  "lista_precio": "lista_3",
  "items": [
    {
      "producto": 1,
      "cantidad": 10
    },
    {
      "producto": 2,
      "cantidad": 5
    }
  ],
  "notas": "Entregar antes de las 18hs"
}
```

**Nota:** Si el usuario es cliente, el campo `cliente` se asigna automáticamente.

**Response:** `201 Created`

---

### Detalle de Pedido

**GET** `/api/pedidos/{id}/`

Obtiene el detalle completo de un pedido.

**Response:** `200 OK` (mismo formato que en el listado)

---

### Actualizar Estado de Pedido

**PUT** `/api/pedidos/{id}/estado/`

Actualiza el estado del pedido (solo admin/vendedor).

**Body:**
```json
{
  "estado": "EN_CAMINO"
}
```

**Estados permitidos:**
- `PENDIENTE` → `CONFIRMADO` o `CANCELADO`
- `CONFIRMADO` → `EN_CAMINO` o `CANCELADO`
- `EN_CAMINO` → `ENTREGADO` o `CANCELADO`

**Response:** `200 OK`

---

### Exportar PDF

**GET** `/api/pedidos/{id}/pdf/`

Descarga el comprobante del pedido en PDF.

**Response:** `200 OK` (archivo PDF)

---

## Promociones

### Listar Promociones

**GET** `/api/promociones/`

Lista las promociones vigentes.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "nombre": "Caja Cerrada x12",
    "descripcion": "Comprando 12 unidades obtenés 10% de descuento",
    "tipo": "caja_cerrada",
    "productos": [1, 2, 3],
    "productos_nombres": ["Producto 1", "Producto 2", "Producto 3"],
    "cantidad_minima": 1,
    "cantidad_exacta": 12,
    "descuento_porcentaje": "10.00",
    "descuento_fijo": null,
    "fecha_inicio": "2025-10-01T00:00:00Z",
    "fecha_fin": "2025-12-31T23:59:59Z",
    "activo": true,
    "es_vigente": true,
    "fecha_creacion": "2025-10-01T10:00:00Z"
  }
]
```

---

## Información General

### Listar Información

**GET** `/api/info/general/`

Lista toda la información general (pública).

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "tipo": "quienes_somos",
    "titulo": "¿Quiénes Somos?",
    "contenido": "El-Tetu es una empresa...",
    "activo": true,
    "fecha_creacion": "2025-10-26T10:00:00Z",
    "fecha_actualizacion": "2025-10-26T10:00:00Z"
  }
]
```

---

### Detalle por Tipo

**GET** `/api/info/general/{tipo}/`

Obtiene información por tipo (pública).

Tipos disponibles: `terminos`, `privacidad`, `quienes_somos`, `contacto`, `faq`, `otro`

**Response:** `200 OK`

---

## Modelos de Datos

### CustomUser

```typescript
{
  id: number
  email: string
  nombre: string
  apellido: string
  full_name: string (readonly)
  rol: 'admin' | 'vendedor' | 'cliente'
  telefono?: string
  direccion?: string
  is_active: boolean
  date_joined: datetime
}
```

### Producto

```typescript
{
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  categoria: number
  categoria_nombre: string (readonly)
  subcategoria?: number
  subcategoria_nombre?: string (readonly)
  precio_lista_3: decimal
  precio_lista_4: decimal
  stock: number
  stock_minimo: number
  tiene_stock: boolean (readonly)
  stock_bajo: boolean (readonly)
  imagen?: string
  activo: boolean
  fecha_creacion: datetime
  fecha_actualizacion: datetime
}
```

### Pedido

```typescript
{
  id: number
  cliente: number
  cliente_nombre: string (readonly)
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO'
  lista_precio: 'lista_3' | 'lista_4'
  subtotal: decimal (readonly)
  descuento_total: decimal (readonly)
  total: decimal (readonly)
  items: PedidoItem[]
  promociones_aplicadas_detalle: Promocion[] (readonly)
  notas?: string
  fecha_creacion: datetime
  fecha_actualizacion: datetime
  fecha_confirmacion?: datetime
  fecha_entrega?: datetime
}
```

### PedidoItem

```typescript
{
  id: number
  producto: number
  producto_detalle: Producto (readonly)
  cantidad: number
  precio_unitario: decimal (readonly)
  subtotal: decimal (readonly)
  descuento: decimal (readonly)
  fecha_creacion: datetime
}
```

### Promocion

```typescript
{
  id: number
  nombre: string
  descripcion: string
  tipo: 'caja_cerrada' | 'combinable' | 'descuento_porcentaje' | 'descuento_fijo'
  productos: number[]
  productos_nombres: string[] (readonly)
  cantidad_minima: number
  cantidad_exacta?: number
  descuento_porcentaje?: decimal
  descuento_fijo?: decimal
  fecha_inicio: datetime
  fecha_fin: datetime
  activo: boolean
  es_vigente: boolean (readonly)
  fecha_creacion: datetime
}
```

---

## Códigos de Estado

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Error en los datos enviados
- `401 Unauthorized`: No autenticado o token inválido
- `403 Forbidden`: Sin permisos para realizar la acción
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

---

## Errores

Formato de errores:

```json
{
  "error": "Mensaje de error descriptivo"
}
```

O con detalles de validación:

```json
{
  "email": ["Este campo es obligatorio."],
  "password": ["Las contraseñas no coinciden."]
}
```

# Rutas de Navegación - El-Tetu Mobile App

Este documento describe la estructura de navegación de la aplicación móvil React Native.

## Estructura de Navegación

```
RootNavigator
├── AuthStack (No autenticado)
│   ├── Login
│   └── Register
│
└── MainNavigator (Autenticado)
    ├── ClienteStack (rol: cliente)
    │   ├── Home
    │   ├── Catalogo
    │   ├── ProductoDetalle
    │   ├── Carrito
    │   ├── MisPedidos
    │   ├── PedidoDetalle
    │   └── Perfil
    │
    ├── VendedorStack (rol: vendedor)
    │   ├── Home
    │   ├── Clientes
    │   ├── Pedidos
    │   ├── PedidoDetalle
    │   ├── NuevoPedido
    │   └── Perfil
    │
    └── AdminStack (rol: admin)
        ├── Home (Dashboard)
        ├── Productos
        │   ├── ListaProductos
        │   ├── NuevoProducto
        │   └── EditarProducto
        ├── Categorias
        ├── Pedidos
        │   ├── ListaPedidos
        │   └── PedidoDetalle
        ├── Usuarios
        │   ├── ListaUsuarios
        │   └── UsuarioDetalle
        ├── Promociones
        │   ├── ListaPromociones
        │   └── NuevaPromocion
        └── Perfil
```

## Detalles de Pantallas

### AuthStack (No autenticado)

#### Login (`/login`)
- **Componente:** `screens/auth/LoginScreen.tsx`
- **Descripción:** Pantalla de inicio de sesión
- **Funcionalidad:**
  - Formulario de email y password
  - Validación de campos
  - Llamada a `POST /api/auth/login`
  - Almacenamiento de tokens en AsyncStorage
  - Redirección según rol

#### Register (`/register`)
- **Componente:** `screens/auth/RegisterScreen.tsx`
- **Descripción:** Pantalla de registro de nuevos usuarios
- **Funcionalidad:**
  - Formulario completo de registro
  - Validación de passwords
  - Llamada a `POST /api/auth/register`
  - Login automático después del registro

---

### ClienteStack (rol: cliente)

#### Home (`/home`)
- **Componente:** `screens/cliente/HomeScreen.tsx`
- **Descripción:** Pantalla principal del cliente
- **Funcionalidad:**
  - Banner de bienvenida
  - Accesos rápidos a catálogo y pedidos
  - Promociones destacadas

#### Catálogo (`/catalogo`)
- **Componente:** `screens/cliente/CatalogoScreen.tsx`
- **Descripción:** Listado de productos disponibles
- **Funcionalidad:**
  - Lista de productos con scroll infinito
  - Filtros por categoría/subcategoría
  - Búsqueda por nombre o código
  - Agregar al carrito

#### Producto Detalle (`/producto/:id`)
- **Componente:** `screens/cliente/ProductoDetalleScreen.tsx`
- **Descripción:** Detalle completo del producto
- **Funcionalidad:**
  - Información completa del producto
  - Selector de cantidad
  - Agregar/quitar del carrito
  - Ver promociones aplicables

#### Carrito (`/carrito`)
- **Componente:** `screens/cliente/CarritoScreen.tsx`
- **Descripción:** Carrito de compras
- **Funcionalidad:**
  - Lista de items seleccionados
  - Modificar cantidad
  - Eliminar items
  - Ver total y descuentos
  - Confirmar pedido

#### Mis Pedidos (`/pedidos`)
- **Componente:** `screens/cliente/MisPedidosScreen.tsx`
- **Descripción:** Historial de pedidos del cliente
- **Funcionalidad:**
  - Lista de pedidos ordenados por fecha
  - Filtro por estado
  - Ver detalles del pedido

#### Pedido Detalle (`/pedido/:id`)
- **Componente:** `screens/cliente/PedidoDetalleScreen.tsx`
- **Descripción:** Detalle completo del pedido
- **Funcionalidad:**
  - Información completa del pedido
  - Items con precios
  - Estado actual
  - Descargar PDF (opcional)

#### Perfil (`/perfil`)
- **Componente:** `screens/cliente/PerfilScreen.tsx`
- **Descripción:** Perfil y configuración del usuario
- **Funcionalidad:**
  - Ver/editar datos personales
  - Cambiar contraseña
  - Información general (términos, privacidad)
  - Cerrar sesión

---

### VendedorStack (rol: vendedor)

#### Home (`/home`)
- **Componente:** `screens/vendedor/HomeScreen.tsx`
- **Descripción:** Dashboard del vendedor
- **Funcionalidad:**
  - Resumen de pedidos del día
  - Accesos rápidos

#### Clientes (`/clientes`)
- **Componente:** `screens/vendedor/ClientesScreen.tsx`
- **Descripción:** Lista de clientes
- **Funcionalidad:**
  - Ver todos los clientes
  - Buscar cliente
  - Ver historial de pedidos del cliente

#### Pedidos (`/pedidos`)
- **Componente:** `screens/vendedor/PedidosScreen.tsx`
- **Descripción:** Gestión de pedidos
- **Funcionalidad:**
  - Ver todos los pedidos
  - Filtrar por estado
  - Actualizar estado de pedidos
  - Crear nuevo pedido

#### Nuevo Pedido (`/pedido/nuevo`)
- **Componente:** `screens/vendedor/NuevoPedidoScreen.tsx`
- **Descripción:** Crear pedido para cliente
- **Funcionalidad:**
  - Seleccionar cliente
  - Agregar productos
  - Confirmar pedido

---

### AdminStack (rol: admin)

#### Home (`/home`)
- **Componente:** `screens/admin/HomeScreen.tsx`
- **Descripción:** Dashboard administrativo
- **Funcionalidad:**
  - Estadísticas generales
  - Accesos rápidos a gestión

#### Productos (`/productos`)
- **Componente:** `screens/admin/ProductosScreen.tsx`
- **Descripción:** Gestión de productos
- **Funcionalidad:**
  - CRUD completo de productos
  - Ver stock
  - Activar/desactivar productos

#### Categorías (`/categorias`)
- **Componente:** `screens/admin/CategoriasScreen.tsx`
- **Descripción:** Gestión de categorías y subcategorías
- **Funcionalidad:**
  - CRUD de categorías
  - CRUD de subcategorías

#### Pedidos (`/pedidos`)
- **Componente:** `screens/admin/PedidosScreen.tsx`
- **Descripción:** Gestión completa de pedidos
- **Funcionalidad:**
  - Ver todos los pedidos
  - Filtros avanzados
  - Actualizar estados
  - Exportar reportes

#### Usuarios (`/usuarios`)
- **Componente:** `screens/admin/UsuariosScreen.tsx`
- **Descripción:** Gestión de usuarios
- **Funcionalidad:**
  - Ver todos los usuarios
  - Filtrar por rol
  - Editar usuarios
  - Activar/desactivar

#### Promociones (`/promociones`)
- **Componente:** `screens/admin/PromocionesScreen.tsx`
- **Descripción:** Gestión de promociones
- **Funcionalidad:**
  - CRUD de promociones
  - Configurar condiciones
  - Activar/desactivar

---

## Navegación Compartida

### Bottom Tab Navigator (Cliente)

```
Tab.Navigator
├── Inicio (HomeScreen)
├── Catálogo (CatalogoScreen)
├── Carrito (CarritoScreen)
├── Pedidos (MisPedidosScreen)
└── Perfil (PerfilScreen)
```

### Drawer Navigator (Admin/Vendedor)

```
Drawer.Navigator
├── Dashboard
├── Productos/Clientes
├── Pedidos
├── Usuarios (admin)
├── Promociones (admin)
└── Perfil
```

---

## Parámetros de Navegación

### ProductoDetalle
```typescript
type ProductoDetalleParams = {
  productoId: number
}
```

### PedidoDetalle
```typescript
type PedidoDetalleParams = {
  pedidoId: number
}
```

### EditarProducto
```typescript
type EditarProductoParams = {
  productoId: number
}
```

---

## Guards de Navegación

### RoleGuard
Verifica el rol del usuario y redirige al stack correspondiente.

### AuthGuard
Verifica si el usuario está autenticado. Si no, redirige a Login.

---

## Deep Linking (Futuro)

```
eltetu://producto/:id
eltetu://pedido/:id
eltetu://catalogo
```

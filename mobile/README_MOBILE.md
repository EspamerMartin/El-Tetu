# 📱 Frontend Mobile - El-Tetu

Aplicación móvil React Native para el sistema de comercio El-Tetu.

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ y npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go en tu dispositivo móvil (iOS/Android)
- Backend Django corriendo en `http://localhost:8000`

### Instalación

```bash
# 1. Instalar dependencias
cd mobile
npm install

# 2. Configurar variables de entorno
# Crear archivo .env en la raíz de mobile/
echo "EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8000/api" > .env
# Reemplazar XXX.XXX con tu IP local

# 3. Iniciar backend (en otra terminal)
cd ../backend
python manage.py runserver

# 4. Iniciar app móvil
cd ../mobile
npm start
```

### Acceso

1. Escanea el QR con Expo Go
2. La app abrirá en la pantalla de Login
3. Usa las credenciales creadas en el backend o registra un nuevo usuario

---

## 📂 Estructura del Proyecto

```
mobile/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── ProductCard.tsx
│   │   ├── PedidoCard.tsx
│   │   ├── InputField.tsx
│   │   ├── ButtonPrimary.tsx
│   │   └── LoadingOverlay.tsx
│   ├── navigation/         # Sistema de navegación
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── ClienteStack.tsx
│   │   ├── VendedorStack.tsx
│   │   └── AdminStack.tsx
│   ├── screens/            # Pantallas de la app
│   │   ├── auth/           # Login, Register
│   │   ├── cliente/        # Pantallas del cliente
│   │   ├── vendedor/       # Pantallas del vendedor
│   │   └── admin/          # Pantallas del admin
│   ├── services/           # Servicios API
│   │   └── api/
│   │       ├── client.ts   # Axios instance
│   │       └── index.ts    # APIs (auth, productos, pedidos, etc.)
│   ├── store/              # Redux Toolkit
│   │   ├── index.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       └── cartSlice.ts
│   ├── types/              # TypeScript types
│   ├── theme/              # Estilos y tema
│   └── App.tsx
├── app.config.js           # Configuración de Expo
├── package.json
├── tsconfig.json
└── .env                    # Variables de entorno
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación
- Login con email y contraseña
- Registro de nuevos usuarios
- JWT tokens con auto-refresh
- Persistencia de sesión (AsyncStorage)
- Logout

### ✅ Cliente
- **Catálogo**: Listado de productos con búsqueda y refresh
- **Carrito**: Agregar/quitar productos, control de cantidades
- **Pedidos**: Crear pedidos, ver historial
- **Perfil**: Editar datos personales, cambiar contraseña, logout

### ⚠️ En Desarrollo
- Detalle de producto (estructura creada)
- Detalle de pedido (estructura creada)
- Pantallas de Vendedor (placeholders)
- Pantallas de Admin (placeholders)

---

## 🔑 Roles y Permisos

La app tiene 3 roles con navegación diferenciada:

### Cliente
- Ver catálogo de productos
- Agregar productos al carrito
- Realizar pedidos
- Ver historial de pedidos
- Editar perfil

### Vendedor (En desarrollo)
- Gestionar clientes
- Crear pedidos para clientes
- Ver lista de pedidos
- Dashboard de ventas

### Admin (En desarrollo)
- CRUD de usuarios
- CRUD de productos y categorías
- Gestión de pedidos
- Gestión de promociones
- Dashboard general

---

## 🛠️ Stack Tecnológico

- **Framework**: React Native 0.72.6 + Expo 49
- **Lenguaje**: TypeScript 5.1.3
- **Navegación**: React Navigation 6.x
  - Native Stack Navigator
  - Bottom Tabs Navigator
  - Drawer Navigator
- **Estado Global**: Redux Toolkit 1.9.7 + Redux Persist
- **UI**: React Native Paper 5.11.1 (Material Design)
- **HTTP Client**: Axios 1.6.2
- **Almacenamiento**: AsyncStorage

---

## 📡 API Endpoints

La app consume los siguientes endpoints del backend:

### Auth
- `POST /api/auth/login/`
- `POST /api/auth/register/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`
- `PUT /api/auth/me/`
- `POST /api/auth/change-password/`

### Productos
- `GET /api/productos/`
- `GET /api/productos/:id/`
- `GET /api/productos/categorias/`
- `GET /api/productos/subcategorias/`

### Pedidos
- `GET /api/pedidos/`
- `POST /api/pedidos/`
- `GET /api/pedidos/:id/`
- `PATCH /api/pedidos/:id/`
- `GET /api/pedidos/:id/pdf/`

### Promociones
- `GET /api/promociones/`
- `GET /api/promociones/:id/`

### Usuarios (Admin/Vendedor)
- `GET /api/auth/users/`
- `POST /api/auth/users/`
- `GET /api/auth/users/:id/`
- `PUT /api/auth/users/:id/`

---

## 🧪 Testing

```bash
# Verificar tipos TypeScript
npm run tsc

# Limpiar caché
expo start -c

# Build para Android (desarrollo)
expo build:android

# Build para iOS (desarrollo)
expo build:ios
```

---

## 🐛 Troubleshooting

### La app no se conecta al backend
1. Verifica que el backend esté corriendo: `http://localhost:8000/api/`
2. Asegúrate de usar tu IP local en `.env`, no `localhost`
3. Verifica que el backend acepte conexiones de red (`0.0.0.0:8000`)

### Error de autenticación
- Limpia AsyncStorage: desinstala y reinstala la app
- Verifica que los tokens sean válidos en el backend

### Errores de TypeScript
- Ejecuta `npm install` para instalar dependencias
- Verifica que `tsconfig.json` tenga los path aliases correctos

### Productos no se muestran
- Verifica que existan productos activos en el backend
- Revisa la consola de Expo para errores de API

---

## 📝 Próximos Pasos

Ver `PROGRESS.md` para el roadmap completo.

### Prioridades Inmediatas:
1. Completar ProductoDetalleScreen
2. Completar PedidoDetalleScreen
3. Implementar pantallas de Vendedor
4. Implementar pantallas de Admin
5. Agregar tests unitarios
6. Optimizar rendimiento

---

## 👤 Autor

Proyecto El-Tetu  
Diciembre 2024

---

## 📄 Licencia

Uso interno - Todos los derechos reservados

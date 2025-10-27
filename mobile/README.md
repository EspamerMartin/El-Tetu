# El-Tetu Mobile

Aplicación móvil React Native (Expo) para la plataforma de comercio B2B/B2C El-Tetu.

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app en tu dispositivo móvil (iOS/Android)

### Instalación

```bash
# Navegar a la carpeta mobile
cd mobile

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con la URL de tu backend
# EXPO_PUBLIC_API_URL=http://localhost:8000/api
# Para dispositivo físico usar la IP de tu computadora:
# EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8000/api
```

### Ejecutar la Aplicación

```bash
# Iniciar Expo
npm start

# Escanear el código QR con:
# - iOS: Camera app
# - Android: Expo Go app

# O ejecutar en emulador:
npm run ios      # iOS
npm run android  # Android
```

## 📁 Estructura del Proyecto

```
mobile/
├── src/
│   ├── navigation/          # React Navigation
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── ClienteStack.tsx
│   │   ├── VendedorStack.tsx
│   │   └── AdminStack.tsx
│   │
│   ├── screens/             # Pantallas
│   │   ├── auth/           # Login, Register
│   │   ├── cliente/        # Catálogo, Carrito, Pedidos
│   │   ├── vendedor/       # Clientes, Pedidos, Entregas
│   │   └── admin/          # Dashboard, CRUD completo
│   │
│   ├── components/          # Componentes reutilizables
│   │   ├── ProductCard.tsx
│   │   ├── PedidoCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ...
│   │
│   ├── store/               # Redux Toolkit
│   │   ├── index.ts        # Store config
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       └── cartSlice.ts
│   │
│   ├── services/            # API services
│   │   └── api/
│   │       ├── client.ts   # Axios config
│   │       └── index.ts    # API methods
│   │
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   │
│   ├── theme/               # Tema y estilos
│   │   └── index.ts
│   │
│   └── utils/               # Utilidades
│       ├── validators.ts
│       └── formatters.ts
│
├── assets/                  # Imágenes, íconos, fonts
├── App.tsx                  # Entry point
├── package.json
├── tsconfig.json
├── app.json                 # Expo config
└── babel.config.js
```

## 🔑 Funcionalidades Implementadas

### ✅ Autenticación (Completo)
- [x] Login con JWT
- [x] Registro de usuarios
- [x] Refresh token automático
- [x] Persistencia de sesión
- [x] Logout

### ✅ Redux Store (Completo)
- [x] authSlice (user, tokens, login, logout)
- [x] cartSlice (items, add, remove, clear)
- [x] Redux Persist con AsyncStorage

### ✅ Servicios API (Completo)
- [x] Axios configurado con interceptors
- [x] API methods para todos los endpoints
- [x] Error handling global
- [x] Token refresh automático

### ⏳ Navegación (Pendiente)
- [ ] RootNavigator
- [ ] AuthStack (Login, Register)
- [ ] ClienteStack (Bottom Tabs)
- [ ] VendedorStack (Drawer)
- [ ] AdminStack (Drawer)

### ⏳ Pantallas (Pendiente)
- [ ] Auth: Login, Register
- [ ] Cliente: Home, Catálogo, Carrito, Pedidos, Perfil
- [ ] Vendedor: Home, Clientes, Pedidos, Nuevo Pedido
- [ ] Admin: Dashboard, Productos, Usuarios, Pedidos, Promociones

### ⏳ Componentes (Pendiente)
- [ ] ProductCard
- [ ] PedidoCard
- [ ] LoadingSpinner
- [ ] SearchBar
- [ ] FilterChips

## 🎨 UI/UX

- **Framework UI:** React Native Paper (Material Design)
- **Iconos:** React Native Vector Icons
- **Tema:** Personalizable con soporte para modo oscuro
- **Navegación:** React Navigation v6

## 🔧 Scripts Disponibles

```bash
npm start          # Inicia Expo
npm run android    # Ejecuta en Android
npm run ios        # Ejecuta en iOS
npm run web        # Ejecuta en navegador
npm run tsc        # Type checking
```

## 🛠️ Stack Tecnológico

- **React Native:** 0.72.6
- **Expo SDK:** 49.0.0
- **TypeScript:** 5.1.3
- **React Navigation:** 6.x
- **Redux Toolkit:** 1.9.7
- **Redux Persist:** 6.0.0
- **Axios:** 1.6.2
- **React Native Paper:** 5.11.1
- **AsyncStorage:** 1.18.2

## 📱 Flujo de Usuario

### Cliente

1. Login/Registro
2. Ver catálogo de productos
3. Filtrar por categoría/subcategoría
4. Agregar productos al carrito
5. Ver carrito y total
6. Confirmar pedido
7. Ver historial de pedidos
8. Ver detalle de pedido

### Vendedor

1. Login
2. Ver lista de clientes
3. Ver todos los pedidos
4. Crear pedido para cliente
5. Actualizar estado de pedidos
6. Ver detalles de entrega

### Admin

1. Login
2. Dashboard con estadísticas
3. CRUD de productos
4. CRUD de categorías
5. Gestión de usuarios
6. Gestión de pedidos
7. Gestión de promociones

## 🔐 Seguridad

- JWT almacenados en AsyncStorage (migrar a SecureStore en producción)
- Refresh token automático
- Interceptors para agregar Bearer token
- Validación de formularios
- Sanitización de inputs

## 🚀 Deploy

### Build para Producción

```bash
# Android APK
expo build:android

# iOS
expo build:ios

# O usar EAS Build (recomendado)
eas build --platform android
eas build --platform ios
```

### Distribución

- **Android:** Google Play Store o APK directo
- **iOS:** App Store (requiere cuenta de desarrollador)

Ver [documentación de Expo](https://docs.expo.dev/distribution/introduction/)

## 🎯 Próximos Pasos

1. Implementar navegación completa
2. Crear todas las pantallas
3. Implementar componentes reutilizables
4. Agregar validaciones de formularios
5. Testing con Jest
6. Migrar a SecureStore para tokens
7. Agregar push notifications
8. Implementar modo offline básico

## 📚 Recursos

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

## 🐛 Troubleshooting

### No se puede conectar al backend

- Verificar que el backend esté corriendo en `localhost:8000`
- Si usas dispositivo físico, usar IP de tu computadora en `.env`
- Verificar que el firewall permita conexiones

### Error al instalar dependencias

```bash
# Limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Error con Expo Go

- Asegurarse de que la versión de Expo Go sea compatible con SDK 49
- Usar el mismo WiFi en dispositivo y computadora

## 📄 Licencia

Propietario - El-Tetu © 2025

# 📱 El-Tetu Mobile App

Aplicación móvil desarrollada con React Native y Expo para la gestión de productos, pedidos y clientes de El-Tetu.

## 🚀 Características

- **Autenticación**: Login y registro de usuarios con JWT
- **Gestión de Productos**: Catálogo completo con filtros, búsqueda y detalles
- **Carrito de Compras**: Agregar productos, gestionar cantidades
- **Pedidos**: Crear, ver y gestionar pedidos
- **Roles de Usuario**:
  - **Cliente**: Ver productos, crear pedidos, ver historial
  - **Vendedor**: Gestionar pedidos, ver clientes, productos con bajo stock
  - **Admin**: Gestión completa de productos, usuarios, categorías, marcas y listas de precios

## 🛠️ Tecnologías

- **React Native** 0.81.5
- **Expo SDK** ~54.0.25
- **TypeScript** ~5.9.2
- **React Navigation** v7
- **Redux Toolkit** v2.10.1
- **React Native Paper** v5.12.5
- **Axios** v1.13.2

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI para builds de producción (`npm install -g eas-cli`)
- Cuenta Expo (gratuita en https://expo.dev)

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd El-Tetu/mobile
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor de desarrollo:
```bash
npm start
```

## 🏃 Desarrollo

### Comandos Disponibles

- `npm start` - Inicia el servidor de desarrollo de Expo
- `npm run android` - Ejecuta la app en Android (requiere Android Studio)
- `npm run ios` - Ejecuta la app en iOS (requiere Xcode, solo macOS)
- `npm run web` - Ejecuta la app en el navegador
- `npm run type-check` - Verifica tipos TypeScript sin compilar

### Configuración de API

La app está configurada para conectarse a la API de producción por defecto:
- **URL de Producción**: `https://el-tetu-prod.up.railway.app/api`

Para desarrollo local, modificar temporalmente `app.config.js`:
```javascript
apiUrl: "http://localhost:8000/api"
```

## 📦 Build de Producción

### Android APK

1. Asegúrate de estar logueado en EAS:
```bash
eas login
```

2. Build de producción:
```bash
npm run build:android
# o
eas build --platform android --profile production
```

3. Build de preview (testing):
```bash
npm run build:android:preview
# o
eas build --platform android --profile preview
```

4. Ver builds:
```bash
npm run build:list
# o
eas build:list
```

### Configuración de Build

Los perfiles de build están configurados en `eas.json`:
- **development**: Cliente de desarrollo
- **preview**: Build de prueba interno
- **production**: Build de producción con auto-incremento de versión

## 📁 Estructura del Proyecto

```
mobile/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── hooks/           # Custom hooks
│   ├── navigation/      # Configuración de navegación
│   ├── screens/         # Pantallas de la app
│   │   ├── admin/       # Pantallas de administrador
│   │   ├── auth/        # Login y registro
│   │   ├── cliente/     # Pantallas de cliente
│   │   ├── shared/       # Pantallas compartidas
│   │   └── vendedor/    # Pantallas de vendedor
│   ├── services/        # Servicios API
│   ├── store/           # Redux store y slices
│   ├── theme/           # Tema y estilos
│   ├── types/           # Tipos TypeScript
│   └── utils/           # Utilidades
├── assets/              # Imágenes y recursos
├── app.config.js        # Configuración de Expo
├── eas.json             # Configuración de EAS Build
└── package.json         # Dependencias y scripts
```

## 🔐 Autenticación

La app usa JWT (JSON Web Tokens) para autenticación:
- Tokens almacenados en `AsyncStorage`
- Refresh token automático
- Logout limpia todos los tokens

## 📱 Funcionalidades por Rol

### Cliente
- Ver catálogo de productos
- Buscar y filtrar productos
- Agregar productos al carrito
- Crear pedidos
- Ver historial de pedidos
- Ver perfil y actualizar información

### Vendedor
- Ver dashboard con estadísticas
- Gestionar pedidos (confirmar, cancelar)
- Ver lista de clientes
- Ver productos con bajo stock
- Crear pedidos manuales

### Admin
- Gestión completa de productos
- Gestión de usuarios (crear, editar, eliminar)
- Gestión de categorías y subcategorías
- Gestión de marcas
- Gestión de listas de precios
- Asignar listas de precios a clientes
- Ver estadísticas globales

## 🐛 Troubleshooting

### La app no se conecta a la API
- Verificar que la URL en `app.config.js` sea correcta
- Limpiar caché de Expo: `npx expo start --clear`
- Verificar logs en consola para ver qué URL está usando

### Error al hacer build
- Verificar que estés logueado: `eas whoami`
- Verificar configuración en `eas.json`
- Verificar que `app.config.js` tenga el `projectId` correcto

### Problemas con dependencias
- Eliminar `node_modules` y `package-lock.json`
- Ejecutar `npm install` nuevamente

## 📝 Notas

- La app está configurada para mostrar todos los productos sin paginación
- Los productos se cargan completamente desde el backend
- El carrito persiste en `AsyncStorage`
- Los tokens se renuevan automáticamente

## 📄 Licencia

Este proyecto es privado y propiedad de El-Tetu.

## 👥 Contacto

Para más información, contactar al equipo de desarrollo.


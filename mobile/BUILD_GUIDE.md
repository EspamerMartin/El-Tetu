# 📱 Guía de Build de Producción - El-Tetu Mobile

Esta guía documenta el proceso completo para generar un APK de producción de la aplicación móvil El-Tetu usando EAS Build de Expo.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Proceso de Build](#proceso-de-build)
4. [Gestión de Versiones](#gestión-de-versiones)
5. [Testing del APK](#testing-del-apk)
6. [Comandos Útiles](#comandos-útiles)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos Previos

### Herramientas Necesarias

- **Node.js** 18+ y npm
- **EAS CLI** instalado globalmente
- **Cuenta Expo** (gratuita en https://expo.dev)
- **Git** para control de versiones

### Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Login en EAS

```bash
eas login
```

---

## ⚙️ Configuración Inicial

### 1. Variables de Entorno

Asegúrate de que `mobile/.env` contiene la URL del backend de producción:

```env
# Backend API URL (Railway Production)
EXPO_PUBLIC_API_URL=https://el-tetu-production.up.railway.app/api
```

### 2. Configuración de App (app.config.js)

El archivo `app.config.js` debe incluir:

```javascript
module.exports = {
  expo: {
    name: "El-Tetu",
    slug: "el-tetu-mobile",
    version: "1.0.0",  // ⚠️ Incrementar antes de cada release
    
    extra: {
      eas: {
        projectId: "301fbcd6-7b42-412e-b33e-e7401ab0bb6f"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api"
    },
    
    android: {
      package: "com.eltetu.app",
      // ... resto de configuración
    }
  }
};
```

### 3. Configuración de EAS Build (eas.json)

El archivo `eas.json` contiene los perfiles de build:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"  // Cambiar a "app-bundle" para Play Store
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://el-tetu-production.up.railway.app/api"
      }
    }
  }
}
```

**Notas:**
- **APK** (.apk): Para distribución interna, testing, o instalación directa
- **App Bundle** (.aab): Requerido para publicar en Google Play Store
- `autoIncrement`: Incrementa automáticamente el `versionCode` en cada build

---

## 🚀 Proceso de Build

### Build de Producción (APK)

```bash
cd mobile
eas build --platform android --profile production
```

**El proceso incluye:**

1. ✅ **Verificación de credenciales** - EAS creará un keystore automáticamente en el primer build
2. ✅ **Compresión de archivos** - Empaqueta el proyecto
3. ✅ **Upload a EAS** - Sube el proyecto a los servidores de Expo
4. ✅ **Build en la nube** - Compila la app en un entorno aislado (~10-15 minutos)
5. ✅ **Descarga del APK** - Link de descarga disponible al finalizar

### Build para Preview/Testing

```bash
eas build --platform android --profile preview
```

Útil para testing antes de producción.

### Verificar Estado del Build

Durante el build, puedes presionar `Ctrl+C` para salir sin cancelar el build. Luego verificar el estado:

```bash
eas build:list
```

### Ver Logs del Build

```bash
eas build:view [BUILD_ID]
```

O visitar directamente: https://expo.dev/accounts/fsaecr/projects/el-tetu-mobile/builds

---

## 📊 Gestión de Versiones

### Versionado Semántico

Usar formato **MAJOR.MINOR.PATCH** (ej: `1.0.0`, `1.0.1`, `1.1.0`)

- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Nueva funcionalidad compatible con versiones anteriores
- **PATCH**: Correcciones de bugs

### Incrementar Versión

#### 1. En app.config.js

```javascript
version: "1.0.1"  // Cambiar manualmente
```

#### 2. Version Code (automático con EAS)

EAS incrementa automáticamente el `versionCode` (Android) cuando `autoIncrement: true` está habilitado.

Para revisar el versionCode actual:

```bash
cat android/app/build.gradle | grep versionCode
```

---

## 🧪 Testing del APK

### Descargar APK

Después del build exitoso, descarga el APK desde:
- El link proporcionado en la terminal
- Dashboard de Expo: https://expo.dev/accounts/fsaecr/projects/el-tetu-mobile/builds

### Instalar en Dispositivo Android

#### Opción 1: Cable USB + ADB

```bash
adb install path/to/app-release.apk
```

#### Opción 2: Transferencia Directa

1. Transferir el archivo APK al dispositivo (email, Drive, USB)
2. Abrir el archivo APK en el dispositivo
3. Permitir instalación de fuentes desconocidas si es necesario

### Checklist de Testing

- [ ] La app instala correctamente
- [ ] La app se conecta al backend de Railway (`https://el-tetu-production.up.railway.app/api`)
- [ ] Login funciona con credenciales de prueba:
  - Admin: `admin@mail.com` / `admin123`
  - Vendedor: `vendedor@mail.com` / `vendedor123`
  - Cliente: `cliente@mail.com` / `cliente123`
- [ ] Navegación por roles funciona correctamente
- [ ] Catálogo de productos carga
- [ ] Crear pedido funciona
- [ ] Gestión de usuarios (admin) funciona
- [ ] Tokens JWT se refrescan automáticamente
- [ ] No hay errores en la consola relacionados con API

---

## 🛠️ Comandos Útiles

### Gestión de Builds

```bash
# Listar todos los builds
eas build:list

# Ver detalles de un build específico
eas build:view [BUILD_ID]

# Cancelar un build en progreso
eas build:cancel [BUILD_ID]

# Reintentar un build fallido
eas build:resign
```

### Gestión de Credenciales

```bash
# Ver credenciales (keystores)
eas credentials

# Descargar keystore local
eas credentials --platform android
```

### Publicación en Play Store (futuro)

```bash
# Cambiar buildType a "app-bundle" en eas.json primero
eas build --platform android --profile production

# Luego submit
eas submit --platform android --profile production
```

### Variables de Entorno

```bash
# Crear secret en EAS
eas secret:create --scope project --name VARIABLE_NAME --value "valor"

# Listar secrets
eas secret:list

# Eliminar secret
eas secret:delete --name VARIABLE_NAME
```

---

## ❗ Troubleshooting

### Error: "Build failed with unknown error"

**Solución:**
1. Revisar logs detallados en https://expo.dev (buscar la fase "Run gradlew")
2. Verificar que `android/app/build.gradle` tiene configuración válida
3. Asegurarse de que no hay conflictos de versiones en dependencies
4. Limpiar caché: `cd android && ./gradlew clean`

### Error: "Cannot find module..."

**Solución:**
```bash
cd mobile
rm -rf node_modules
npm install
```

### Error: CORS en requests al backend

**Solución:**
- Verificar que `EXPO_PUBLIC_API_URL` está correctamente configurada
- Confirmar que el backend en Railway tiene `CORS_ALLOW_ALL_ORIGINS=True` (o configurado específicamente)
- Revisar `backend/config/settings.py` líneas 165-181

### Error: "App crashes on launch"

**Solución:**
1. Conectar dispositivo con USB y revisar logs:
   ```bash
   adb logcat | grep -i "el-tetu\|expo\|react"
   ```
2. Verificar que todas las dependencias están instaladas
3. Confirmar que el `package` en `app.config.js` coincide con `applicationId` en `android/app/build.gradle`

### Backend no responde

**Verificar:**
```bash
# PowerShell
Invoke-WebRequest -Uri "https://el-tetu-production.up.railway.app/api/auth/login/" -Method GET

# Bash/Linux/Mac
curl https://el-tetu-production.up.railway.app/api/auth/login/
```

### Error: "Keystore not found"

**Solución:**
EAS maneja keystores automáticamente. Si necesitas usar un keystore específico:
```bash
eas credentials --platform android
# Seleccionar "Set up a new Android Keystore"
```

### Version Code ya existe en Play Store

**Solución:**
```bash
# Incrementar manualmente en android/app/build.gradle
defaultConfig {
    versionCode 3  // Incrementar
    versionName "1.0.1"
}
```

O confiar en `autoIncrement: true` en `eas.json`.

---

## 📚 Recursos Adicionales

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Signing Documentation](https://docs.expo.dev/app-signing/app-credentials/)
- [Environment Variables in EAS](https://docs.expo.dev/eas/environment-variables/)
- [Google Play Console](https://play.google.com/console)

---

## 📝 Notas Importantes

### Seguridad del Keystore

- **NUNCA** compartir el keystore de producción
- EAS almacena los keystores de forma segura en sus servidores
- Descargar y guardar backup del keystore en un lugar seguro:
  ```bash
  eas credentials --platform android
  # Seleccionar "Download credentials"
  ```

### Actualizaciones OTA

Para cambios que no requieren nuevo build (JavaScript/assets):
```bash
eas update --branch production --message "Fix de login"
```

### Backend Configuration

El backend en Railway debe tener configurado:
- `DEBUG=False`
- `ALLOWED_HOSTS=*.railway.app`
- `CORS_ALLOW_ALL_ORIGINS=True` (o configurar origins específicos)
- `SECURE_SSL_REDIRECT=True`
- `CSRF_TRUSTED_ORIGINS=['https://*.railway.app']`

---

**¿Preguntas?** Consultar la documentación de Expo o abrir un issue en el repositorio.

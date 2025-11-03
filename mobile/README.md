# El-Tetu Mobile

Aplicación móvil React Native (Expo) para la plataforma de comercio B2B/B2C El-Tetu.

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js 18+** y npm
- **Expo Go app** en tu dispositivo móvil ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **Backend corriendo** en `0.0.0.0:8000`

### Instalación

```bash
# Instalar dependencias
cd mobile
npm install
```

### Ejecutar la Aplicación

```bash
# 1. Iniciar el backend (en otra terminal)
cd backend
python manage.py runserver 0.0.0.0:8000

# 2. Iniciar la app móvil
cd mobile
npm start

# 3. Escanear el código QR con Expo Go en tu teléfono
```

### ⚠️ Importante: ¿Por qué `0.0.0.0`?

El backend **debe ejecutarse en `0.0.0.0:8000`** (no en `127.0.0.1`) porque:

- **`127.0.0.1`**: Solo acepta conexiones desde la misma máquina
- **`0.0.0.0`**: Acepta conexiones desde cualquier dispositivo en la red local

La app móvil detecta automáticamente la IP de tu PC (ej: `192.168.1.100`) y se conecta al backend a través de la red WiFi. Si el backend solo escucha en `127.0.0.1`, las peticiones desde tu teléfono serán rechazadas


## 📁 Estructura del Proyecto

```txt
mobile/
├── src/
│   ├── navigation/          # React Navigation
│   ├── screens/             # Pantallas por rol (auth, cliente, vendedor, admin)
│   ├── components/          # Componentes reutilizables
│   ├── store/               # Redux Toolkit
│   ├── services/api/        # Axios y métodos API
│   ├── types/               # TypeScript types
│   └── theme/               # Estilos y tema
├── App.tsx
└── package.json
```

## 🛠️ Stack Tecnológico

- React Native (Expo SDK 49)
- TypeScript
- React Navigation 6
- Redux Toolkit + Redux Persist
- Axios
- React Native Paper

## 📄 Licencia

Propietario - El-Tetu © 2025

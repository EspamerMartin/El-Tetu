# Dependencias Mobile (Expo)

Para evitar crashes al abrir la app, las versiones deben ser compatibles con el SDK de Expo usado.

## Recomendaciones

- Usar `npx expo install` para instalar dependencias compatibles:

```
npx expo install react react-native react-native-reanimated @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer react-native-gesture-handler react-native-screens react-native-safe-area-context
```

- Asegurarse de tener el plugin de Reanimated en `babel.config.js` (ya presente):

```
plugins: ['react-native-reanimated/plugin', ...]
```

- Configurar `EXPO_PUBLIC_API_URL` para apuntar al backend accesible desde el dispositivo/emulador.

## Notas
- Evitar usar `localhost` en mobile; preferir `10.0.2.2` (emulador Android) o IP LAN.
- `blob` no es soportado por React Native en Axios; usar `arraybuffer` y `expo-file-system` si se desea guardar el archivo.



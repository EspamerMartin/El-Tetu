import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Obtener API URL de las variables de entorno (configuradas en app.config.js)
let API_URL = 'http://localhost:8000/api';

try {
  if (Constants.expoConfig?.extra?.apiUrl) {
    API_URL = Constants.expoConfig.extra.apiUrl;
  } else if (Constants.manifest?.extra?.apiUrl) {
    // Fallback para builds legacy
    API_URL = Constants.manifest.extra.apiUrl;
  }
} catch {
  // Usar fallback silenciosamente
}

// Solo logear en desarrollo
const isDev = __DEV__;

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  async (config) => {
    if (isDev) {
      console.log('🚀 REQUEST:', config.method?.toUpperCase(), config.url);
    }
    
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (isDev) {
      console.log('❌ REQUEST ERROR:', error.message);
    }
    return Promise.reject(error);
  }
);

// Interceptor para manejar refresh token
api.interceptors.response.use(
  (response) => {
    if (isDev) {
      console.log('✅ RESPONSE:', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    if (isDev) {
      console.log('❌ RESPONSE ERROR:', error.response?.status, error.config?.url);
    }
    
    const originalRequest = error.config;

    // Si es error 401 y no es el endpoint de login/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          await AsyncStorage.setItem('access_token', access);

          // Reintentar request original con nuevo token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch {
        // Si falla el refresh, limpiar storage
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

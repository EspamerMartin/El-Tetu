import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Obtener el host (IP) del servidor Metro/CLI desde Expo (solo en desarrollo/Expo Go)
const getExpoHostIp = (): string | null => {
  try {
    const anyConst: any = Constants as any;
    
    // SDK 54+ puede tener debuggerHost directamente
    let hostUri: string | undefined = 
      anyConst?.expoConfig?.debuggerHost ||
      anyConst?.expoConfig?.hostUri ||
      anyConst?.manifest2?.extra?.expoGo?.debuggerHost ||
      anyConst?.manifest?.debuggerHost ||
      anyConst?.manifest?.hostUri;

    // Loguear para debug
    console.log('🔍 Constants.expoConfig:', anyConst?.expoConfig);
    console.log('🔍 debuggerHost detectado:', hostUri);

    if (hostUri) {
      // Ejemplos: "192.168.100.157:8081" o "localhost:8081" o solo "192.168.100.157"
      const host = hostUri.split(':')[0];
      console.log('🔍 Host extraído:', host);
      // Detectar IPv4 simple
      if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        console.log('✅ IP válida detectada:', host);
        return host;
      }
    }
  } catch (e) {
    console.log('❌ Error al detectar IP de Expo:', e);
  }
  console.log('⚠️ No se pudo detectar IP de Expo, usando fallback');
  return null;
};

// Determinar la URL base según la plataforma



// Generaliza: si la URL contiene "localhost" y estamos en Expo Go en dispositivo físico,
// la reemplaza por la IP del host detectada por Expo
let API_URL = 'http://localhost:8000/api';
const expoHostIp = getExpoHostIp();
if (API_URL.includes('localhost') && expoHostIp) {
  API_URL = API_URL.replace('localhost', expoHostIp);
}

console.log('🔧 API_URL configurada:', API_URL);
console.log('🔧 Platform:', Platform.OS);

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  async (config) => {
    console.log('🚀 REQUEST:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
    });
    
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log('❌ REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar refresh token
api.interceptors.response.use(
  (response) => {
    console.log('✅ RESPONSE:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    console.log('❌ RESPONSE ERROR:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      headers: error.response?.headers,
    });
    
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
      } catch (refreshError) {
        // Si falla el refresh, limpiar storage y redirigir a login
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

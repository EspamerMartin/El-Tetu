import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000/api';

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
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
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

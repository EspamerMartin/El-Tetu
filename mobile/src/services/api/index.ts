import api from './client';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  Producto,
  PaginatedResponse,
  Categoria,
  Subcategoria,
  Pedido,
  CreatePedidoData,
  Promocion,
} from '@/types';

// ========== Auth API ==========

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await api.post('/auth/refresh/', { refresh: refreshToken });
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile/', data);
    return response.data;
  },

  changePassword: async (data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password/', data);
    return response.data;
  },
};

// ========== Productos API ==========

export const productosAPI = {
  getAll: async (params?: {
    categoria?: number;
    subcategoria?: number;
    search?: string;
    disponible?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<Producto>> => {
    const response = await api.get('/productos/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Producto> => {
    const response = await api.get(`/productos/${id}/`);
    return response.data;
  },

  getCategorias: async (): Promise<Categoria[]> => {
    const response = await api.get('/productos/categorias/');
    return response.data;
  },

  getSubcategorias: async (categoriaId?: number): Promise<Subcategoria[]> => {
    const params = categoriaId ? { categoria: categoriaId } : undefined;
    const response = await api.get('/productos/subcategorias/', { params });
    return response.data;
  },
};

// ========== Pedidos API ==========

export const pedidosAPI = {
  getAll: async (params?: {
    mine?: boolean;
    estado?: string;
    cliente?: number;
    page?: number;
  }): Promise<PaginatedResponse<Pedido>> => {
    const response = await api.get('/pedidos/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Pedido> => {
    const response = await api.get(`/pedidos/${id}/`);
    return response.data;
  },

  create: async (data: CreatePedidoData): Promise<Pedido> => {
    const response = await api.post('/pedidos/', data);
    return response.data;
  },

  updateEstado: async (id: number, estado: string): Promise<Pedido> => {
    const response = await api.put(`/pedidos/${id}/estado/`, { estado });
    return response.data;
  },

  downloadPDF: async (id: number): Promise<Blob> => {
    const response = await api.get(`/pedidos/${id}/pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ========== Promociones API ==========

export const promocionesAPI = {
  getAll: async (): Promise<Promocion[]> => {
    const response = await api.get('/promociones/');
    return response.data;
  },

  getById: async (id: number): Promise<Promocion> => {
    const response = await api.get(`/promociones/${id}/`);
    return response.data;
  },
};

// ========== Clientes API (Admin/Vendedor) ==========

export const clientesAPI = {
  getAll: async (params?: {
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/auth/users/${id}/`);
    return response.data;
  },

  create: async (data: RegisterData): Promise<User> => {
    const response = await api.post('/auth/users/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/auth/users/${id}/`, data);
    return response.data;
  },
};

// Export todo junto
export default {
  auth: authAPI,
  productos: productosAPI,
  pedidos: pedidosAPI,
  promociones: promocionesAPI,
  clientes: clientesAPI,
};

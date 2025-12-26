import api from './client';
import {
  LoginCredentials,
  AuthResponse,
  User,
  UserCreateData,
  Zona,
  Producto,
  PaginatedResponse,
  Categoria,
  Subcategoria,
  Pedido,
  PedidoTransportador,
  CreatePedidoData,
  ListaPrecio,
  Marca,
  Promocion,
  PromocionCreateData,
} from '@/types';

// ========== Auth API ==========

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login/', credentials);
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

// ========== Zonas API ==========

export const zonasAPI = {
  getAll: async (params?: {
    activo?: boolean;
  }): Promise<Zona[]> => {
    const response = await api.get('/auth/zonas/', { params });
    // La API devuelve paginado, extraemos results
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Zona> => {
    const response = await api.get(`/auth/zonas/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Zona>): Promise<Zona> => {
    const response = await api.post('/auth/zonas/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Zona>): Promise<Zona> => {
    const response = await api.put(`/auth/zonas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/auth/zonas/${id}/`);
  },
};

// ========== Productos API ==========

export const productosAPI = {
  getAll: async (params?: {
    marca?: number;
    categoria?: number;
    subcategoria?: number;
    search?: string;
    disponible?: boolean;
    tiene_stock?: boolean;
    activo?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<Producto>> => {
    const response = await api.get('/productos/', { params });
    const data = response.data;
    
    // Si la respuesta es un array (sin paginación), convertir a formato paginado
    if (Array.isArray(data)) {
      return {
        count: data.length,
        next: null,
        previous: null,
        results: data,
      };
    }
    
    // Si ya viene paginado, devolverlo tal cual
    return data;
  },

  getById: async (id: number): Promise<Producto> => {
    const response = await api.get(`/productos/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Producto>): Promise<Producto> => {
    const response = await api.post('/productos/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Producto>): Promise<Producto> => {
    const response = await api.put(`/productos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/productos/${id}/`);
  },

  getMarcas: async (params?: {
    activo?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<Marca>> => {
    const response = await api.get('/productos/marcas/', { params });
    return response.data;
  },

  createMarca: async (data: Partial<Marca>): Promise<Marca> => {
    const response = await api.post('/productos/marcas/', data);
    return response.data;
  },

  updateMarca: async (id: number, data: Partial<Marca>): Promise<Marca> => {
    const response = await api.put(`/productos/marcas/${id}/`, data);
    return response.data;
  },

  deleteMarca: async (id: number): Promise<{ message?: string } | void> => {
    const response = await api.delete(`/productos/marcas/${id}/`);
    // Si es 204 (No Content), response.data puede ser undefined o string vacío
    // Si es 200, response.data contiene el mensaje
    return response.data || undefined;
  },

  getCategorias: async (params?: {
    activo?: string;
    page?: number;
  }): Promise<PaginatedResponse<Categoria>> => {
    const response = await api.get('/productos/categorias/', { params });
    return response.data;
  },

  createCategoria: async (data: Partial<Categoria>): Promise<Categoria> => {
    const response = await api.post('/productos/categorias/', data);
    return response.data;
  },

  updateCategoria: async (id: number, data: Partial<Categoria>): Promise<Categoria> => {
    const response = await api.put(`/productos/categorias/${id}/`, data);
    return response.data;
  },

  deleteCategoria: async (id: number): Promise<{ message?: string } | void> => {
    const response = await api.delete(`/productos/categorias/${id}/`);
    // Si es 204 (No Content), response.data puede ser undefined o string vacío
    // Si es 200, response.data contiene el mensaje
    return response.data || undefined;
  },

  getSubcategorias: async (params?: {
    categoria?: number;
    activo?: string;
  }): Promise<PaginatedResponse<Subcategoria>> => {
    const response = await api.get('/productos/subcategorias/', { params });
    return response.data;
  },

  createSubcategoria: async (data: Partial<Subcategoria>): Promise<Subcategoria> => {
    const response = await api.post('/productos/subcategorias/', data);
    return response.data;
  },

  updateSubcategoria: async (id: number, data: Partial<Subcategoria>): Promise<Subcategoria> => {
    const response = await api.put(`/productos/subcategorias/${id}/`, data);
    return response.data;
  },

  deleteSubcategoria: async (id: number): Promise<{ message?: string } | void> => {
    const response = await api.delete(`/productos/subcategorias/${id}/`);
    // Si es 204 (No Content), response.data puede ser undefined o string vacío
    // Si es 200, response.data contiene el mensaje
    return response.data || undefined;
  },
};

// ========== Promociones API ==========

export const promocionesAPI = {
  /**
   * Obtiene todas las promociones.
   * Admin/vendedor ven todas, clientes solo activas y vigentes.
   */
  getAll: async (params?: {
    activo?: boolean;
    search?: string;
  }): Promise<Promocion[]> => {
    const response = await api.get('/productos/promociones/', { params });
    return response.data.results || response.data;
  },

  /**
   * Obtiene solo promociones activas y vigentes (para catálogo).
   */
  getActivas: async (): Promise<Promocion[]> => {
    const response = await api.get('/productos/promociones/activas/');
    return response.data.results || response.data;
  },

  /**
   * Obtiene una promoción por ID.
   */
  getById: async (id: number): Promise<Promocion> => {
    const response = await api.get(`/productos/promociones/${id}/`);
    return response.data;
  },

  /**
   * Crea una nueva promoción.
   */
  create: async (data: PromocionCreateData): Promise<Promocion> => {
    const response = await api.post('/productos/promociones/', data);
    return response.data;
  },

  /**
   * Actualiza una promoción existente.
   */
  update: async (id: number, data: Partial<PromocionCreateData>): Promise<Promocion> => {
    const response = await api.put(`/productos/promociones/${id}/`, data);
    return response.data;
  },

  /**
   * Elimina una promoción.
   */
  delete: async (id: number): Promise<{ message?: string } | void> => {
    const response = await api.delete(`/productos/promociones/${id}/`);
    return response.data || undefined;
  },
};

// ========== Pedidos API ==========

export const pedidosAPI = {
  getAll: async (params?: {
    mine?: boolean;
    estado?: string;
    cliente?: number;
    fecha_creacion?: string; // Formato: YYYY-MM-DD
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

  rechazar: async (id: number): Promise<Pedido> => {
    const response = await api.put(`/pedidos/${id}/rechazar/`);
    return response.data;
  },

  asignarTransportador: async (id: number, transportadorId: number | null): Promise<Pedido> => {
    const response = await api.put(`/pedidos/${id}/asignar-transportador/`, { 
      transportador: transportadorId 
    });
    return response.data;
  },

  getTransportadores: async (): Promise<Array<{
    id: number;
    nombre: string;
    apellido: string;
    full_name: string;
    email: string;
    telefono?: string;
  }>> => {
    const response = await api.get('/pedidos/transportadores/');
    return response.data;
  },

  /**
   * Obtiene la URL para descargar el PDF del pedido.
   * Retorna la URL base + endpoint del PDF.
   */
  getPdfUrl: (id: number): string => {
    // Obtener la URL base del API (sin /api al final)
    const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
    return `${baseUrl}/api/pedidos/${id}/pdf/`;
  },
};

// ========== Pedidos Transportador API ==========

export const pedidosTransportadorAPI = {
  /**
   * Obtiene los pedidos asignados al transportador autenticado.
   * Solo retorna pedidos en estado FACTURADO (listos para entregar).
   */
  getMisPedidos: async (): Promise<PaginatedResponse<PedidoTransportador>> => {
    const response = await api.get('/pedidos/transportador/');
    return response.data;
  },

  /**
   * Obtiene el detalle de un pedido asignado al transportador.
   */
  getById: async (id: number): Promise<PedidoTransportador> => {
    const response = await api.get(`/pedidos/transportador/${id}/`);
    return response.data;
  },

  /**
   * Marca un pedido como entregado.
   */
  entregar: async (id: number): Promise<PedidoTransportador> => {
    const response = await api.put(`/pedidos/transportador/${id}/entregar/`);
    return response.data;
  },
};

// ========== Clientes API (Admin/Vendedor) ==========

export const clientesAPI = {
  getAll: async (params?: {
    search?: string;
    page?: number;
    rol?: 'admin' | 'vendedor' | 'cliente';
    is_active?: boolean;
    zona?: number;
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/auth/users/${id}/`);
    return response.data;
  },

  create: async (data: UserCreateData): Promise<User> => {
    const response = await api.post('/auth/users/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/auth/users/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/auth/users/${id}/`);
  },
};

// ========== Listas de Precios API (Admin) ==========

export const listasAPI = {
  getAll: async (params?: {
    activo?: boolean | string;
    page?: number;
  }): Promise<PaginatedResponse<ListaPrecio>> => {
    const response = await api.get('/productos/listas-precios/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ListaPrecio> => {
    const response = await api.get(`/productos/listas-precios/${id}/`);
    return response.data;
  },

  create: async (data: Partial<ListaPrecio>): Promise<ListaPrecio> => {
    const response = await api.post('/productos/listas-precios/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ListaPrecio>): Promise<ListaPrecio> => {
    const response = await api.put(`/productos/listas-precios/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/productos/listas-precios/${id}/`);
  },
};

// Export todo junto
export default {
  auth: authAPI,
  zonas: zonasAPI,
  productos: productosAPI,
  pedidos: pedidosAPI,
  pedidosTransportador: pedidosTransportadorAPI,
  clientes: clientesAPI,
  listas: listasAPI,
};

// ========== User Types ==========

export type UserRole = 'admin' | 'vendedor' | 'cliente';

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Zona {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface HorarioCliente {
  id?: number;
  dia_semana: DiaSemana;
  dia_semana_display?: string;
  horario_apertura: string; // Formato HH:MM
  horario_cierre: string;   // Formato HH:MM
  cerrado: boolean;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  full_name: string;
  rol: UserRole;
  telefono?: string;
  direccion?: string;
  cuit_dni?: string;
  // Campos específicos de cliente
  zona?: number;
  zona_nombre?: string;
  calle?: string;
  entre_calles?: string;
  numero?: string;
  descripcion_ubicacion?: string;
  horarios?: HorarioCliente[];
  // Lista de precios
  lista_precio?: number;
  lista_precio_nombre?: string;
  is_active: boolean;
  date_joined: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserCreateData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  telefono?: string;
  direccion?: string;
  cuit_dni?: string;
  // Campos específicos de cliente
  zona?: number;
  calle?: string;
  entre_calles?: string;
  numero?: string;
  descripcion_ubicacion?: string;
  horarios?: Omit<HorarioCliente, 'id' | 'dia_semana_display'>[];
  is_active?: boolean;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

// Cliente es un alias de User (para compatibilidad)
export type Cliente = User;

// ========== Product Types ==========

export interface Marca {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface Subcategoria {
  id: number;
  categoria: number;
  categoria_nombre: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fecha_creacion: string;
}

export type UnidadTamaño = 'ud' | 'ml' | 'l' | 'g' | 'kg' | 'cm' | 'm';

export interface Producto {
  id: number;
  codigo_barra: string;
  nombre: string;
  descripcion?: string;
  marca: number;
  marca_nombre: string;
  categoria: number;
  categoria_nombre: string;
  subcategoria?: number;
  subcategoria_nombre?: string;
  tamaño: string;
  unidad_tamaño: UnidadTamaño;
  unidad_tamaño_display: string;
  unidades_caja: number;
  precio_base: string;
  precio: string; // Precio calculado según la lista del usuario
  tiene_stock: boolean; // Indica si el producto tiene stock disponible
  url_imagen?: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

// ========== Cart Types ==========

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

// ========== Pedido Types ==========

export type PedidoEstado = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO';

export interface ListaPrecio {
  id: number;
  nombre: string;
  codigo: string;
  descuento_porcentaje: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface PedidoItem {
  id: number;
  producto?: number;
  producto_detalle?: Producto;
  producto_nombre?: string;
  producto_codigo?: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  descuento: string;
  fecha_creacion: string;
}

export interface Pedido {
  id: number;
  cliente: number;
  cliente_nombre: string;
  estado: PedidoEstado;
  lista_precio?: number;
  lista_precio_nombre?: string;
  lista_precio_descuento?: string;
  subtotal: string;
  descuento_total: string;
  total: string;
  items: PedidoItem[];
  notas?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_confirmacion?: string;
  fecha_entrega?: string;
}

export interface CreatePedidoData {
  cliente?: number;
  lista_precio: number;
  items: Array<{
    producto: number;
    cantidad: number;
  }>;
  notas?: string;
}

// ========== API Response Types ==========

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  error: string;
  [key: string]: any;
}

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Producto, Promocion } from '@/types';

interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
};

/**
 * Calcula el total del carrito sumando productos y promociones
 */
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    let precio = 0;
    
    if (item.tipo === 'producto' && item.producto) {
      precio = parseFloat(item.producto.precio);
    } else if (item.tipo === 'promocion' && item.promocion) {
      precio = parseFloat(item.promocion.precio);
    }
    
    if (isNaN(precio)) return sum;
    return sum + (precio * item.cantidad);
  }, 0);
};

/**
 * Genera un ID único para el item del carrito
 */
const getItemId = (item: CartItem): string => {
  if (item.tipo === 'producto' && item.producto) {
    return `producto-${item.producto.id}`;
  }
  if (item.tipo === 'promocion' && item.promocion) {
    return `promocion-${item.promocion.id}`;
  }
  return '';
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /**
     * Agrega un producto al carrito
     */
    addToCart: (state, action: PayloadAction<{ producto: Producto; cantidad: number }>) => {
      const { producto, cantidad } = action.payload;
      
      const existingItem = state.items.find(
        item => item.tipo === 'producto' && item.producto?.id === producto.id
      );
      
      if (existingItem) {
        existingItem.cantidad += cantidad;
      } else {
        state.items.push({
          tipo: 'producto',
          producto,
          cantidad,
        });
      }
      
      state.total = calculateTotal(state.items);
    },

    /**
     * Agrega una promoción al carrito
     */
    addPromocionToCart: (state, action: PayloadAction<{ promocion: Promocion; cantidad: number }>) => {
      const { promocion, cantidad } = action.payload;
      
      const existingItem = state.items.find(
        item => item.tipo === 'promocion' && item.promocion?.id === promocion.id
      );
      
      if (existingItem) {
        existingItem.cantidad += cantidad;
      } else {
        state.items.push({
          tipo: 'promocion',
          promocion,
          cantidad,
        });
      }
      
      state.total = calculateTotal(state.items);
    },

    /**
     * Elimina un producto del carrito por ID
     */
    removeFromCart: (state, action: PayloadAction<number>) => {
      const productoId = action.payload;
      state.items = state.items.filter(
        item => !(item.tipo === 'producto' && item.producto?.id === productoId)
      );
      state.total = calculateTotal(state.items);
    },

    /**
     * Elimina una promoción del carrito por ID
     */
    removePromocionFromCart: (state, action: PayloadAction<number>) => {
      const promocionId = action.payload;
      state.items = state.items.filter(
        item => !(item.tipo === 'promocion' && item.promocion?.id === promocionId)
      );
      state.total = calculateTotal(state.items);
    },

    /**
     * Actualiza la cantidad de un producto en el carrito
     */
    updateQuantity: (state, action: PayloadAction<{ productoId: number; cantidad: number }>) => {
      const { productoId, cantidad } = action.payload;
      const item = state.items.find(
        i => i.tipo === 'producto' && i.producto?.id === productoId
      );
      
      if (item) {
        if (cantidad <= 0) {
          state.items = state.items.filter(
            i => !(i.tipo === 'producto' && i.producto?.id === productoId)
          );
        } else {
          item.cantidad = cantidad;
        }
      }
      
      state.total = calculateTotal(state.items);
    },

    /**
     * Actualiza la cantidad de una promoción en el carrito
     */
    updatePromocionQuantity: (state, action: PayloadAction<{ promocionId: number; cantidad: number }>) => {
      const { promocionId, cantidad } = action.payload;
      const item = state.items.find(
        i => i.tipo === 'promocion' && i.promocion?.id === promocionId
      );
      
      if (item) {
        if (cantidad <= 0) {
          state.items = state.items.filter(
            i => !(i.tipo === 'promocion' && i.promocion?.id === promocionId)
          );
        } else {
          item.cantidad = cantidad;
        }
      }
      
      state.total = calculateTotal(state.items);
    },

    /**
     * Limpia el carrito completamente
     */
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const {
  addToCart,
  addPromocionToCart,
  removeFromCart,
  removePromocionFromCart,
  updateQuantity,
  updatePromocionQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

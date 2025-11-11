import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Producto } from '@/types';

interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
};

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    const precio = parseFloat(item.producto.precio);
    if (isNaN(precio)) {
      return sum;
    }
    return sum + (precio * item.cantidad);
  }, 0);
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ producto: Producto; cantidad: number }>) => {
      const { producto, cantidad } = action.payload;
      
      const existingItem = state.items.find(item => item.producto.id === producto.id);
      
      if (existingItem) {
        existingItem.cantidad += cantidad;
      } else {
        state.items.push({ producto, cantidad });
      }
      
      state.total = calculateTotal(state.items);
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.producto.id !== action.payload);
      state.total = calculateTotal(state.items);
    },

    updateQuantity: (state, action: PayloadAction<{ productoId: number; cantidad: number }>) => {
      const { productoId, cantidad } = action.payload;
      const item = state.items.find(item => item.producto.id === productoId);
      
      if (item) {
        if (cantidad <= 0) {
          state.items = state.items.filter(i => i.producto.id !== productoId);
        } else {
          item.cantidad = cantidad;
        }
      }
      
      state.total = calculateTotal(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

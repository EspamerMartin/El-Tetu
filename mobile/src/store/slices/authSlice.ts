import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  access_token: null,
  refresh_token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async Thunks

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const data = await authAPI.login(credentials);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('access_token', data.access);
      await AsyncStorage.setItem('refresh_token', data.refresh);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al iniciar sesión');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(data);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('access_token', response.access);
      await AsyncStorage.setItem('refresh_token', response.refresh);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Error al registrarse');
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const access = await AsyncStorage.getItem('access_token');
      const refresh = await AsyncStorage.getItem('refresh_token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (access && refresh && userStr) {
        const user = JSON.parse(userStr);
        return { user, access, refresh };
      }
      
      return rejectWithValue('No stored auth');
    } catch (error) {
      return rejectWithValue('Error loading stored auth');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: { telefono?: string; direccion?: string }, { rejectWithValue }) => {
    try {
      const updatedUser = await authAPI.updateProfile(data);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al actualizar perfil');
    }
  }
);

// Slice

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.access_token = action.payload.access;
      state.refresh_token = action.payload.refresh;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.access_token = action.payload.access;
      state.refresh_token = action.payload.refresh;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Load Stored Auth
    builder.addCase(loadStoredAuth.fulfilled, (state, action: any) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.access_token = action.payload.access;
      state.refresh_token = action.payload.refresh;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.access_token = null;
      state.refresh_token = null;
      state.isAuthenticated = false;
    });

    // Update Profile
    builder.addCase(updateProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;

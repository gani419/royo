import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '@royo/types';

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthenticatedUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.isLoading = false;
    },
    clearAuthenticatedUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.isLoading = false;
    },
    setAuthInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
});

export const {
  setAuthLoading,
  setAuthenticatedUser,
  clearAuthenticatedUser,
  setAuthInitialized,
} = authSlice.actions;

export default authSlice.reducer;


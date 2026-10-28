import { configureStore } from '@reduxjs/toolkit';
import { rootReducer, RootState } from './rootReducer';
import { baseApi } from './api/baseApi';

export interface CreateStoreOptions {
  preloadedState?: Partial<RootState>;
}

export function createAppStore(options: CreateStoreOptions = {}) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: options.preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(baseApi.middleware),
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];


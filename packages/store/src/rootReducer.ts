import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import vehicleReducer from "./slices/vehicleSlice";
import chatReducer from "./slices/chatSlice";
import aiUsageReducer from "./slices/aiUsageSlice";
import appSettingsReducer from "./slices/appSettingsSlice";
import { baseApi } from "./api/baseApi";

const combinedReducer = combineReducers({
  auth: authReducer,
  vehicle: vehicleReducer,
  chat: chatReducer,
  aiUsage: aiUsageReducer,
  appSettings: appSettingsReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export const rootReducer: typeof combinedReducer = (state, action) =>
  combinedReducer(
    action.type === "auth/clearAuthenticatedUser" ? undefined : state,
    action,
  );

export type RootState = ReturnType<typeof rootReducer>;

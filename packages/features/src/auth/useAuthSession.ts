import { useCallback } from "react";
import {
  useAppDispatch,
  useAppSelector,
  setAuthenticatedUser,
  clearAuthenticatedUser,
  setAuthLoading,
  setAuthInitialized,
  getSharedApiClient,
} from "@royo/store";
import { AuthService, LoginPayload, RegisterPayload } from "@royo/api";
import { UserProfile } from "@royo/types";

export function useAuthSession() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialized, isLoading } = useAppSelector(
    (state) => state.auth,
  );

  const getAuthService = useCallback(() => {
    return new AuthService(getSharedApiClient());
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<UserProfile> => {
      dispatch(setAuthLoading(true));
      try {
        const authService = getAuthService();
        const response = await authService.login(payload);
        dispatch(setAuthenticatedUser(response.user));
        return response.user;
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch, getAuthService],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<UserProfile> => {
      dispatch(setAuthLoading(true));
      try {
        const authService = getAuthService();
        const response = await authService.register(payload);
        dispatch(setAuthenticatedUser(response.user));
        return response.user;
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch, getAuthService],
  );

  const logout = useCallback(async (): Promise<void> => {
    dispatch(setAuthLoading(true));
    try {
      const authService = getAuthService();
      await authService.logout().catch(() => {});
    } finally {
      dispatch(clearAuthenticatedUser());
    }
  }, [dispatch, getAuthService]);

  const checkSession = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const authService = getAuthService();
      const profile = await authService.getProfile();
      dispatch(setAuthenticatedUser(profile));
      return profile;
    } catch {
      dispatch(clearAuthenticatedUser());
      return null;
    } finally {
      dispatch(setAuthInitialized(true));
    }
  }, [dispatch, getAuthService]);

  return {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    login,
    register,
    logout,
    checkSession,
  };
}

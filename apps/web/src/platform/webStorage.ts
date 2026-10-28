import { ITokenStorage } from "@royo/platform";

const ACCESS_TOKEN_KEY = "royo_access_token";
const REFRESH_TOKEN_KEY = "royo_refresh_token";

/**
 * Web Platform Implementation of ITokenStorage.
 * Access token: memory/sessionStorage. Refresh token: localStorage.
 * Production hardening should migrate refresh tokens to HttpOnly cookies.
 */
export class WebTokenStorage implements ITokenStorage {
  private memoryAccessToken: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.memoryAccessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    }
  }

  public async getAccessToken(): Promise<string | null> {
    if (this.memoryAccessToken) return this.memoryAccessToken;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  }

  public async setAccessToken(token: string): Promise<void> {
    this.memoryAccessToken = token;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  }

  public async getRefreshToken(): Promise<string | null> {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  public async setRefreshToken(token: string): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  }

  public async setTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    await this.setAccessToken(accessToken);
    await this.setRefreshToken(refreshToken);
  }

  public async clearTokens(): Promise<void> {
    this.memoryAccessToken = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}

export const webTokenStorage = new WebTokenStorage();

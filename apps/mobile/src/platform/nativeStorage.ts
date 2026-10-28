import { ITokenStorage } from "@royo/platform";
import * as SecureStore from "expo-secure-store";

/**
 * Mobile Native Implementation of ITokenStorage.
 * Access tokens stay in memory; refresh tokens persist in the device keystore via Expo SecureStore.
 */
export class NativeTokenStorage implements ITokenStorage {
  private accessToken: string | null = null;

  public async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  public async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
  }

  public async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync("royo_refresh_token");
  }

  public async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync("royo_refresh_token", token);
  }

  public async setTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    this.accessToken = accessToken;
    await this.setRefreshToken(refreshToken);
  }

  public async clearTokens(): Promise<void> {
    this.accessToken = null;
    await SecureStore.deleteItemAsync("royo_refresh_token");
  }
}

export const nativeTokenStorage = new NativeTokenStorage();

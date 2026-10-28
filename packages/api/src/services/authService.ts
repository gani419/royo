import { ApiClient } from "../apiClient";
import { ApiEndpoints } from "../ApiEndpoints";
import { AuthSessionResponse, UserProfile } from "@royo/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export class AuthService {
  constructor(private client: ApiClient) {}

  public async login(payload: LoginPayload): Promise<AuthSessionResponse> {
    const response = await this.client.post<AuthSessionResponse>(
      ApiEndpoints.AUTH.LOGIN,
      payload,
      { requiresAuth: false },
    );
    await this.client.saveSession(response.tokens);
    return response;
  }

  public async register(
    payload: RegisterPayload,
  ): Promise<AuthSessionResponse> {
    const response = await this.client.post<AuthSessionResponse>(
      ApiEndpoints.AUTH.REGISTER,
      payload,
      { requiresAuth: false },
    );
    await this.client.saveSession(response.tokens);
    return response;
  }

  public async logout(): Promise<{ message: string }> {
    await this.client.endSession();
    return { message: "Logged out successfully" };
  }

  public async getProfile(): Promise<UserProfile> {
    return this.client.get<UserProfile>(ApiEndpoints.AUTH.ME);
  }
}

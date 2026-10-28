import { ITokenStorage } from "@royo/platform";
import {
  ApiError,
  UnauthorizedError,
  QuotaExceededError,
  NetworkError,
  TimeoutError,
} from "./apiErrors";
import {
  ApiResponseEnvelope,
  ApiErrorResponseEnvelope,
  HttpMethod,
  RequestOptions,
} from "./apiTypes";
import { ApiEndpoints } from "./ApiEndpoints";
import { AuthSessionResponse } from "@royo/types";

export interface ApiClientConfig {
  baseUrl: string;
  defaultTimeoutMs?: number;
  tokenStorage?: ITokenStorage;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;
  private tokenStorage?: ITokenStorage;
  private onUnauthorized?: () => void;

  // Concurrency mutex for refresh token rotation
  private refreshPromise: Promise<string | null> | null = null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 15000;
    this.tokenStorage = config.tokenStorage;
    this.onUnauthorized = config.onUnauthorized;
  }

  public setTokenStorage(storage: ITokenStorage): void {
    this.tokenStorage = storage;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, "");
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async saveSession(
    tokens: AuthSessionResponse["tokens"],
  ): Promise<void> {
    await this.tokenStorage?.setTokens(tokens.accessToken, tokens.refreshToken);
  }

  public async endSession(): Promise<void> {
    const refreshToken = await this.tokenStorage?.getRefreshToken();
    try {
      if (refreshToken)
        await this.post(
          ApiEndpoints.AUTH.LOGOUT,
          { refreshToken },
          { requiresAuth: false },
        );
    } finally {
      await this.tokenStorage?.clearTokens();
    }
  }

  /**
   * Universal HTTP Request method with automatic token injection and refresh retry.
   */
  public async request<TResponse, TBody = unknown>(
    method: HttpMethod,
    path: string,
    body?: TBody,
    options: RequestOptions = {},
    hasRetried = false,
  ): Promise<TResponse> {
    const {
      headers = {},
      params,
      signal,
      timeoutMs = this.defaultTimeoutMs,
      requiresAuth = true,
    } = options;

    const url = this.buildUrl(path, params);
    const requestHeaders = new Headers();
    requestHeaders.set("Content-Type", "application/json");
    requestHeaders.set("Accept", "application/json");

    // Merge custom headers
    Object.entries(headers).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });

    // Inject Access Token if authenticated
    if (requiresAuth && this.tokenStorage) {
      const accessToken = await this.tokenStorage.getAccessToken();
      if (accessToken) {
        requestHeaders.set("Authorization", `Bearer ${accessToken}`);
      }
    }

    // Set up request timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Chain external abort signal if provided
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      if (controller.signal.aborted) {
        throw new TimeoutError(`Request timed out after ${timeoutMs}ms`);
      }
      throw new NetworkError(
        err instanceof Error ? err.message : "Network connection failed",
      );
    } finally {
      clearTimeout(timer);
    }

    // Handle 401 Unauthorized with concurrency-safe refresh token mutex
    if (response.status === 401 && requiresAuth && this.tokenStorage) {
      if (hasRetried) {
        await this.tokenStorage.clearTokens();
        this.onUnauthorized?.();
        throw new UnauthorizedError();
      }
      const newAccessToken = await this.executeTokenRefreshMutex();
      if (newAccessToken) {
        // Retry the original request with the fresh token
        return this.request<TResponse, TBody>(
          method,
          path,
          body,
          {
            ...options,
            requiresAuth: true,
          },
          true,
        );
      } else {
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new UnauthorizedError();
      }
    }

    // Process Response Body
    return this.handleResponse<TResponse>(response);
  }

  // Convenience HTTP Methods
  public get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  public post<T, B = unknown>(
    path: string,
    body?: B,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T, B>("POST", path, body, options);
  }

  public put<T, B = unknown>(
    path: string,
    body?: B,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T, B>("PUT", path, body, options);
  }

  public patch<T, B = unknown>(
    path: string,
    body?: B,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T, B>("PATCH", path, body, options);
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", path, undefined, options);
  }

  /**
   * Thread/Promise-safe Mutex for Token Refresh.
   * Ensures only ONE network request is sent to /api/v1/auth/refresh regardless of how many
   * concurrent requests received a 401 status.
   */
  private async executeTokenRefreshMutex(): Promise<string | null> {
    const storage = this.tokenStorage;
    if (!storage) return null;

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          await storage.clearTokens();
          return null;
        }

        const refreshResponse = await fetch(
          `${this.baseUrl}${ApiEndpoints.AUTH.REFRESH}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          },
        );

        if (!refreshResponse.ok) {
          await storage.clearTokens();
          return null;
        }

        const payload: ApiResponseEnvelope<AuthSessionResponse> =
          await refreshResponse.json();

        const { accessToken, refreshToken: newRefreshToken } =
          payload.data.tokens;

        await storage.setTokens(accessToken, newRefreshToken);
        return accessToken;
      } catch {
        await storage.clearTokens();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const fullUrl = new URL(
      path.startsWith("http") ? path : `${this.baseUrl}${path}`,
    );

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          fullUrl.searchParams.append(key, String(val));
        }
      });
    }

    return fullUrl.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      if (response.status === 429) {
        throw new QuotaExceededError();
      }

      if (isJson) {
        const errData = (await response.json()) as ApiErrorResponseEnvelope;
        throw new ApiError(
          errData?.error?.message || `HTTP ${response.status}`,
          response.status,
          errData?.error?.code || "API_ERROR",
          errData?.error?.details,
        );
      }

      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
      );
    }

    if (isJson) {
      const data = await response.json();
      // Unwrap standard response envelope if present
      if (
        typeof data === "object" &&
        data !== null &&
        "data" in data &&
        "success" in data
      ) {
        return (data as ApiResponseEnvelope<T>).data;
      }
      return data as T;
    }

    return (await response.text()) as unknown as T;
  }
}

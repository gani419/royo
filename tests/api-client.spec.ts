import { test, expect } from "@playwright/test";
import { ApiClient } from "../packages/api/src/apiClient";

function storage() {
  let access: string | null = "old",
    refresh: string | null = "refresh";
  return {
    getAccessToken: async () => access,
    getRefreshToken: async () => refresh,
    setAccessToken: async (v: string) => {
      access = v;
    },
    setRefreshToken: async (v: string) => {
      refresh = v;
    },
    setTokens: async (a: string, r: string) => {
      access = a;
      refresh = r;
    },
    clearTokens: async () => {
      access = null;
      refresh = null;
    },
  };
}
test("repeated unauthorized response retries once then clears credentials", async () => {
  const saved = globalThis.fetch;
  const tokens = storage();
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    return String(url).endsWith("/auth/refresh")
      ? Response.json({
          data: { tokens: { accessToken: "fresh", refreshToken: "rotated" } },
        })
      : Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
  };
  try {
    await expect(
      new ApiClient({
        baseUrl: "http://example.test",
        tokenStorage: tokens,
      }).get("/protected"),
    ).rejects.toThrow();
    expect(calls).toBe(3);
    expect(await tokens.getRefreshToken()).toBeNull();
  } finally {
    globalThis.fetch = saved;
  }
});
test("logout submits refresh token and clears storage even when offline", async () => {
  const saved = globalThis.fetch;
  const tokens = storage();
  let body = "";
  globalThis.fetch = async (_url, init) => {
    body = String(init?.body);
    throw new Error("Offline");
  };
  try {
    await expect(
      new ApiClient({
        baseUrl: "http://example.test",
        tokenStorage: tokens,
      }).endSession(),
    ).rejects.toThrow();
    expect(JSON.parse(body)).toEqual({ refreshToken: "refresh" });
    expect(await tokens.getAccessToken()).toBeNull();
    expect(await tokens.getRefreshToken()).toBeNull();
  } finally {
    globalThis.fetch = saved;
  }
});

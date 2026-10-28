import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { ApiClient, ApiError, HttpMethod, RequestOptions } from '@royo/api';

export interface BaseQueryArgs {
  url: string;
  method?: HttpMethod;
  body?: unknown;
  options?: RequestOptions;
}

let sharedApiClient: ApiClient | null = null;

export const setSharedApiClient = (client: ApiClient): void => {
  sharedApiClient = client;
};

export const getSharedApiClient = (): ApiClient => {
  if (!sharedApiClient) {
    throw new Error(
      'Shared ApiClient has not been initialized. Call setSharedApiClient() during app bootstrapping.'
    );
  }
  return sharedApiClient;
};

const customApiClientBaseQuery: BaseQueryFn<
  BaseQueryArgs,
  unknown,
  { status?: number; data?: unknown; message: string }
> = async ({ url, method = 'GET', body, options }) => {
  try {
    const client = getSharedApiClient();
    const result = await client.request(method, url, body, options);
    return { data: result };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        error: {
          status: error.status,
          data: error.details,
          message: error.message,
        },
      };
    }
    return {
      error: {
        status: 500,
        message:
          error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: customApiClientBaseQuery,
  tagTypes: ['User', 'Vehicles', 'ChatSessions', 'ChatMessages', 'AIQuota'],
  endpoints: () => ({}),
});


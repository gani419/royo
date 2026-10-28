export type EntityId = string;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export type Nullable<T> = T | null;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}


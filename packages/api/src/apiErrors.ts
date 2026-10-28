export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    status = 500,
    code = 'INTERNAL_ERROR',
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required. Please log in again.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class QuotaExceededError extends ApiError {
  public readonly resetsAt?: string;

  constructor(
    message = 'Daily AI message quota exceeded. Please upgrade or try again tomorrow.',
    resetsAt?: string
  ) {
    super(message, 429, 'QUOTA_EXCEEDED');
    this.name = 'QuotaExceededError';
    this.resetsAt = resetsAt;
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Unable to reach the ROYO servers. Please check your internet connection.') {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message = 'The server request timed out. Please try again.') {
    super(message, 408, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}


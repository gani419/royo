export const ApiEndpoints = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
  },

  VEHICLES: {
    LIST: '/api/v1/vehicles',
    CREATE: '/api/v1/vehicles',
    DETAILS: (id: string) => `/api/v1/vehicles/${id}`,
    UPDATE: (id: string) => `/api/v1/vehicles/${id}`,
    DELETE: (id: string) => `/api/v1/vehicles/${id}`,
    MAINTENANCE: (id: string) => `/api/v1/vehicles/${id}/maintenance`,
    MODELS: '/api/v1/vehicles/models',
    MANUFACTURERS: '/api/v1/vehicles/manufacturers',
  },

  CHAT: {
    SESSIONS: '/api/v1/chat/sessions',
    SESSION_DETAILS: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}`,
    MESSAGES: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/messages`,
  },

  AI: {
    QUOTA: '/api/v1/ai/quota',
    DIAGNOSE: '/api/v1/ai/diagnose',
  },

  YOUTUBE: {
    SEARCH: '/api/v1/videos/search',
  },

  HEALTH: '/api/v1/health',
} as const;

export type ApiEndpointsType = typeof ApiEndpoints;


import { EntityId, Timestamps } from './common';

export type UserRole = 'rider' | 'mechanic' | 'admin';

export interface UserProfile extends Timestamps {
  id: EntityId;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthSessionResponse {
  user: UserProfile;
  tokens: AuthTokens;
}


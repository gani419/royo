import { EntityId } from './common';

export interface UserAIQuota {
  userId: EntityId;
  dailyLimit: number;
  messagesUsedToday: number;
  remainingMessages: number;
  resetsAt: string; // ISO 8601 string
  planName: 'FREE' | 'RIDER_PRO' | 'WORKSHOP';
}


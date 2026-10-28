import { EntityId, Timestamps } from './common';
import { Vehicle } from './vehicle';
import { AIStructuredResponse } from './ai';
import { YouTubeVideoItem } from './youtube';

export type MessageSenderType = 'user' | 'assistant' | 'system';

export interface ChatMessage extends Timestamps {
  id: EntityId;
  sessionId: EntityId;
  senderType: MessageSenderType;
  content: string;
  structuredData?: AIStructuredResponse;
  videos?: YouTubeVideoItem[];
}

export interface ChatSession extends Timestamps {
  id: EntityId;
  userId: EntityId;
  vehicleId: EntityId;
  vehicle?: Vehicle;
  title: string;
  lastMessageSnippet?: string;
  messageCount: number;
}

export interface SendMessageDto {
  content: string;
}


import { ApiClient } from '../apiClient';
import { ApiEndpoints } from '../ApiEndpoints';
import {
  ChatSession,
  ChatMessage,
  SendMessageDto,
} from '@royo/types';

export interface CreateChatSessionDto {
  vehicleId: string;
  initialMessage?: string;
}

export class ChatService {
  constructor(private client: ApiClient) {}

  public async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(ApiEndpoints.CHAT.SESSION_DETAILS(sessionId));
  }

  public async getSessions(): Promise<ChatSession[]> {
    return this.client.get<ChatSession[]>(ApiEndpoints.CHAT.SESSIONS);
  }

  public async getSessionById(sessionId: string): Promise<ChatSession> {
    return this.client.get<ChatSession>(ApiEndpoints.CHAT.SESSION_DETAILS(sessionId));
  }

  public async createSession(dto: CreateChatSessionDto): Promise<ChatSession> {
    return this.client.post<ChatSession>(ApiEndpoints.CHAT.SESSIONS, dto);
  }

  public async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.client.get<ChatMessage[]>(ApiEndpoints.CHAT.MESSAGES(sessionId));
  }

  public async sendMessage(
    sessionId: string,
    dto: SendMessageDto
  ): Promise<ChatMessage> {
    return this.client.post<ChatMessage>(
      ApiEndpoints.CHAT.MESSAGES(sessionId),
      dto,
      { timeoutMs: 30000 } // Longer timeout for AI analysis and video fetch
    );
  }
}


import { ApiClient } from '../apiClient';
import { ApiEndpoints } from '../ApiEndpoints';
import { UserAIQuota, AIStructuredResponse } from '@royo/types';

export interface QuickDiagnoseDto {
  vehicleId: string;
  symptoms: string;
}

export class AIService {
  constructor(private client: ApiClient) {}

  public async getQuota(): Promise<UserAIQuota> {
    return this.client.get<UserAIQuota>(ApiEndpoints.AI.QUOTA);
  }

  public async quickDiagnose(dto: QuickDiagnoseDto): Promise<AIStructuredResponse> {
    return this.client.post<AIStructuredResponse>(
      ApiEndpoints.AI.DIAGNOSE,
      dto,
      { timeoutMs: 30000 }
    );
  }
}


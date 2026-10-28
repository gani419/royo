import { ApiClient } from '../apiClient';
import { ApiEndpoints } from '../ApiEndpoints';
import { VideoSearchResponse } from '@royo/types';

export class YouTubeService {
  constructor(private client: ApiClient) {}

  public async searchVideos(query: string, maxResults = 5): Promise<VideoSearchResponse> {
    return this.client.get<VideoSearchResponse>(ApiEndpoints.YOUTUBE.SEARCH, {
      params: { q: query, maxResults },
    });
  }
}


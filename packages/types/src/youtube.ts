export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  videoUrl: string;
}

export interface VideoSearchResponse {
  query: string;
  videos: YouTubeVideoItem[];
  cached: boolean;
}


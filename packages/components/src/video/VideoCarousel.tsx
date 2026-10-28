import React from 'react';
import { spacing } from '@royo/theme';
import { YouTubeVideoItem } from '@royo/types';
import { YouTubeVideoCard } from './YouTubeVideoCard';

export interface VideoCarouselProps {
  videos: YouTubeVideoItem[];
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({ videos }) => {
  if (!videos || videos.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: `${spacing.md}px`,
        overflowX: 'auto',
        paddingBottom: `${spacing.sm}px`,
        scrollbarWidth: 'thin',
      }}
    >
      {videos.map((v) => (
        <YouTubeVideoCard key={v.id} video={v} />
      ))}
    </div>
  );
};


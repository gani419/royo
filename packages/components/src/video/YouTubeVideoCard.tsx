import React from 'react';
import { colors, spacing, borderRadius } from '@royo/theme';
import { YouTubeVideoItem } from '@royo/types';

export interface YouTubeVideoCardProps {
  video: YouTubeVideoItem;
  style?: React.CSSProperties;
}

export const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({ video, style }) => {
  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.dark.surfaceElevated,
        border: `1px solid ${colors.dark.border}`,
        borderRadius: `${borderRadius.md}px`,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
        width: '260px',
        flexShrink: 0,
        ...style,
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '145px', backgroundColor: '#000' }}>
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '16px',
              paddingLeft: '2px',
            }}
          >
            ▶
          </div>
        </div>
      </div>

      <div style={{ padding: `${spacing.md}px`, display: 'flex', flexDirection: 'column', gap: `${spacing.xs}px` }}>
        <h4
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: colors.dark.textPrimary,
            margin: 0,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </h4>
        <span style={{ fontSize: '11px', color: colors.dark.textMuted }}>
          {video.channelTitle}
        </span>
      </div>
    </a>
  );
};

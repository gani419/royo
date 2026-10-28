import React from 'react';
import { colors, spacing, borderRadius } from '@royo/theme';
import { ChatMessage } from '@royo/types';
import { formatRelativeTime } from '@royo/utils';
import { AIResponseCard } from './AIResponseCard';

export interface AIChatMessageProps {
  message: ChatMessage;
  onYouTubeQueryClick?: (query: string) => void;
  onFollowUpClick?: (question: string) => void;
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({
  message,
  onYouTubeQueryClick,
  onFollowUpClick,
}) => {
  const isUser = message.senderType === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        width: '100%',
        marginBottom: `${spacing.lg}px`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${spacing.xs}px`,
          marginBottom: `${spacing.xxs}px`,
          fontSize: '12px',
          color: colors.dark.textMuted,
        }}
      >
        <span>{isUser ? 'You (Rider)' : 'ROYO AI Assistant'}</span>
        <span>•</span>
        <span>{formatRelativeTime(message.createdAt)}</span>
      </div>

      <div
        style={{
          maxWidth: isUser ? '80%' : '100%',
          width: isUser ? 'auto' : '100%',
          backgroundColor: isUser ? colors.brand.primary : 'var(--bg-surface)',
          backgroundImage: isUser ? 'var(--gradient-user-bubble, linear-gradient(135deg, #6366F1 0%, #7C3AED 100%))' : undefined,
          color: isUser ? '#FFFFFF' : 'var(--text-primary)',
          border: `1px solid ${isUser ? 'transparent' : 'var(--border-color)'}`,
          borderRadius: `${borderRadius.lg}px`,
          padding: `${spacing.lg}px`,
          boxShadow: isUser ? 'var(--shadow-purple-pill)' : 'var(--shadow-md)',
        }}
      >
        {isUser ? (
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5, fontWeight: 500, color: '#FFFFFF' }}>
            {message.content}
          </p>
        ) : message.structuredData ? (
          <AIResponseCard
            data={message.structuredData}
            videos={message.videos}
            onYouTubeQueryClick={onYouTubeQueryClick}
            onFollowUpClick={onFollowUpClick}
          />
        ) : (
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5 }}>
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
};


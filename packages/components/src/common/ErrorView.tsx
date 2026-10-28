import React from 'react';
import { colors, spacing, borderRadius } from '@royo/theme';
import { Button } from './Button';

export interface ErrorViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: React.CSSProperties;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  style,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${colors.status.error}`,
        borderRadius: `${borderRadius.md}px`,
        padding: `${spacing.lg}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${spacing.sm}px`,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
        <span style={{ color: colors.status.error, fontWeight: 700, fontSize: '18px' }}>
          ⚠
        </span>
        <h4 style={{ color: colors.status.error, margin: 0, fontSize: '15px', fontWeight: 600 }}>
          {title}
        </h4>
      </div>

      <p style={{ margin: 0, color: colors.dark.textSecondary, fontSize: '14px', lineHeight: 1.5 }}>
        {message}
      </p>

      {onRetry && (
        <div style={{ marginTop: `${spacing.xs}px` }}>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};


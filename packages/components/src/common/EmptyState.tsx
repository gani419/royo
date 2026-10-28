import React from 'react';
import { colors, spacing, borderRadius } from '@royo/theme';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: `${spacing.xxxl}px ${spacing.xl}px`,
        backgroundColor: colors.dark.surface,
        border: `1px dashed ${colors.dark.border}`,
        borderRadius: `${borderRadius.lg}px`,
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: '36px',
            marginBottom: `${spacing.md}px`,
            color: colors.brand.primary,
          }}
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: colors.dark.textPrimary,
          marginBottom: `${spacing.xs}px`,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '14px',
          color: colors.dark.textSecondary,
          maxWidth: '400px',
          lineHeight: 1.5,
          marginBottom: actionLabel ? `${spacing.lg}px` : 0,
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};


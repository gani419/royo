import React from 'react';
import { colors, spacing } from '@royo/theme';

export interface LoaderProps {
  size?: number;
  color?: string;
  label?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 32,
  color = colors.brand.primary,
  label,
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${spacing.sm}px`,
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `3px solid ${colors.dark.surfaceElevated}`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && (
        <span style={{ fontSize: '13px', color: colors.dark.textSecondary }}>
          {label}
        </span>
      )}
    </div>
  );
};


import React from 'react';
import { colors, spacing, borderRadius } from '@royo/theme';
import { UserAIQuota } from '@royo/types';

export interface QuotaIndicatorProps {
  quota: UserAIQuota | null;
  remaining?: number;
  onUpgrade?: () => void;
  style?: React.CSSProperties;
}

export const QuotaIndicator: React.FC<QuotaIndicatorProps> = ({
  quota,
  remaining,
  onUpgrade,
  style,
}) => {
  const effectiveRemaining = remaining !== undefined ? remaining : (quota?.remainingMessages ?? 5);
  const dailyLimit = quota?.dailyLimit ?? 5;

  let badgeColor: string = colors.status.success;
  let bgColor: string = 'rgba(16, 185, 129, 0.15)';

  if (effectiveRemaining <= 1) {
    badgeColor = colors.status.error;
    bgColor = 'rgba(239, 68, 68, 0.15)';
  } else if (effectiveRemaining <= 2) {
    badgeColor = colors.status.warning;
    bgColor = 'rgba(245, 158, 11, 0.15)';
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${spacing.sm}px`,
        backgroundColor: bgColor,
        border: `1px solid ${badgeColor}`,
        borderRadius: `${borderRadius.full}px`,
        padding: `${spacing.xxs}px ${spacing.md}px`,
        fontSize: '12px',
        fontWeight: 600,
        color: badgeColor,
        ...style,
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: badgeColor,
        }}
      />
      <span>
        {effectiveRemaining}/{dailyLimit} Daily AI Diagnostics
      </span>
      {effectiveRemaining === 0 && onUpgrade && (
        <button
          onClick={onUpgrade}
          style={{
            background: 'none',
            border: 'none',
            color: colors.brand.primary,
            textDecoration: 'underline',
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            fontSize: '12px',
          }}
        >
          Upgrade
        </button>
      )}
    </div>
  );
};

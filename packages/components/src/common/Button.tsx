import React from 'react';
import { colors, spacing, borderRadius, typography } from '@royo/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  style,
  ...rest
}) => {
  const isInteractive = !disabled && !isLoading;

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      padding: `${spacing.xs}px ${spacing.md}px`,
      fontSize: `${typography.fontSizes.sm}px`,
      borderRadius: `${borderRadius.sm}px`,
    },
    md: {
      padding: `${spacing.sm}px ${spacing.lg}px`,
      fontSize: `${typography.fontSizes.base}px`,
      borderRadius: `${borderRadius.md}px`,
    },
    lg: {
      padding: `${spacing.md}px ${spacing.xl}px`,
      fontSize: `${typography.fontSizes.lg}px`,
      borderRadius: `${borderRadius.md}px`,
    },
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: isInteractive ? colors.brand.primary : colors.dark.surfaceElevated,
      color: isInteractive ? '#000000' : colors.dark.textMuted,
      border: 'none',
      fontWeight: 600,
    },
    secondary: {
      backgroundColor: isInteractive ? colors.dark.surfaceElevated : colors.dark.surface,
      color: isInteractive ? colors.dark.textPrimary : colors.dark.textMuted,
      border: `1px solid ${colors.dark.border}`,
      fontWeight: 500,
    },
    outline: {
      backgroundColor: 'transparent',
      color: isInteractive ? colors.brand.primary : colors.dark.textMuted,
      border: `1px solid ${isInteractive ? colors.brand.primary : colors.dark.border}`,
      fontWeight: 600,
    },
    danger: {
      backgroundColor: isInteractive ? colors.status.error : colors.dark.surfaceElevated,
      color: '#FFFFFF',
      border: 'none',
      fontWeight: 600,
    },
  };

  return (
    <button
      disabled={!isInteractive}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${spacing.sm}px`,
        cursor: isInteractive ? 'pointer' : 'not-allowed',
        opacity: isInteractive ? 1 : 0.6,
        transition: 'all 0.15s ease-in-out',
        outline: 'none',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...rest}
    >
      {isLoading ? (
        <span
          style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
    </button>
  );
};


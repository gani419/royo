import React, { useState } from 'react';
import { colors, spacing, borderRadius, typography } from '@royo/theme';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  type = 'text',
  disabled,
  style,
  id,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.xxs}px`, width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: `${typography.fontSizes.sm}px`,
            fontWeight: 500,
            color: error ? colors.status.error : colors.dark.textSecondary,
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          style={{
            width: '100%',
            backgroundColor: colors.dark.surfaceElevated,
            color: colors.dark.textPrimary,
            border: `1px solid ${error ? colors.status.error : colors.dark.border}`,
            borderRadius: `${borderRadius.md}px`,
            padding: `${spacing.sm}px ${isPassword ? spacing.huge : spacing.md}px ${spacing.sm}px ${spacing.md}px`,
            fontSize: `${typography.fontSizes.base}px`,
            outline: 'none',
            boxSizing: 'border-box',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
            ...style,
          }}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: `${spacing.md}px`,
              background: 'none',
              border: 'none',
              color: colors.dark.textMuted,
              cursor: 'pointer',
              fontSize: '12px',
              padding: `${spacing.xxs}px`,
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: `${typography.fontSizes.xs}px`, color: colors.status.error }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: `${typography.fontSizes.xs}px`, color: colors.dark.textMuted }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};


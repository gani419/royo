import React, { useState, useRef, useEffect } from 'react';
import { colors, spacing, borderRadius } from '@royo/theme';
import { Button } from '../common/Button';

export interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void> | void;
  isLoading?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  initialValue?: string;
}

const MAX_CHARS = 1000;

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  isDisabled = false,
  placeholder = 'Describe vehicle symptoms (e.g., rattling sound when accelerating)...',
  initialValue = '',
}) => {
  const [content, setContent] = useState<string>(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setContent(initialValue);
    }
  }, [initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isLoading || isDisabled || trimmed.length < 5) return;

    setContent('');
    await onSendMessage(trimmed);
  };

  const charsRemaining = MAX_CHARS - content.length;

  return (
    <div
      style={{
        backgroundColor: colors.dark.surface,
        border: `1px solid ${colors.dark.border}`,
        borderRadius: `${borderRadius.lg}px`,
        padding: `${spacing.md}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${spacing.xs}px`,
      }}
    >
      <div style={{ display: 'flex', gap: `${spacing.sm}px`, alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef}
          rows={2}
          value={content}
          disabled={isDisabled || isLoading}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          placeholder={isDisabled ? 'Daily AI quota reached or vehicle not selected' : placeholder}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            color: colors.dark.textPrimary,
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '14px',
            lineHeight: 1.5,
            fontFamily: 'inherit',
          }}
        />

        <Button
          type="button"
          variant="primary"
          size="sm"
          isLoading={isLoading}
          disabled={isDisabled || content.trim().length < 5}
          onClick={handleSubmit}
        >
          Send
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: colors.dark.textMuted }}>
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span style={{ color: charsRemaining < 100 ? colors.status.warning : colors.dark.textMuted }}>
          {content.length}/{MAX_CHARS}
        </span>
      </div>
    </div>
  );
};


import React from 'react';
import { colors, spacing, borderRadius } from '@royo/theme';
import { AIStructuredResponse, LikelihoodLevel, YouTubeVideoItem } from '@royo/types';
import { VideoCarousel } from '../video/VideoCarousel';

export interface AIResponseCardProps {
  data: AIStructuredResponse;
  videos?: YouTubeVideoItem[];
  onYouTubeQueryClick?: (query: string) => void;
  onFollowUpClick?: (question: string) => void;
}

export const AIResponseCard: React.FC<AIResponseCardProps> = ({
  data,
  videos,
  onYouTubeQueryClick,
  onFollowUpClick,
}) => {
  const getLikelihoodColor = (level: LikelihoodLevel): string => {
    switch (level) {
      case 'HIGH':
        return colors.status.error;
      case 'MEDIUM':
        return colors.status.warning;
      case 'LOW':
        return colors.status.success;
      default:
        return colors.dark.textMuted;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.lg}px`, width: '100%' }}>
      {/* Response Overview */}
      <p style={{ fontSize: '15px', lineHeight: 1.6, color: colors.dark.textPrimary, margin: 0 }}>
        {data.responseText}
      </p>

      {/* Safety Warnings Banner */}
      {data.safetyWarnings && data.safetyWarnings.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: `4px solid ${colors.status.error}`,
            padding: `${spacing.md}px`,
            borderRadius: `0 ${borderRadius.sm}px ${borderRadius.sm}px 0`,
          }}
        >
          {data.safetyWarnings.map((warning, idx) => (
            <p
              key={idx}
              style={{
                fontSize: '13px',
                color: colors.status.error,
                margin: idx === 0 ? 0 : `${spacing.xs}px 0 0 0`,
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              ⚠ {warning}
            </p>
          ))}
        </div>
      )}

      {/* Possible Causes List */}
      {data.possibleCauses && data.possibleCauses.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: colors.dark.textMuted,
              marginBottom: `${spacing.sm}px`,
              margin: `0 0 ${spacing.sm}px 0`,
            }}
          >
            Possible Causes
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
            {data.possibleCauses.map((cause, idx) => {
              const color = getLikelihoodColor(cause.likelihood);
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: colors.dark.surfaceElevated,
                    padding: `${spacing.md}px`,
                    borderRadius: `${borderRadius.md}px`,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${spacing.xs}px` }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: colors.dark.textPrimary }}>
                      {cause.component}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color,
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        padding: `${spacing.xxs}px ${spacing.xs}px`,
                        borderRadius: `${borderRadius.xs}px`,
                      }}
                    >
                      {cause.likelihood} LIKELIHOOD
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: colors.dark.textSecondary, margin: 0, lineHeight: 1.5 }}>
                    {cause.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Troubleshooting Steps */}
      {data.troubleshootingSteps && data.troubleshootingSteps.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: colors.dark.textMuted,
              marginBottom: `${spacing.sm}px`,
              margin: `0 0 ${spacing.sm}px 0`,
            }}
          >
            Safe Troubleshooting Steps
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
            {data.troubleshootingSteps.map((step) => (
              <div
                key={step.stepNumber}
                style={{
                  display: 'flex',
                  gap: `${spacing.md}px`,
                  backgroundColor: colors.dark.surfaceElevated,
                  padding: `${spacing.md}px`,
                  borderRadius: `${borderRadius.md}px`,
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: colors.brand.primary,
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {step.stepNumber}
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: colors.dark.textPrimary, margin: 0, lineHeight: 1.5 }}>
                    {step.instruction}
                  </p>
                  {step.safetyPrecaution && (
                    <p style={{ fontSize: '12px', color: colors.status.warning, margin: `${spacing.xxs}px 0 0 0` }}>
                      Precaution: {step.safetyPrecaution}
                    </p>
                  )}
                  {step.toolsRequired && step.toolsRequired.length > 0 && (
                    <div style={{ display: 'flex', gap: `${spacing.xs}px`, marginTop: `${spacing.xs}px`, flexWrap: 'wrap' }}>
                      {step.toolsRequired.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          style={{
                            fontSize: '11px',
                            backgroundColor: colors.dark.surface,
                            color: colors.dark.textSecondary,
                            padding: `2px ${spacing.xs}px`,
                            borderRadius: `${borderRadius.xs}px`,
                          }}
                        >
                          🔧 {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Video Tutorials */}
      {videos && videos.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: colors.dark.textMuted,
              margin: `0 0 ${spacing.sm}px 0`,
            }}
          >
            Verified YouTube Repair Tutorials
          </h4>
          <VideoCarousel videos={videos} />
        </div>
      )}

      {/* Suggested YouTube Tutorials */}
      {data.youtubeSearchQueries && data.youtubeSearchQueries.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: colors.dark.textMuted,
              margin: `0 0 ${spacing.sm}px 0`,
            }}
          >
            Related Video Tutorials
          </h4>
          <div style={{ display: 'flex', gap: `${spacing.xs}px`, flexWrap: 'wrap' }}>
            {data.youtubeSearchQueries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => onYouTubeQueryClick && onYouTubeQueryClick(query)}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid rgba(239, 68, 68, 0.4)`,
                  color: '#F87171',
                  borderRadius: `${borderRadius.full}px`,
                  padding: `${spacing.xs}px ${spacing.md}px`,
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${spacing.xs}px`,
                }}
              >
                <span>▶</span>
                <span>{query}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Questions */}
      {data.followUpQuestions && data.followUpQuestions.length > 0 && (
        <div style={{ borderTop: `1px solid ${colors.dark.border}`, paddingTop: `${spacing.md}px` }}>
          <span style={{ fontSize: '12px', color: colors.dark.textMuted, display: 'block', marginBottom: `${spacing.xs}px` }}>
            Suggested follow-up details:
          </span>
          <div style={{ display: 'flex', gap: `${spacing.xs}px`, flexWrap: 'wrap' }}>
            {data.followUpQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onFollowUpClick && onFollowUpClick(q)}
                style={{
                  backgroundColor: colors.dark.surfaceElevated,
                  border: `1px solid ${colors.dark.border}`,
                  color: colors.dark.textSecondary,
                  borderRadius: `${borderRadius.md}px`,
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                💬 {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tecdroid/royo/internal/models"
)

var ErrQuotaExceeded = errors.New("daily AI message quota exceeded")

type QuotaRepository interface {
	GetUserQuota(ctx context.Context, userID string) (*models.UserQuota, error)
	ReserveQuotaSlot(ctx context.Context, userID string, defaultLimit int) error
	ReleaseQuotaSlot(ctx context.Context, userID string, reservedAt time.Time) error
}

type PostgresQuotaRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresQuotaRepository(pool *pgxpool.Pool) *PostgresQuotaRepository {
	return &PostgresQuotaRepository{pool: pool}
}

func (r *PostgresQuotaRepository) GetUserQuota(ctx context.Context, userID string) (*models.UserQuota, error) {
	query := `
		SELECT messages_used, daily_limit
		FROM ai_user_quotas
		WHERE user_id = $1 AND quota_date = CURRENT_DATE
		LIMIT 1;
	`
	var used, limit int
	err := r.pool.QueryRow(ctx, query, userID).Scan(&used, &limit)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Not yet initialized today
			return &models.UserQuota{
				UserID:            userID,
				DailyLimit:        5,
				MessagesUsedToday: 0,
				RemainingMessages: 5,
				ResetsAt:          getMidnightResetTime(),
				PlanName:          "FREE",
			}, nil
		}
		return nil, fmt.Errorf("failed to query user quota: %w", err)
	}

	remaining := limit - used
	if remaining < 0 {
		remaining = 0
	}

	return &models.UserQuota{
		UserID:            userID,
		DailyLimit:        limit,
		MessagesUsedToday: used,
		RemainingMessages: remaining,
		ResetsAt:          getMidnightResetTime(),
		PlanName:          "FREE",
	}, nil
}

// ReserveQuotaSlot executes an atomic transaction with row-level lock (FOR UPDATE)
func (r *PostgresQuotaRepository) ReserveQuotaSlot(ctx context.Context, userID string, defaultLimit int) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin quota transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Ensure record exists for today
	initQuery := `
		INSERT INTO ai_user_quotas (user_id, quota_date, messages_used, daily_limit, updated_at)
		VALUES ($1, CURRENT_DATE, 0, $2, NOW())
		ON CONFLICT (user_id, quota_date) DO NOTHING;
	`
	if _, err := tx.Exec(ctx, initQuery, userID, defaultLimit); err != nil {
		return fmt.Errorf("failed to ensure quota row: %w", err)
	}

	// Lock the row for update
	selectQuery := `
		SELECT messages_used, daily_limit
		FROM ai_user_quotas
		WHERE user_id = $1 AND quota_date = CURRENT_DATE
		FOR UPDATE;
	`
	var used, limit int
	if err := tx.QueryRow(ctx, selectQuery, userID).Scan(&used, &limit); err != nil {
		return fmt.Errorf("failed to lock quota row: %w", err)
	}

	if used >= limit {
		return ErrQuotaExceeded
	}

	// Increment usage
	updateQuery := `
		UPDATE ai_user_quotas
		SET messages_used = messages_used + 1, updated_at = NOW()
		WHERE user_id = $1 AND quota_date = CURRENT_DATE;
	`
	if _, err := tx.Exec(ctx, updateQuery, userID); err != nil {
		return fmt.Errorf("failed to update quota usage: %w", err)
	}

	return tx.Commit(ctx)
}

func getMidnightResetTime() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)
}

func (r *PostgresQuotaRepository) ReleaseQuotaSlot(ctx context.Context, userID string, reservedAt time.Time) error {
	_, err := r.pool.Exec(ctx, `UPDATE ai_user_quotas SET messages_used = GREATEST(0, messages_used - 1), updated_at = NOW() WHERE user_id = $1 AND quota_date = $2::date`, userID, reservedAt.UTC().Format("2006-01-02"))
	return err
}

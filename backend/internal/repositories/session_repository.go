package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tecdroid/royo/internal/models"
)

var ErrSessionNotFound = errors.New("auth session not found or revoked")

type SessionRepository interface {
	Create(ctx context.Context, session *models.AuthSession) error
	FindByTokenHash(ctx context.Context, tokenHash string) (*models.AuthSession, error)
	Revoke(ctx context.Context, sessionID string) error
	RevokeAllForUser(ctx context.Context, userID string) error
}

type PostgresSessionRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresSessionRepository(pool *pgxpool.Pool) *PostgresSessionRepository {
	return &PostgresSessionRepository{pool: pool}
}

func (r *PostgresSessionRepository) Create(ctx context.Context, session *models.AuthSession) error {
	query := `
		INSERT INTO auth_sessions (user_id, refresh_token_hash, user_agent, client_ip, is_revoked, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING id, created_at;
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		session.UserID,
		session.RefreshTokenHash,
		session.UserAgent,
		session.ClientIP,
		session.IsRevoked,
		session.ExpiresAt,
	).Scan(&session.ID, &session.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}

	return nil
}

func (r *PostgresSessionRepository) FindByTokenHash(ctx context.Context, tokenHash string) (*models.AuthSession, error) {
	query := `
		SELECT id, user_id, refresh_token_hash, user_agent, client_ip, is_revoked, expires_at, created_at
		FROM auth_sessions
		WHERE refresh_token_hash = $1 AND is_revoked = FALSE AND expires_at > NOW()
		LIMIT 1;
	`
	var session models.AuthSession
	err := r.pool.QueryRow(ctx, query, tokenHash).Scan(
		&session.ID,
		&session.UserID,
		&session.RefreshTokenHash,
		&session.UserAgent,
		&session.ClientIP,
		&session.IsRevoked,
		&session.ExpiresAt,
		&session.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSessionNotFound
		}
		return nil, fmt.Errorf("failed to find session: %w", err)
	}

	return &session, nil
}

func (r *PostgresSessionRepository) Revoke(ctx context.Context, sessionID string) error {
	query := `
		UPDATE auth_sessions
		SET is_revoked = TRUE
		WHERE id = $1 AND is_revoked = FALSE AND expires_at > NOW();
	`
	result, err := r.pool.Exec(ctx, query, sessionID)
	if err != nil {
		return fmt.Errorf("failed to revoke session: %w", err)
	}
	if result.RowsAffected() != 1 {
		return ErrSessionNotFound
	}
	return nil
}

func (r *PostgresSessionRepository) RevokeAllForUser(ctx context.Context, userID string) error {
	query := `
		UPDATE auth_sessions
		SET is_revoked = TRUE
		WHERE user_id = $1 AND is_revoked = FALSE;
	`
	_, err := r.pool.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to revoke user sessions: %w", err)
	}
	return nil
}

package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tecdroid/royo/internal/models"
)

type VideoRepository interface {
	GetCachedVideos(ctx context.Context, query string) ([]models.YouTubeVideoItem, bool, error)
	CacheVideos(ctx context.Context, query string, videos []models.YouTubeVideoItem, ttl time.Duration) error
}

type PostgresVideoRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresVideoRepository(pool *pgxpool.Pool) *PostgresVideoRepository {
	return &PostgresVideoRepository{pool: pool}
}

func (r *PostgresVideoRepository) GetCachedVideos(ctx context.Context, query string) ([]models.YouTubeVideoItem, bool, error) {
	q := `
		SELECT video_results, expires_at
		FROM youtube_cache
		WHERE search_query = $1 AND expires_at > NOW()
		LIMIT 1;
	`
	var rawJSON []byte
	var expiresAt time.Time
	err := r.pool.QueryRow(ctx, q, query).Scan(&rawJSON, &expiresAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, false, nil
		}
		return nil, false, fmt.Errorf("failed to query video cache: %w", err)
	}

	var items []models.YouTubeVideoItem
	if err := json.Unmarshal(rawJSON, &items); err != nil {
		return nil, false, err
	}

	return items, true, nil
}

func (r *PostgresVideoRepository) CacheVideos(ctx context.Context, query string, videos []models.YouTubeVideoItem, ttl time.Duration) error {
	rawJSON, err := json.Marshal(videos)
	if err != nil {
		return fmt.Errorf("failed to encode video results: %w", err)
	}

	expiresAt := time.Now().Add(ttl)
	q := `
		INSERT INTO youtube_cache (search_query, video_results, expires_at, created_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (search_query)
		DO UPDATE SET video_results = EXCLUDED.video_results, expires_at = EXCLUDED.expires_at, created_at = NOW();
	`
	_, err = r.pool.Exec(ctx, q, query, rawJSON, expiresAt)
	return err
}


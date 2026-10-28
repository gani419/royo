package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

// ConnectRemotePostgres initializes a high-performance pgx connection pool to the remote PostgreSQL server.
func ConnectRemotePostgres(ctx context.Context, databaseURL string) (*DB, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse DATABASE_URL: %w", err)
	}
	config.ConnConfig.RuntimeParams["timezone"] = "UTC"

	// Production connection pool tuning
	config.MaxConns = 25
	config.MinConns = 3
	config.MaxConnLifetime = 1 * time.Hour
	config.MaxConnIdleTime = 15 * time.Minute
	config.HealthCheckPeriod = 1 * time.Minute

	// Connect to remote database
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Verify connection by pinging
	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping remote PostgreSQL: %w", err)
	}

	log.Println("[DB] Successfully connected to remote PostgreSQL via TLS")
	return &DB{Pool: pool}, nil
}

// Close gracefully releases all connections in the pool.
func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
		log.Println("[DB] Connection pool closed")
	}
}

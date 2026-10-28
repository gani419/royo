package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tecdroid/royo/internal/models"
)

var (
	ErrSessionNotFoundInChat = errors.New("chat session not found")
)

type ChatRepository interface {
	CreateSession(ctx context.Context, session *models.ChatSession) error
	ListSessionsByUserID(ctx context.Context, userID string) ([]models.ChatSession, error)
	GetSessionByID(ctx context.Context, sessionID, userID string) (*models.ChatSession, error)
	DeleteSession(ctx context.Context, sessionID, userID string) error

	CreateMessage(ctx context.Context, message *models.ChatMessage) error
	ListMessagesBySessionID(ctx context.Context, sessionID string) ([]models.ChatMessage, error)
}

type PostgresChatRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresChatRepository(pool *pgxpool.Pool) *PostgresChatRepository {
	return &PostgresChatRepository{pool: pool}
}

func (r *PostgresChatRepository) CreateSession(ctx context.Context, session *models.ChatSession) error {
	query := `
		INSERT INTO chat_sessions (user_id, vehicle_id, title, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, created_at, updated_at;
	`
	return r.pool.QueryRow(
		ctx,
		query,
		session.UserID,
		session.VehicleID,
		session.Title,
	).Scan(&session.ID, &session.CreatedAt, &session.UpdatedAt)
}

func (r *PostgresChatRepository) ListSessionsByUserID(ctx context.Context, userID string) ([]models.ChatSession, error) {
	query := `
		SELECT cs.id, cs.user_id, cs.vehicle_id, cs.title, cs.created_at, cs.updated_at,
		       v.model_year, v.nickname, vm.name, m.name
		FROM chat_sessions cs
		JOIN vehicles v ON v.id = cs.vehicle_id
		JOIN vehicle_models vm ON vm.id = v.model_id
		JOIN vehicle_manufacturers m ON m.id = vm.manufacturer_id
		WHERE cs.user_id = $1
		ORDER BY cs.updated_at DESC;
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query chat sessions: %w", err)
	}
	defer rows.Close()

	var sessions []models.ChatSession
	for rows.Next() {
		var s models.ChatSession
		var v models.Vehicle
		var vm models.VehicleModel
		var m models.VehicleManufacturer

		if err := rows.Scan(
			&s.ID, &s.UserID, &s.VehicleID, &s.Title, &s.CreatedAt, &s.UpdatedAt,
			&v.ModelYear, &v.Nickname, &vm.Name, &m.Name,
		); err != nil {
			return nil, err
		}
		vm.Manufacturer = &m
		v.Model = &vm
		s.Vehicle = &v
		sessions = append(sessions, s)
	}

	return sessions, nil
}

func (r *PostgresChatRepository) GetSessionByID(ctx context.Context, sessionID, userID string) (*models.ChatSession, error) {
	query := `
		SELECT cs.id, cs.user_id, cs.vehicle_id, cs.title, cs.created_at, cs.updated_at,
		       v.id, v.model_year, v.nickname, v.odometer_km, vm.name, vm.engine_displacement_cc, m.name
		FROM chat_sessions cs
		JOIN vehicles v ON v.id = cs.vehicle_id
		JOIN vehicle_models vm ON vm.id = v.model_id
		JOIN vehicle_manufacturers m ON m.id = vm.manufacturer_id
		WHERE cs.id = $1 AND cs.user_id = $2
		LIMIT 1;
	`
	var s models.ChatSession
	var v models.Vehicle
	var vm models.VehicleModel
	var m models.VehicleManufacturer

	err := r.pool.QueryRow(ctx, query, sessionID, userID).Scan(
		&s.ID, &s.UserID, &s.VehicleID, &s.Title, &s.CreatedAt, &s.UpdatedAt,
		&v.ID, &v.ModelYear, &v.Nickname, &v.OdometerKm, &vm.Name, &vm.EngineDisplacementCc, &m.Name,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSessionNotFoundInChat
		}
		return nil, err
	}

	vm.Manufacturer = &m
	v.Model = &vm
	s.Vehicle = &v
	return &s, nil
}

func (r *PostgresChatRepository) DeleteSession(ctx context.Context, sessionID, userID string) error {
	query := `DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2;`
	tag, err := r.pool.Exec(ctx, query, sessionID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrSessionNotFoundInChat
	}
	return nil
}

func (r *PostgresChatRepository) CreateMessage(ctx context.Context, message *models.ChatMessage) error {
	videos := message.Videos
	if videos == nil {
		videos = []models.YouTubeVideoItem{}
	}
	videoJSON, marshalErr := json.Marshal(videos)
	if marshalErr != nil {
		return marshalErr
	}
	var structuredJSON []byte
	var err error
	if message.StructuredData != nil {
		structuredJSON, err = json.Marshal(message.StructuredData)
		if err != nil {
			return fmt.Errorf("failed to encode structured data: %w", err)
		}
	}

	query := `
		INSERT INTO chat_messages (session_id, sender_type, content, structured_data, videos, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, created_at;
	`
	return r.pool.QueryRow(
		ctx,
		query,
		message.SessionID,
		message.SenderType,
		message.Content,
		structuredJSON,
		videoJSON,
	).Scan(&message.ID, &message.CreatedAt)
}

func (r *PostgresChatRepository) ListMessagesBySessionID(ctx context.Context, sessionID string) ([]models.ChatMessage, error) {
	query := `
		SELECT id, session_id, sender_type, content, structured_data, videos, created_at
		FROM chat_messages
		WHERE session_id = $1
		ORDER BY created_at ASC;
	`
	rows, err := r.pool.Query(ctx, query, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to query chat messages: %w", err)
	}
	defer rows.Close()

	var messages []models.ChatMessage
	for rows.Next() {
		var m models.ChatMessage
		var structuredRaw []byte
		var videosRaw []byte

		if err := rows.Scan(&m.ID, &m.SessionID, &m.SenderType, &m.Content, &structuredRaw, &videosRaw, &m.CreatedAt); err != nil {
			return nil, err
		}

		if len(structuredRaw) > 0 {
			var structured models.AIStructuredResponse
			if err := json.Unmarshal(structuredRaw, &structured); err == nil {
				m.StructuredData = &structured
			}
		}

		messages = append(messages, m)
		if len(videosRaw) > 0 {
			if err := json.Unmarshal(videosRaw, &messages[len(messages)-1].Videos); err != nil {
				return nil, fmt.Errorf("invalid persisted video metadata: %w", err)
			}
		}
	}

	return messages, rows.Err()
}

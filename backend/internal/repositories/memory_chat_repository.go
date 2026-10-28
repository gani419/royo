package repositories

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/tecdroid/royo/internal/models"
)

type MemoryChatRepository struct {
	mu            sync.RWMutex
	sessions      map[string]*models.ChatSession
	messages      map[string][]models.ChatMessage
	nextSessionID int
	nextMessageID int
	vehicleRepo   VehicleRepository
}

func NewMemoryChatRepository(vehicleRepo VehicleRepository) *MemoryChatRepository {
	return &MemoryChatRepository{
		sessions:      make(map[string]*models.ChatSession),
		messages:      make(map[string][]models.ChatMessage),
		nextSessionID: 1,
		nextMessageID: 1,
		vehicleRepo:   vehicleRepo,
	}
}

func (r *MemoryChatRepository) CreateSession(ctx context.Context, session *models.ChatSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	session.ID = fmt.Sprintf("chat-%d", r.nextSessionID)
	r.nextSessionID++
	now := time.Now().UTC()
	session.CreatedAt = now
	session.UpdatedAt = now

	// Attach vehicle details if vehicleRepo provided
	if r.vehicleRepo != nil {
		if v, err := r.vehicleRepo.FindByID(ctx, session.VehicleID, session.UserID); err == nil {
			vCopy := *v
			session.Vehicle = &vCopy
		}
	}

	cloned := *session
	r.sessions[session.ID] = &cloned
	r.messages[session.ID] = []models.ChatMessage{}
	return nil
}

func (r *MemoryChatRepository) ListSessionsByUserID(ctx context.Context, userID string) ([]models.ChatSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.ChatSession
	for _, s := range r.sessions {
		if s.UserID == userID {
			cloned := *s
			cloned.MessageCount = len(r.messages[s.ID])
			list = append(list, cloned)
		}
	}
	return list, nil
}

func (r *MemoryChatRepository) GetSessionByID(ctx context.Context, sessionID, userID string) (*models.ChatSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, exists := r.sessions[sessionID]
	if !exists || s.UserID != userID {
		return nil, ErrSessionNotFoundInChat
	}
	cloned := *s
	cloned.MessageCount = len(r.messages[s.ID])
	return &cloned, nil
}

func (r *MemoryChatRepository) DeleteSession(ctx context.Context, sessionID, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	s, exists := r.sessions[sessionID]
	if !exists || s.UserID != userID {
		return ErrSessionNotFoundInChat
	}

	delete(r.sessions, sessionID)
	delete(r.messages, sessionID)
	return nil
}

func (r *MemoryChatRepository) CreateMessage(ctx context.Context, message *models.ChatMessage) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	message.ID = fmt.Sprintf("msg-%d", r.nextMessageID)
	r.nextMessageID++
	message.CreatedAt = time.Now().UTC()

	cloned := *message
	r.messages[message.SessionID] = append(r.messages[message.SessionID], cloned)

	// Update session snippet & timestamp
	if s, ok := r.sessions[message.SessionID]; ok {
		s.UpdatedAt = time.Now().UTC()
		s.LastMessageSnippet = message.Content
		if len(s.LastMessageSnippet) > 80 {
			s.LastMessageSnippet = s.LastMessageSnippet[:79] + "…"
		}
	}

	return nil
}

func (r *MemoryChatRepository) ListMessagesBySessionID(ctx context.Context, sessionID string) ([]models.ChatMessage, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	msgs, exists := r.messages[sessionID]
	if !exists {
		return []models.ChatMessage{}, nil
	}

	list := make([]models.ChatMessage, len(msgs))
	copy(list, msgs)
	return list, nil
}


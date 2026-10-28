package repositories

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/tecdroid/royo/internal/models"
)

// MemoryUserRepository is an in-memory thread-safe implementation of UserRepository for testing and local offline runs.
type MemoryUserRepository struct {
	mu     sync.RWMutex
	users  map[string]*models.User
	emails map[string]string // email -> id
	nextID int
}

func NewMemoryUserRepository() *MemoryUserRepository {
	return &MemoryUserRepository{
		users:  make(map[string]*models.User),
		emails: make(map[string]string),
		nextID: 1,
	}
}

func (r *MemoryUserRepository) Create(ctx context.Context, user *models.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	lowerEmail := strings.ToLower(user.Email)
	if _, exists := r.emails[lowerEmail]; exists {
		return ErrUserAlreadyExists
	}

	user.ID = fmt.Sprintf("usr-%d", r.nextID)
	r.nextID++
	now := time.Now().UTC()
	user.CreatedAt = now
	user.UpdatedAt = now

	// Clone user
	cloned := *user
	r.users[user.ID] = &cloned
	r.emails[lowerEmail] = user.ID
	return nil
}

func (r *MemoryUserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	id, exists := r.emails[strings.ToLower(email)]
	if !exists {
		return nil, ErrUserNotFound
	}

	user := r.users[id]
	cloned := *user
	return &cloned, nil
}

func (r *MemoryUserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	user, exists := r.users[id]
	if !exists {
		return nil, ErrUserNotFound
	}

	cloned := *user
	return &cloned, nil
}

func (r *MemoryUserRepository) InitializeUserQuota(ctx context.Context, userID string, dailyLimit int) error {
	return nil // in-memory no-op
}

// MemorySessionRepository is an in-memory thread-safe implementation of SessionRepository.
type MemorySessionRepository struct {
	mu       sync.RWMutex
	sessions map[string]*models.AuthSession // tokenHash -> session
	nextID   int
}

func NewMemorySessionRepository() *MemorySessionRepository {
	return &MemorySessionRepository{
		sessions: make(map[string]*models.AuthSession),
		nextID:   1,
	}
}

func (r *MemorySessionRepository) Create(ctx context.Context, session *models.AuthSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	session.ID = fmt.Sprintf("ses-%d", r.nextID)
	r.nextID++
	session.CreatedAt = time.Now().UTC()

	cloned := *session
	r.sessions[session.RefreshTokenHash] = &cloned
	return nil
}

func (r *MemorySessionRepository) FindByTokenHash(ctx context.Context, tokenHash string) (*models.AuthSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	session, exists := r.sessions[tokenHash]
	if !exists || session.IsRevoked || session.ExpiresAt.Before(time.Now()) {
		return nil, ErrSessionNotFound
	}

	cloned := *session
	return &cloned, nil
}

func (r *MemorySessionRepository) Revoke(ctx context.Context, sessionID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, s := range r.sessions {
		if s.ID == sessionID {
			if s.IsRevoked || !s.ExpiresAt.After(time.Now()) {
				return ErrSessionNotFound
			}
			s.IsRevoked = true
			return nil
		}
	}
	return nil
}

func (r *MemorySessionRepository) RevokeAllForUser(ctx context.Context, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, s := range r.sessions {
		if s.UserID == userID {
			s.IsRevoked = true
		}
	}
	return nil
}

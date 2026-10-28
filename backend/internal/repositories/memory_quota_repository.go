package repositories

import (
	"context"
	"sync"
	"time"

	"github.com/tecdroid/royo/internal/models"
)

type userDailyQuotaRecord struct {
	used  int
	limit int
	date  string // YYYY-MM-DD
}

type MemoryQuotaRepository struct {
	mu     sync.Mutex
	quotas map[string]*userDailyQuotaRecord // userID -> record
}

func NewMemoryQuotaRepository() *MemoryQuotaRepository {
	return &MemoryQuotaRepository{
		quotas: make(map[string]*userDailyQuotaRecord),
	}
}

func (r *MemoryQuotaRepository) GetUserQuota(ctx context.Context, userID string) (*models.UserQuota, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	today := time.Now().UTC().Format("2006-01-02")
	rec, exists := r.quotas[userID]
	if !exists || rec.date != today {
		return &models.UserQuota{
			UserID:            userID,
			DailyLimit:        5,
			MessagesUsedToday: 0,
			RemainingMessages: 5,
			ResetsAt:          getMidnightResetTime(),
			PlanName:          "FREE",
		}, nil
	}

	remaining := rec.limit - rec.used
	if remaining < 0 {
		remaining = 0
	}

	return &models.UserQuota{
		UserID:            userID,
		DailyLimit:        rec.limit,
		MessagesUsedToday: rec.used,
		RemainingMessages: remaining,
		ResetsAt:          getMidnightResetTime(),
		PlanName:          "FREE",
	}, nil
}

func (r *MemoryQuotaRepository) ReserveQuotaSlot(ctx context.Context, userID string, defaultLimit int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	today := time.Now().UTC().Format("2006-01-02")
	rec, exists := r.quotas[userID]
	if !exists || rec.date != today {
		r.quotas[userID] = &userDailyQuotaRecord{
			used:  1,
			limit: defaultLimit,
			date:  today,
		}
		return nil
	}

	if rec.used >= rec.limit {
		return ErrQuotaExceeded
	}

	rec.used++
	return nil
}

func (r *MemoryQuotaRepository) ReleaseQuotaSlot(ctx context.Context, userID string, reservedAt time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if rec, ok := r.quotas[userID]; ok && rec.date == reservedAt.UTC().Format("2006-01-02") && rec.used > 0 {
		rec.used--
	}
	return nil
}

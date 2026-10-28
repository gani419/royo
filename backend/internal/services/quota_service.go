package services

import (
	"context"

	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
)

type QuotaService struct {
	quotaRepo repositories.QuotaRepository
}

func NewQuotaService(quotaRepo repositories.QuotaRepository) *QuotaService {
	return &QuotaService{quotaRepo: quotaRepo}
}

func (s *QuotaService) GetUserQuota(ctx context.Context, userID string) (*models.UserQuota, error) {
	return s.quotaRepo.GetUserQuota(ctx, userID)
}

func (s *QuotaService) ReserveSlot(ctx context.Context, userID string, defaultLimit int) error {
	return s.quotaRepo.ReserveQuotaSlot(ctx, userID, defaultLimit)
}


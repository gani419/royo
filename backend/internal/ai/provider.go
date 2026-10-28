package ai

import (
	"context"

	"github.com/tecdroid/royo/internal/models"
)

type AIProvider interface {
	Diagnose(ctx context.Context, vehicle *models.Vehicle, userQuery string) (*models.AIStructuredResponse, error)
}


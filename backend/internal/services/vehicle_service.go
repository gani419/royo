package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
)

type VehicleService struct {
	vehicleRepo repositories.VehicleRepository
}

func NewVehicleService(vehicleRepo repositories.VehicleRepository) *VehicleService {
	return &VehicleService{vehicleRepo: vehicleRepo}
}

func (s *VehicleService) ListManufacturers(ctx context.Context) ([]models.VehicleManufacturer, error) {
	return s.vehicleRepo.ListManufacturers(ctx)
}

func (s *VehicleService) ListModels(ctx context.Context, manufacturerID string) ([]models.VehicleModel, error) {
	return s.vehicleRepo.ListModels(ctx, manufacturerID)
}

func (s *VehicleService) ListUserVehicles(ctx context.Context, userID string) ([]models.Vehicle, error) {
	if userID == "" {
		return nil, errors.New("userID is required")
	}
	return s.vehicleRepo.ListByUserID(ctx, userID)
}

func (s *VehicleService) GetVehicle(ctx context.Context, id, userID string) (*models.Vehicle, error) {
	if id == "" || userID == "" {
		return nil, errors.New("id and userID are required")
	}
	return s.vehicleRepo.FindByID(ctx, id, userID)
}

func (s *VehicleService) CreateVehicle(ctx context.Context, userID string, req models.CreateVehicleRequest) (*models.Vehicle, error) {
	if userID == "" {
		return nil, errors.New("unauthorized")
	}

	currentYear := time.Now().Year()
	if req.ModelYear < 1950 || req.ModelYear > currentYear+1 {
		return nil, fmt.Errorf("model year must be between 1950 and %d", currentYear+1)
	}

	if req.OdometerKm < 0 {
		return nil, errors.New("odometer reading cannot be negative")
	}

	// Verify model exists
	model, err := s.vehicleRepo.FindModelByID(ctx, req.ModelID)
	if err != nil {
		return nil, fmt.Errorf("invalid vehicle model: %w", err)
	}

	vehicle := &models.Vehicle{
		UserID:     userID,
		ModelID:    req.ModelID,
		Model:      model,
		Nickname:   strings.TrimSpace(req.Nickname),
		ModelYear:  req.ModelYear,
		OdometerKm: req.OdometerKm,
		VIN:        strings.TrimSpace(strings.ToUpper(req.VIN)),
	}

	if err := s.vehicleRepo.Create(ctx, vehicle); err != nil {
		return nil, fmt.Errorf("failed to save vehicle: %w", err)
	}

	return vehicle, nil
}

func (s *VehicleService) UpdateVehicle(ctx context.Context, id, userID string, req models.UpdateVehicleRequest) (*models.Vehicle, error) {
	existing, err := s.vehicleRepo.FindByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	if req.Nickname != nil {
		existing.Nickname = strings.TrimSpace(*req.Nickname)
	}
	if req.ModelYear != nil {
		currentYear := time.Now().Year()
		if *req.ModelYear < 1950 || *req.ModelYear > currentYear+1 {
			return nil, fmt.Errorf("model year must be between 1950 and %d", currentYear+1)
		}
		existing.ModelYear = *req.ModelYear
	}
	if req.OdometerKm != nil {
		if *req.OdometerKm < 0 {
			return nil, errors.New("odometer reading cannot be negative")
		}
		existing.OdometerKm = *req.OdometerKm
	}
	if req.VIN != nil {
		existing.VIN = strings.TrimSpace(strings.ToUpper(*req.VIN))
	}
	if req.LastServiceDate != nil {
		existing.LastServiceDate = req.LastServiceDate
	}

	if err := s.vehicleRepo.Update(ctx, existing); err != nil {
		return nil, fmt.Errorf("failed to update vehicle: %w", err)
	}

	return existing, nil
}

func (s *VehicleService) DeleteVehicle(ctx context.Context, id, userID string) error {
	return s.vehicleRepo.Delete(ctx, id, userID)
}


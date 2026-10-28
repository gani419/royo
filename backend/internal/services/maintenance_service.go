package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
)

type MaintenanceService struct {
	maintRepo   repositories.MaintenanceRepository
	vehicleRepo repositories.VehicleRepository
}

func NewMaintenanceService(
	maintRepo repositories.MaintenanceRepository,
	vehicleRepo repositories.VehicleRepository,
) *MaintenanceService {
	return &MaintenanceService{
		maintRepo:   maintRepo,
		vehicleRepo: vehicleRepo,
	}
}

func (s *MaintenanceService) ListRecords(ctx context.Context, vehicleID, userID string) ([]models.MaintenanceRecord, error) {
	// Verify user owns vehicle
	if _, err := s.vehicleRepo.FindByID(ctx, vehicleID, userID); err != nil {
		return nil, err
	}
	return s.maintRepo.ListByVehicleID(ctx, vehicleID)
}

func (s *MaintenanceService) AddRecord(ctx context.Context, vehicleID, userID string, req models.CreateMaintenanceRequest) (*models.MaintenanceRecord, error) {
	vehicle, err := s.vehicleRepo.FindByID(ctx, vehicleID, userID)
	if err != nil {
		return nil, err
	}

	cleanTitle := strings.TrimSpace(req.Title)
	if cleanTitle == "" {
		return nil, errors.New("maintenance title is required")
	}

	serviceDate, err := time.Parse(time.RFC3339, req.ServiceDate)
	if err != nil {
		return nil, errors.New("service date must be a valid RFC3339 timestamp")
	}

	if req.OdometerAtService < 0 {
		return nil, errors.New("odometer at service cannot be negative")
	}
	if req.Cost < 0 || math.IsNaN(req.Cost) || math.IsInf(req.Cost, 0) {
		return nil, errors.New("cost must be a finite nonnegative amount")
	}

	record := &models.MaintenanceRecord{
		VehicleID:         vehicleID,
		Title:             cleanTitle,
		Description:       strings.TrimSpace(req.Description),
		ServiceDate:       serviceDate,
		OdometerAtService: req.OdometerAtService,
		Cost:              req.Cost,
	}

	if err := s.maintRepo.Create(ctx, record); err != nil {
		return nil, fmt.Errorf("failed to save maintenance record: %w", err)
	}

	// Update vehicle's last_service_date and odometer if applicable
	vehicle.LastServiceDate = &serviceDate
	if req.OdometerAtService > vehicle.OdometerKm {
		vehicle.OdometerKm = req.OdometerAtService
	}
	_ = s.vehicleRepo.Update(ctx, vehicle)

	return record, nil
}

func (s *MaintenanceService) DeleteRecord(ctx context.Context, recordID, vehicleID, userID string) error {
	if _, err := s.vehicleRepo.FindByID(ctx, vehicleID, userID); err != nil {
		return err
	}
	return s.maintRepo.Delete(ctx, recordID, vehicleID)
}

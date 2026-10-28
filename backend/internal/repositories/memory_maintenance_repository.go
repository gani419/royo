package repositories

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/tecdroid/royo/internal/models"
)

type MemoryMaintenanceRepository struct {
	mu      sync.RWMutex
	records map[string][]models.MaintenanceRecord // vehicleID -> records
	nextID  int
}

func NewMemoryMaintenanceRepository() *MemoryMaintenanceRepository {
	return &MemoryMaintenanceRepository{
		records: make(map[string][]models.MaintenanceRecord),
		nextID:  1,
	}
}

func (r *MemoryMaintenanceRepository) Create(ctx context.Context, record *models.MaintenanceRecord) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	record.ID = fmt.Sprintf("maint-%d", r.nextID)
	r.nextID++
	record.CreatedAt = time.Now().UTC()

	cloned := *record
	r.records[record.VehicleID] = append([]models.MaintenanceRecord{cloned}, r.records[record.VehicleID]...)
	return nil
}

func (r *MemoryMaintenanceRepository) ListByVehicleID(ctx context.Context, vehicleID string) ([]models.MaintenanceRecord, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list, exists := r.records[vehicleID]
	if !exists {
		return []models.MaintenanceRecord{}, nil
	}

	cloned := make([]models.MaintenanceRecord, len(list))
	copy(cloned, list)
	return cloned, nil
}

func (r *MemoryMaintenanceRepository) Delete(ctx context.Context, id, vehicleID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	list, exists := r.records[vehicleID]
	if !exists {
		return ErrMaintenanceRecordNotFound
	}

	found := false
	filtered := make([]models.MaintenanceRecord, 0, len(list))
	for _, rec := range list {
		if rec.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, rec)
	}

	if !found {
		return ErrMaintenanceRecordNotFound
	}

	r.records[vehicleID] = filtered
	return nil
}


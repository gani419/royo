package repositories

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/tecdroid/royo/internal/models"
)

type MemoryVehicleRepository struct {
	mu            sync.RWMutex
	manufacturers []models.VehicleManufacturer
	models        []models.VehicleModel
	vehicles      map[string]*models.Vehicle
	nextVehicleID int
}

func NewMemoryVehicleRepository() *MemoryVehicleRepository {
	now := time.Now().UTC()

	// 1. Seed Manufacturers
	re := models.VehicleManufacturer{ID: "mfg-re", Name: "Royal Enfield", Country: "India", CreatedAt: now}
	honda := models.VehicleManufacturer{ID: "mfg-honda", Name: "Honda", Country: "Japan", CreatedAt: now}
	yamaha := models.VehicleManufacturer{ID: "mfg-yamaha", Name: "Yamaha", Country: "Japan", CreatedAt: now}
	ktm := models.VehicleManufacturer{ID: "mfg-ktm", Name: "KTM", Country: "Austria", CreatedAt: now}
	kawasaki := models.VehicleManufacturer{ID: "mfg-kawasaki", Name: "Kawasaki", Country: "Japan", CreatedAt: now}

	manufacturers := []models.VehicleManufacturer{re, honda, yamaha, ktm, kawasaki}

	// 2. Seed Models
	vehicleModels := []models.VehicleModel{
		{ID: "mod-re-classic-350", ManufacturerID: re.ID, Name: "Classic 350 (J-Series)", Category: models.CategoryMotorcycle, EngineDisplacementCc: 349, FuelType: "petrol", YearStart: 2021, Manufacturer: &re, CreatedAt: now},
		{ID: "mod-re-hunter-350", ManufacturerID: re.ID, Name: "Hunter 350", Category: models.CategoryMotorcycle, EngineDisplacementCc: 349, FuelType: "petrol", YearStart: 2022, Manufacturer: &re, CreatedAt: now},
		{ID: "mod-re-himalayan-450", ManufacturerID: re.ID, Name: "Himalayan 450 (Sherpa)", Category: models.CategoryMotorcycle, EngineDisplacementCc: 452, FuelType: "petrol", YearStart: 2023, Manufacturer: &re, CreatedAt: now},
		{ID: "mod-honda-cb350", ManufacturerID: honda.ID, Name: "H'ness CB350", Category: models.CategoryMotorcycle, EngineDisplacementCc: 348, FuelType: "petrol", YearStart: 2020, Manufacturer: &honda, CreatedAt: now},
		{ID: "mod-yamaha-r15", ManufacturerID: yamaha.ID, Name: "YZF-R15 V4", Category: models.CategoryMotorcycle, EngineDisplacementCc: 155, FuelType: "petrol", YearStart: 2021, Manufacturer: &yamaha, CreatedAt: now},
		{ID: "mod-ktm-duke-390", ManufacturerID: ktm.ID, Name: "Duke 390 Gen 3", Category: models.CategoryMotorcycle, EngineDisplacementCc: 399, FuelType: "petrol", YearStart: 2024, Manufacturer: &ktm, CreatedAt: now},
		{ID: "mod-kawasaki-ninja-300", ManufacturerID: kawasaki.ID, Name: "Ninja 300", Category: models.CategoryMotorcycle, EngineDisplacementCc: 296, FuelType: "petrol", YearStart: 2013, Manufacturer: &kawasaki, CreatedAt: now},
	}

	return &MemoryVehicleRepository{
		manufacturers: manufacturers,
		models:        vehicleModels,
		vehicles:      make(map[string]*models.Vehicle),
		nextVehicleID: 1,
	}
}

func (r *MemoryVehicleRepository) ListManufacturers(ctx context.Context) ([]models.VehicleManufacturer, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.manufacturers, nil
}

func (r *MemoryVehicleRepository) ListModels(ctx context.Context, manufacturerID string) ([]models.VehicleModel, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if manufacturerID == "" {
		return r.models, nil
	}

	var filtered []models.VehicleModel
	for _, m := range r.models {
		if m.ManufacturerID == manufacturerID {
			filtered = append(filtered, m)
		}
	}
	return filtered, nil
}

func (r *MemoryVehicleRepository) FindModelByID(ctx context.Context, modelID string) (*models.VehicleModel, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, m := range r.models {
		if m.ID == modelID {
			cloned := m
			return &cloned, nil
		}
	}
	return nil, ErrModelNotFound
}

func (r *MemoryVehicleRepository) ListByUserID(ctx context.Context, userID string) ([]models.Vehicle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.Vehicle
	for _, v := range r.vehicles {
		if v.UserID == userID {
			cloned := *v
			list = append(list, cloned)
		}
	}
	return list, nil
}

func (r *MemoryVehicleRepository) FindByID(ctx context.Context, id, userID string) (*models.Vehicle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	v, exists := r.vehicles[id]
	if !exists || v.UserID != userID {
		return nil, ErrVehicleNotFound
	}
	cloned := *v
	return &cloned, nil
}

func (r *MemoryVehicleRepository) Create(ctx context.Context, vehicle *models.Vehicle) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	vehicle.ID = fmt.Sprintf("veh-%d", r.nextVehicleID)
	r.nextVehicleID++
	now := time.Now().UTC()
	vehicle.CreatedAt = now
	vehicle.UpdatedAt = now

	// Attach model
	for _, m := range r.models {
		if m.ID == vehicle.ModelID {
			mCopy := m
			vehicle.Model = &mCopy
			break
		}
	}

	cloned := *vehicle
	r.vehicles[vehicle.ID] = &cloned
	return nil
}

func (r *MemoryVehicleRepository) Update(ctx context.Context, vehicle *models.Vehicle) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	v, exists := r.vehicles[vehicle.ID]
	if !exists || v.UserID != vehicle.UserID {
		return ErrVehicleNotFound
	}

	v.Nickname = vehicle.Nickname
	v.ModelYear = vehicle.ModelYear
	v.OdometerKm = vehicle.OdometerKm
	v.VIN = vehicle.VIN
	v.LastServiceDate = vehicle.LastServiceDate
	v.UpdatedAt = time.Now().UTC()
	return nil
}

func (r *MemoryVehicleRepository) Delete(ctx context.Context, id, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	v, exists := r.vehicles[id]
	if !exists || v.UserID != userID {
		return ErrVehicleNotFound
	}

	delete(r.vehicles, id)
	return nil
}


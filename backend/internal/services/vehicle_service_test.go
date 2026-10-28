package services

import (
	"context"
	"testing"

	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
)

func TestVehicleServiceLifecycle(t *testing.T) {
	ctx := context.Background()
	repo := repositories.NewMemoryVehicleRepository()
	service := NewVehicleService(repo)

	// 1. List Manufacturers (Should contain Royal Enfield, Honda, etc.)
	manufacturers, err := service.ListManufacturers(ctx)
	if err != nil {
		t.Fatalf("failed to list manufacturers: %v", err)
	}
	if len(manufacturers) < 5 {
		t.Fatalf("expected at least 5 manufacturers, got %d", len(manufacturers))
	}

	// 2. List Models for Royal Enfield
	reID := "mfg-re"
	reModels, err := service.ListModels(ctx, reID)
	if err != nil {
		t.Fatalf("failed to list models: %v", err)
	}
	if len(reModels) < 3 {
		t.Fatalf("expected at least 3 Royal Enfield models, got %d", len(reModels))
	}

	// 3. Create Vehicle for User 1
	userID := "usr-1"
	createReq := models.CreateVehicleRequest{
		ModelID:    reModels[0].ID,
		Nickname:   "Stealth Classic",
		ModelYear:  2023,
		OdometerKm: 14500,
		VIN:        "ME3J350C123456789",
	}

	vehicle, err := service.CreateVehicle(ctx, userID, createReq)
	if err != nil {
		t.Fatalf("failed to create vehicle: %v", err)
	}

	if vehicle.ID == "" {
		t.Fatal("expected vehicle ID to be generated")
	}
	if vehicle.Nickname != "Stealth Classic" {
		t.Errorf("expected nickname 'Stealth Classic', got '%s'", vehicle.Nickname)
	}
	if vehicle.Model == nil || vehicle.Model.Name == "" {
		t.Fatal("expected model details to be attached to vehicle")
	}

	// 4. Reject Negative Odometer
	_, err = service.CreateVehicle(ctx, userID, models.CreateVehicleRequest{
		ModelID:    reModels[0].ID,
		ModelYear:  2023,
		OdometerKm: -500,
	})
	if err == nil {
		t.Fatal("expected error when creating vehicle with negative odometer")
	}

	// 5. Update Vehicle Odometer
	newOdometer := 15200
	newNickname := "Desert Storm"
	updated, err := service.UpdateVehicle(ctx, vehicle.ID, userID, models.UpdateVehicleRequest{
		OdometerKm: &newOdometer,
		Nickname:   &newNickname,
	})
	if err != nil {
		t.Fatalf("failed to update vehicle: %v", err)
	}
	if updated.OdometerKm != 15200 {
		t.Errorf("expected updated odometer 15200, got %d", updated.OdometerKm)
	}

	// 6. Cross-User Isolation (User 2 cannot access or delete User 1's vehicle)
	user2ID := "usr-2"
	_, err = service.GetVehicle(ctx, vehicle.ID, user2ID)
	if err == nil {
		t.Fatal("expected User 2 to be blocked from viewing User 1's vehicle")
	}

	err = service.DeleteVehicle(ctx, vehicle.ID, user2ID)
	if err == nil {
		t.Fatal("expected User 2 to be blocked from deleting User 1's vehicle")
	}

	// 7. Delete Vehicle by Owner
	err = service.DeleteVehicle(ctx, vehicle.ID, userID)
	if err != nil {
		t.Fatalf("failed to delete vehicle: %v", err)
	}

	// Verify deletion
	_, err = service.GetVehicle(ctx, vehicle.ID, userID)
	if err == nil {
		t.Fatal("expected vehicle to not exist after deletion")
	}
}


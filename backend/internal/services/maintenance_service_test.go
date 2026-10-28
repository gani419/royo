package services

import (
	"context"
	"testing"
	"time"

	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
)

func TestMaintenanceServiceLifecycle(t *testing.T) {
	ctx := context.Background()

	vehicleRepo := repositories.NewMemoryVehicleRepository()
	maintRepo := repositories.NewMemoryMaintenanceRepository()
	service := NewMaintenanceService(maintRepo, vehicleRepo)

	userID := "usr-rider-1"
	reModels, _ := vehicleRepo.ListModels(ctx, "mfg-re")

	motorcycle := &models.Vehicle{
		UserID:     userID,
		ModelID:    reModels[0].ID,
		Nickname:   "Stealth Classic",
		ModelYear:  2023,
		OdometerKm: 10000,
	}
	_ = vehicleRepo.Create(ctx, motorcycle)

	// 1. Add Service Record
	nowStr := time.Now().UTC().Format(time.RFC3339)
	createReq := models.CreateMaintenanceRequest{
		Title:             "Motul 15W-50 Engine Oil & Filter Change",
		Description:       "Replaced drain bolt washer, filled 2.1L 300V synthetic oil",
		ServiceDate:       nowStr,
		OdometerAtService: 10250,
		Cost:              45.50,
	}

	record, err := service.AddRecord(ctx, motorcycle.ID, userID, createReq)
	if err != nil {
		t.Fatalf("failed to add maintenance record: %v", err)
	}

	if record.ID == "" {
		t.Fatal("expected maintenance record ID to be generated")
	}
	if record.Title != createReq.Title {
		t.Errorf("expected title %s, got %s", createReq.Title, record.Title)
	}

	// 2. Verify Vehicle Odometer and Last Service Date updated
	veh, err := vehicleRepo.FindByID(ctx, motorcycle.ID, userID)
	if err != nil {
		t.Fatalf("failed to reload vehicle: %v", err)
	}
	if veh.OdometerKm != 10250 {
		t.Errorf("expected vehicle odometer to update to 10250, got %d", veh.OdometerKm)
	}
	if veh.LastServiceDate == nil {
		t.Fatal("expected last service date to be updated")
	}

	// 3. List Records
	list, err := service.ListRecords(ctx, motorcycle.ID, userID)
	if err != nil {
		t.Fatalf("failed to list records: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 record, got %d", len(list))
	}

	// 4. Cross-User Isolation
	user2ID := "usr-hacker"
	_, err = service.ListRecords(ctx, motorcycle.ID, user2ID)
	if err == nil {
		t.Fatal("expected User 2 to be blocked from viewing User 1's maintenance records")
	}

	_, err = service.AddRecord(ctx, motorcycle.ID, user2ID, createReq)
	if err == nil {
		t.Fatal("expected User 2 to be blocked from adding maintenance records to User 1's vehicle")
	}

	// 5. Delete Record
	err = service.DeleteRecord(ctx, record.ID, motorcycle.ID, userID)
	if err != nil {
		t.Fatalf("failed to delete maintenance record: %v", err)
	}

	listAfter, _ := service.ListRecords(ctx, motorcycle.ID, userID)
	if len(listAfter) != 0 {
		t.Fatalf("expected 0 records after deletion, got %d", len(listAfter))
	}
}


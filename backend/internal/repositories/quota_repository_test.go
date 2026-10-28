package repositories

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestQuotaConcurrentReservationAndRefund(t *testing.T) {
	repo := NewMemoryQuotaRepository()
	var successes atomic.Int32
	var group sync.WaitGroup
	for i := 0; i < 100; i++ {
		group.Add(1)
		go func() {
			defer group.Done()
			if repo.ReserveQuotaSlot(context.Background(), "rider", 5) == nil {
				successes.Add(1)
			}
		}()
	}
	group.Wait()
	if successes.Load() != 5 {
		t.Fatalf("expected exactly five reserved requests, got %d", successes.Load())
	}
	if err := repo.ReleaseQuotaSlot(context.Background(), "rider", time.Now()); err != nil {
		t.Fatal(err)
	}
	if err := repo.ReserveQuotaSlot(context.Background(), "rider", 5); err != nil {
		t.Fatalf("refunded slot could not be reused: %v", err)
	}
	quota, _ := repo.GetUserQuota(context.Background(), "rider")
	if quota.MessagesUsedToday != 5 || quota.RemainingMessages != 0 {
		t.Fatalf("unexpected quota: %+v", quota)
	}
}

func TestRefundDoesNotChangeAnotherDay(t *testing.T) {
	repo := NewMemoryQuotaRepository()
	_ = repo.ReserveQuotaSlot(context.Background(), "rider", 5)
	_ = repo.ReleaseQuotaSlot(context.Background(), "rider", time.Now().Add(-24*time.Hour))
	quota, _ := repo.GetUserQuota(context.Background(), "rider")
	if quota.MessagesUsedToday != 1 {
		t.Fatal("yesterday's refund changed today's allowance")
	}
}

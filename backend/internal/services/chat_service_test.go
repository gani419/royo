package services

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
	"github.com/tecdroid/royo/internal/youtube"
)

func TestChatServiceLifecycleAndAIDiagnosis(t *testing.T) {
	ctx := context.Background()

	// 1. Setup in-memory repositories & services
	vehicleRepo := repositories.NewMemoryVehicleRepository()
	chatRepo := repositories.NewMemoryChatRepository(vehicleRepo)
	quotaRepo := repositories.NewMemoryQuotaRepository()
	videoRepo := repositories.NewMemoryVideoRepository()
	ytClient := youtube.NewClient("", videoRepo)
	videoService := NewVideoService(ytClient)
	aiProvider := &testAIProvider{} // Deterministic test fixture; never used in the app.

	chatService := NewChatService(chatRepo, vehicleRepo, quotaRepo, videoService, aiProvider)

	// 2. Create sample motorcycle in garage
	userID := "usr-rider-1"
	reModels, _ := vehicleRepo.ListModels(ctx, "mfg-re")
	if len(reModels) == 0 {
		t.Fatal("expected pre-seeded Royal Enfield models")
	}

	motorcycle := &models.Vehicle{
		UserID:     userID,
		ModelID:    reModels[0].ID,
		Nickname:   "Stealth Classic",
		ModelYear:  2023,
		OdometerKm: 14500,
	}
	if err := vehicleRepo.Create(ctx, motorcycle); err != nil {
		t.Fatalf("failed to create motorcycle: %v", err)
	}

	// 3. Create Chat Session
	session, err := chatService.CreateSession(ctx, userID, models.CreateChatSessionRequest{
		VehicleID: motorcycle.ID,
	})
	if err != nil {
		t.Fatalf("failed to create chat session: %v", err)
	}
	if session.ID == "" {
		t.Fatal("expected session ID to be populated")
	}

	// 4. Send Symptom Message: "My Royal Enfield Classic 350 makes a rattling sound when accelerating"
	userSymptom := "My Royal Enfield Classic 350 makes a rattling sound when accelerating"
	assistantMsg, err := chatService.SendMessage(ctx, session.ID, userID, models.SendMessageRequest{
		Content: userSymptom,
	})
	if err != nil {
		t.Fatalf("failed to send message: %v", err)
	}

	// 5. Verify Assistant Response and AI Structured Data
	if assistantMsg.SenderType != models.SenderAssistant {
		t.Errorf("expected sender type assistant, got %s", assistantMsg.SenderType)
	}
	if assistantMsg.StructuredData == nil {
		t.Fatal("expected structured AI diagnostic response")
	}

	aiData := assistantMsg.StructuredData

	// Verify Possible Causes
	if len(aiData.PossibleCauses) == 0 {
		t.Fatal("expected possible causes to be identified")
	}
	hasTappetCause := false
	for _, cause := range aiData.PossibleCauses {
		if strings.Contains(strings.ToLower(cause.Component), "tappet") || strings.Contains(strings.ToLower(cause.Component), "valve") {
			hasTappetCause = true
			break
		}
	}
	if !hasTappetCause {
		t.Errorf("expected valve / tappet clearance to be flagged for engine rattling symptom")
	}

	// Verify YouTube Videos Attached Automatically
	if len(assistantMsg.Videos) != 0 {
		t.Fatal("missing YouTube credentials must not fabricate video results")
	}

	// Verify Message History Persistence
	messages, err := chatService.GetMessages(ctx, session.ID, userID)
	if err != nil {
		t.Fatalf("failed to get messages: %v", err)
	}
	if len(messages) != 2 {
		t.Fatalf("expected 2 messages in session (user + assistant), got %d", len(messages))
	}

	// 6. Test Daily Quota Limit Enforcement (Free limit: 5 messages)
	// We already used 1 message above. Send 4 more to consume the quota.
	for i := 2; i <= 5; i++ {
		_, err := chatService.SendMessage(ctx, session.ID, userID, models.SendMessageRequest{
			Content: "Follow up question regarding adjustment steps",
		})
		if err != nil {
			t.Fatalf("unexpected error on message %d: %v", i, err)
		}
	}

	// 6th message MUST be blocked by quota
	_, err = chatService.SendMessage(ctx, session.ID, userID, models.SendMessageRequest{
		Content: "This message should exceed the daily quota",
	})
	if err == nil || !errors.Is(err, repositories.ErrQuotaExceeded) {
		t.Fatalf("expected ErrQuotaExceeded on 6th message, got: %v", err)
	}
}

type testAIProvider struct{}

func (*testAIProvider) Diagnose(ctx context.Context, vehicle *models.Vehicle, query string) (*models.AIStructuredResponse, error) {
	return &models.AIStructuredResponse{ResponseText: "Test fixture response", PossibleCauses: []models.PossibleCause{{Component: "Valve clearance", Likelihood: models.LikelihoodLow, Explanation: "Test fixture"}}, SafetyWarnings: []string{"AI may be inaccurate"}, YouTubeSearchQueries: []string{"motorcycle maintenance"}}, nil
}

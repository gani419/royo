package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/tecdroid/royo/internal/ai"
	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
)

type ChatService struct {
	chatRepo     repositories.ChatRepository
	vehicleRepo  repositories.VehicleRepository
	quotaRepo    repositories.QuotaRepository
	videoService *VideoService
	aiProvider   ai.AIProvider
}

func NewChatService(
	chatRepo repositories.ChatRepository,
	vehicleRepo repositories.VehicleRepository,
	quotaRepo repositories.QuotaRepository,
	videoService *VideoService,
	aiProvider ai.AIProvider,
) *ChatService {
	return &ChatService{
		chatRepo:     chatRepo,
		vehicleRepo:  vehicleRepo,
		quotaRepo:    quotaRepo,
		videoService: videoService,
		aiProvider:   aiProvider,
	}
}

func (s *ChatService) CreateSession(ctx context.Context, userID string, req models.CreateChatSessionRequest) (*models.ChatSession, error) {
	if userID == "" {
		return nil, errors.New("unauthorized")
	}

	// Verify vehicle belongs to user
	vehicle, err := s.vehicleRepo.FindByID(ctx, req.VehicleID, userID)
	if err != nil {
		return nil, fmt.Errorf("invalid vehicle: %w", err)
	}

	title := "Diagnostic Chat"
	if vehicle.Model != nil && vehicle.Model.Manufacturer != nil {
		title = fmt.Sprintf("%s %s Diagnostics", vehicle.Model.Manufacturer.Name, vehicle.Model.Name)
	}

	session := &models.ChatSession{
		UserID:    userID,
		VehicleID: req.VehicleID,
		Title:     title,
	}

	if err := s.chatRepo.CreateSession(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to create chat session: %w", err)
	}

	session.Vehicle = vehicle

	// If initial message provided, process it
	if strings.TrimSpace(req.InitialMessage) != "" {
		_, _ = s.SendMessage(ctx, session.ID, userID, models.SendMessageRequest{
			Content: req.InitialMessage,
		})
	}

	return session, nil
}

func (s *ChatService) ListSessions(ctx context.Context, userID string) ([]models.ChatSession, error) {
	return s.chatRepo.ListSessionsByUserID(ctx, userID)
}

func (s *ChatService) GetSession(ctx context.Context, sessionID, userID string) (*models.ChatSession, error) {
	return s.chatRepo.GetSessionByID(ctx, sessionID, userID)
}

func (s *ChatService) DeleteSession(ctx context.Context, sessionID, userID string) error {
	return s.chatRepo.DeleteSession(ctx, sessionID, userID)
}

func (s *ChatService) GetMessages(ctx context.Context, sessionID, userID string) ([]models.ChatMessage, error) {
	// Verify session ownership
	if _, err := s.chatRepo.GetSessionByID(ctx, sessionID, userID); err != nil {
		return nil, err
	}
	return s.chatRepo.ListMessagesBySessionID(ctx, sessionID)
}

func (s *ChatService) SendMessage(ctx context.Context, sessionID, userID string, req models.SendMessageRequest) (*models.ChatMessage, error) {
	cleanContent := ai.SanitizeUserPrompt(req.Content, 1000)
	if len(cleanContent) < 5 {
		return nil, errors.New("message is too short (minimum 5 characters)")
	}

	// 1. Fetch Session and Vehicle
	session, err := s.chatRepo.GetSessionByID(ctx, sessionID, userID)
	if err != nil {
		return nil, err
	}

	vehicle, err := s.vehicleRepo.FindByID(ctx, session.VehicleID, userID)
	if err != nil {
		return nil, fmt.Errorf("associated vehicle could not be loaded: %w", err)
	}

	// Refund the reservation unless a complete assistant response was persisted.
	reservedAt := time.Now().UTC()
	completed := false
	// 2. Atomically Reserve Daily AI Quota Slot
	if s.quotaRepo != nil {
		if err := s.quotaRepo.ReserveQuotaSlot(ctx, userID, 5); err != nil {
			return nil, err // ErrQuotaExceeded
		}
		defer func() {
			if !completed {
				refundCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancel()
				_ = s.quotaRepo.ReleaseQuotaSlot(refundCtx, userID, reservedAt)
			}
		}()
	}

	// 3. Persist User Message
	userMsg := &models.ChatMessage{
		SessionID:  sessionID,
		SenderType: models.SenderUser,
		Content:    cleanContent,
	}
	if err := s.chatRepo.CreateMessage(ctx, userMsg); err != nil {
		return nil, fmt.Errorf("failed to save user message: %w", err)
	}

	// 4. Orchestrate AI Diagnosis
	aiResult, err := s.aiProvider.Diagnose(ctx, vehicle, cleanContent)
	if err != nil {
		return nil, fmt.Errorf("ai diagnosis failed: %w", err)
	}

	// 5. Retrieve YouTube Tutorials Dynamically if queries available
	var videos []models.YouTubeVideoItem
	if s.videoService != nil && len(aiResult.YouTubeSearchQueries) > 0 {
		topQuery := aiResult.YouTubeSearchQueries[0]
		if videoResp, err := s.videoService.Search(ctx, topQuery, 3); err == nil {
			videos = videoResp.Videos
		}
	}

	// 6. Persist Assistant Response
	assistantMsg := &models.ChatMessage{
		SessionID:      sessionID,
		SenderType:     models.SenderAssistant,
		Content:        aiResult.ResponseText,
		StructuredData: aiResult,
		Videos:         videos,
	}
	if err := s.chatRepo.CreateMessage(ctx, assistantMsg); err != nil {
		return nil, fmt.Errorf("failed to save assistant message: %w", err)
	}

	completed = true
	return assistantMsg, nil
}

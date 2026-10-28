package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/tecdroid/royo/internal/middleware"
	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
	"github.com/tecdroid/royo/internal/response"
	"github.com/tecdroid/royo/internal/services"
)

type ChatHandler struct {
	chatService *services.ChatService
}

func NewChatHandler(chatService *services.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

func (h *ChatHandler) HandleChatSessions(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetCurrentUserID(r.Context())
	if !ok {
		response.SendError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User identity missing from context")
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/v1/chat/sessions")
	path = strings.TrimPrefix(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			h.listSessions(w, r, userID)
		case http.MethodPost:
			h.createSession(w, r, userID)
		default:
			response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		}
		return
	}

	// Sub-paths: /api/v1/chat/sessions/{id} or /api/v1/chat/sessions/{id}/messages
	parts := strings.Split(path, "/")
	sessionID := parts[0]

	if len(parts) == 1 {
		switch r.Method {
		case http.MethodGet:
			h.getSession(w, r, sessionID, userID)
		case http.MethodDelete:
			h.deleteSession(w, r, sessionID, userID)
		default:
			response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		}
		return
	}

	if len(parts) == 2 && parts[1] == "messages" {
		switch r.Method {
		case http.MethodGet:
			h.getMessages(w, r, sessionID, userID)
		case http.MethodPost:
			h.sendMessage(w, r, sessionID, userID)
		default:
			response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		}
		return
	}

	response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Endpoint not found")
}

func (h *ChatHandler) listSessions(w http.ResponseWriter, r *http.Request, userID string) {
	sessions, err := h.chatService.ListSessions(r.Context(), userID)
	if err != nil {
		response.SendError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.SendJSON(w, http.StatusOK, sessions)
}

func (h *ChatHandler) createSession(w http.ResponseWriter, r *http.Request, userID string) {
	var body models.CreateChatSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.SendError(w, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
		return
	}

	session, err := h.chatService.CreateSession(r.Context(), userID, body)
	if err != nil {
		response.SendError(w, http.StatusBadRequest, "CREATE_SESSION_FAILED", err.Error())
		return
	}

	response.SendJSON(w, http.StatusCreated, session, "Chat session created successfully")
}

func (h *ChatHandler) getSession(w http.ResponseWriter, r *http.Request, sessionID, userID string) {
	session, err := h.chatService.GetSession(r.Context(), sessionID, userID)
	if err != nil {
		if errors.Is(err, repositories.ErrSessionNotFoundInChat) {
			response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Chat session not found")
			return
		}
		response.SendError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.SendJSON(w, http.StatusOK, session)
}

func (h *ChatHandler) deleteSession(w http.ResponseWriter, r *http.Request, sessionID, userID string) {
	err := h.chatService.DeleteSession(r.Context(), sessionID, userID)
	if err != nil {
		if errors.Is(err, repositories.ErrSessionNotFoundInChat) {
			response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Chat session not found")
			return
		}
		response.SendError(w, http.StatusInternalServerError, "DELETE_FAILED", err.Error())
		return
	}
	response.SendJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *ChatHandler) getMessages(w http.ResponseWriter, r *http.Request, sessionID, userID string) {
	messages, err := h.chatService.GetMessages(r.Context(), sessionID, userID)
	if err != nil {
		if errors.Is(err, repositories.ErrSessionNotFoundInChat) {
			response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Chat session not found")
			return
		}
		response.SendError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.SendJSON(w, http.StatusOK, messages)
}

func (h *ChatHandler) sendMessage(w http.ResponseWriter, r *http.Request, sessionID, userID string) {
	var body models.SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.SendError(w, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
		return
	}

	msg, err := h.chatService.SendMessage(r.Context(), sessionID, userID, body)
	if err != nil {
		if errors.Is(err, repositories.ErrQuotaExceeded) {
			response.SendError(w, http.StatusTooManyRequests, "QUOTA_EXCEEDED", err.Error())
			return
		}
		response.SendError(w, http.StatusBadRequest, "MESSAGE_FAILED", err.Error())
		return
	}

	response.SendJSON(w, http.StatusCreated, msg)
}


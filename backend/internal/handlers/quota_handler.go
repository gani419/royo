package handlers

import (
	"net/http"

	"github.com/tecdroid/royo/internal/middleware"
	"github.com/tecdroid/royo/internal/response"
	"github.com/tecdroid/royo/internal/services"
)

type QuotaHandler struct {
	quotaService *services.QuotaService
}

func NewQuotaHandler(quotaService *services.QuotaService) *QuotaHandler {
	return &QuotaHandler{quotaService: quotaService}
}

func (h *QuotaHandler) GetQuota(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	userID, ok := middleware.GetCurrentUserID(r.Context())
	if !ok {
		// Return guest default
		response.SendJSON(w, http.StatusOK, map[string]interface{}{
			"userId":            "guest",
			"dailyLimit":        5,
			"messagesUsedToday": 0,
			"remainingMessages": 5,
			"planName":          "FREE",
		})
		return
	}

	quota, err := h.quotaService.GetUserQuota(r.Context(), userID)
	if err != nil {
		response.SendError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	response.SendJSON(w, http.StatusOK, quota)
}


package handlers

import (
	"net/http"
	"strconv"

	"github.com/tecdroid/royo/internal/response"
	"github.com/tecdroid/royo/internal/services"
)

type VideoHandler struct {
	videoService *services.VideoService
}

func NewVideoHandler(videoService *services.VideoService) *VideoHandler {
	return &VideoHandler{videoService: videoService}
}

func (h *VideoHandler) Search(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		response.SendError(w, http.StatusBadRequest, "INVALID_QUERY", "Search query parameter 'q' is required")
		return
	}

	maxResults := 5
	if maxStr := r.URL.Query().Get("maxResults"); maxStr != "" {
		if parsed, err := strconv.Atoi(maxStr); err == nil && parsed > 0 && parsed <= 10 {
			maxResults = parsed
		}
	}

	results, err := h.videoService.Search(r.Context(), query, maxResults)
	if err != nil {
		response.SendError(w, http.StatusInternalServerError, "SEARCH_FAILED", err.Error())
		return
	}

	response.SendJSON(w, http.StatusOK, results)
}


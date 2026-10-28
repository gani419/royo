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

type MaintenanceHandler struct {
	maintService *services.MaintenanceService
}

func NewMaintenanceHandler(maintService *services.MaintenanceService) *MaintenanceHandler {
	return &MaintenanceHandler{maintService: maintService}
}

func (h *MaintenanceHandler) HandleMaintenance(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetCurrentUserID(r.Context())
	if !ok {
		response.SendError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User identity missing from context")
		return
	}

	// Path format: /api/v1/vehicles/{vehicleId}/maintenance or /api/v1/vehicles/{vehicleId}/maintenance/{recordId}
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/vehicles/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 || parts[1] != "maintenance" {
		response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Endpoint not found")
		return
	}

	vehicleID := parts[0]

	if len(parts) == 2 {
		switch r.Method {
		case http.MethodGet:
			h.listRecords(w, r, vehicleID, userID)
		case http.MethodPost:
			h.addRecord(w, r, vehicleID, userID)
		default:
			response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		}
		return
	}

	if len(parts) == 3 && r.Method == http.MethodDelete {
		recordID := parts[2]
		h.deleteRecord(w, r, recordID, vehicleID, userID)
		return
	}

	response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
}

func (h *MaintenanceHandler) listRecords(w http.ResponseWriter, r *http.Request, vehicleID, userID string) {
	records, err := h.maintService.ListRecords(r.Context(), vehicleID, userID)
	if err != nil {
		if errors.Is(err, repositories.ErrVehicleNotFound) {
			response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Vehicle not found")
			return
		}
		response.SendError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.SendJSON(w, http.StatusOK, records)
}

func (h *MaintenanceHandler) addRecord(w http.ResponseWriter, r *http.Request, vehicleID, userID string) {
	var body models.CreateMaintenanceRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.SendError(w, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
		return
	}

	record, err := h.maintService.AddRecord(r.Context(), vehicleID, userID, body)
	if err != nil {
		if errors.Is(err, repositories.ErrVehicleNotFound) {
			response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Vehicle not found")
			return
		}
		response.SendError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	response.SendJSON(w, http.StatusCreated, record, "Maintenance record saved successfully")
}

func (h *MaintenanceHandler) deleteRecord(w http.ResponseWriter, r *http.Request, recordID, vehicleID, userID string) {
	err := h.maintService.DeleteRecord(r.Context(), recordID, vehicleID, userID)
	if err != nil {
		if errors.Is(err, repositories.ErrMaintenanceRecordNotFound) {
			response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Maintenance record not found")
			return
		}
		response.SendError(w, http.StatusInternalServerError, "DELETE_FAILED", err.Error())
		return
	}
	response.SendJSON(w, http.StatusOK, map[string]bool{"success": true})
}


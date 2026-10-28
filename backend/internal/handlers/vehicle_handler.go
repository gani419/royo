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

type VehicleHandler struct {
	vehicleService *services.VehicleService
	maintHandler   *MaintenanceHandler
}

func NewVehicleHandler(vehicleService *services.VehicleService, maintHandler *MaintenanceHandler) *VehicleHandler {
	return &VehicleHandler{vehicleService: vehicleService, maintHandler: maintHandler}
}

func (h *VehicleHandler) ListManufacturers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	list, err := h.vehicleService.ListManufacturers(r.Context())
	if err != nil {
		response.SendError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	response.SendJSON(w, http.StatusOK, list)
}

func (h *VehicleHandler) ListModels(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	manufacturerID := r.URL.Query().Get("manufacturerId")
	list, err := h.vehicleService.ListModels(r.Context(), manufacturerID)
	if err != nil {
		response.SendError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	response.SendJSON(w, http.StatusOK, list)
}

func (h *VehicleHandler) HandleVehicles(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetCurrentUserID(r.Context())
	if !ok {
		response.SendError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User identity missing from context")
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/v1/vehicles")
	path = strings.TrimPrefix(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			h.listVehicles(w, r, userID)
		case http.MethodPost:
			h.createVehicle(w, r, userID)
		default:
			response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		}
		return
	}

	// Delegate to Maintenance Handler if /api/v1/vehicles/{id}/maintenance
	if strings.Contains(path, "maintenance") && h.maintHandler != nil {
		h.maintHandler.HandleMaintenance(w, r)
		return
	}

	// Specific vehicle operations: /api/v1/vehicles/{id}
	vehicleID := path
	switch r.Method {
	case http.MethodGet:
		h.getVehicle(w, r, vehicleID, userID)
	case http.MethodPatch:
		h.updateVehicle(w, r, vehicleID, userID)
	case http.MethodDelete:
		h.deleteVehicle(w, r, vehicleID, userID)
	default:
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
	}
}

func (h *VehicleHandler) listVehicles(w http.ResponseWriter, r *http.Request, userID string) {
	list, err := h.vehicleService.ListUserVehicles(r.Context(), userID)
	if err != nil {
		response.SendError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.SendJSON(w, http.StatusOK, list)
}

func (h *VehicleHandler) createVehicle(w http.ResponseWriter, r *http.Request, userID string) {
	var body models.CreateVehicleRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.SendError(w, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
		return
	}

	vehicle, err := h.vehicleService.CreateVehicle(r.Context(), userID, body)
	if err != nil {
		response.SendError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	response.SendJSON(w, http.StatusCreated, vehicle, "Vehicle added to garage successfully")
}

func (h *VehicleHandler) getVehicle(w http.ResponseWriter, r *http.Request, vehicleID, userID string) {
	vehicle, err := h.vehicleService.GetVehicle(r.Context(), vehicleID, userID)
	if err != nil {
		if errors.Is(err, repositories.ErrVehicleNotFound) {
			response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Vehicle not found")
			return
		}
		response.SendError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.SendJSON(w, http.StatusOK, vehicle)
}

func (h *VehicleHandler) updateVehicle(w http.ResponseWriter, r *http.Request, vehicleID, userID string) {
	var body models.UpdateVehicleRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.SendError(w, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON payload")
		return
	}

	vehicle, err := h.vehicleService.UpdateVehicle(r.Context(), vehicleID, userID, body)
	if err != nil {
		if errors.Is(err, repositories.ErrVehicleNotFound) {
			response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Vehicle not found")
			return
		}
		response.SendError(w, http.StatusBadRequest, "UPDATE_FAILED", err.Error())
		return
	}

	response.SendJSON(w, http.StatusOK, vehicle, "Vehicle updated successfully")
}

func (h *VehicleHandler) deleteVehicle(w http.ResponseWriter, r *http.Request, vehicleID, userID string) {
	err := h.vehicleService.DeleteVehicle(r.Context(), vehicleID, userID)
	if err != nil {
		if errors.Is(err, repositories.ErrVehicleNotFound) {
			response.SendError(w, http.StatusNotFound, "NOT_FOUND", "Vehicle not found")
			return
		}
		response.SendError(w, http.StatusInternalServerError, "DELETE_FAILED", err.Error())
		return
	}

	response.SendJSON(w, http.StatusOK, map[string]bool{"success": true}, "Vehicle removed from garage")
}

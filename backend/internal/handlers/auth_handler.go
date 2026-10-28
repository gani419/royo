package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/tecdroid/royo/internal/repositories"
	"github.com/tecdroid/royo/internal/response"
	"github.com/tecdroid/royo/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type RegisterRequestBody struct {
	FullName string `json:"fullName"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequestBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshRequestBody struct {
	RefreshToken string `json:"refreshToken"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	var body RegisterRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.SendError(w, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON request body")
		return
	}

	input := services.RegisterInput{
		FullName:  body.FullName,
		Email:     body.Email,
		Password:  body.Password,
		UserAgent: r.UserAgent(),
		ClientIP:  r.RemoteAddr,
	}

	resp, err := h.authService.Register(r.Context(), input)
	if err != nil {
		if errors.Is(err, repositories.ErrUserAlreadyExists) {
			response.SendError(w, http.StatusConflict, "USER_EXISTS", err.Error())
			return
		}
		response.SendError(w, http.StatusBadRequest, "REGISTRATION_FAILED", err.Error())
		return
	}

	response.SendJSON(w, http.StatusCreated, resp, "User registered successfully")
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	var body LoginRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.SendError(w, http.StatusBadRequest, "INVALID_REQUEST_BODY", "Invalid JSON request body")
		return
	}

	input := services.LoginInput{
		Email:     body.Email,
		Password:  body.Password,
		UserAgent: r.UserAgent(),
		ClientIP:  r.RemoteAddr,
	}

	resp, err := h.authService.Login(r.Context(), input)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			response.SendError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", err.Error())
			return
		}
		if errors.Is(err, services.ErrInactiveUser) {
			response.SendError(w, http.StatusForbidden, "INACTIVE_ACCOUNT", err.Error())
			return
		}
		response.SendError(w, http.StatusInternalServerError, "LOGIN_FAILED", err.Error())
		return
	}

	response.SendJSON(w, http.StatusOK, resp, "Login successful")
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	var body RefreshRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		response.SendError(w, http.StatusBadRequest, "INVALID_REQUEST_BODY", "refreshToken is required")
		return
	}

	resp, err := h.authService.RefreshToken(r.Context(), body.RefreshToken, r.UserAgent(), r.RemoteAddr)
	if err != nil {
		response.SendError(w, http.StatusUnauthorized, "UNAUTHORIZED", err.Error())
		return
	}

	response.SendJSON(w, http.StatusOK, resp, "Token refreshed successfully")
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	var body RefreshRequestBody
	_ = json.NewDecoder(r.Body).Decode(&body)

	if body.RefreshToken != "" {
		_ = h.authService.Logout(r.Context(), body.RefreshToken)
	}

	response.SendJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request, userID string) {
	if r.Method != http.MethodGet {
		response.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed")
		return
	}

	profile, err := h.authService.GetProfile(r.Context(), userID)
	if err != nil {
		response.SendError(w, http.StatusNotFound, "USER_NOT_FOUND", "User profile not found")
		return
	}

	response.SendJSON(w, http.StatusOK, profile)
}


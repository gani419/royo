package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/tecdroid/royo/internal/auth"
	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/response"
)

type contextKey string

const (
	UserContextKey  contextKey = "currentUser"
	UserIDKey       contextKey = "currentUserID"
	UserRoleKey     contextKey = "currentUserRole"
)

// RequireAuth ensures a valid Bearer token is present and injects the authenticated claims into context.
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.SendError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authorization header is required")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				response.SendError(w, http.StatusUnauthorized, "INVALID_TOKEN_FORMAT", "Authorization header must be formatted as 'Bearer <token>'")
				return
			}

			tokenString := parts[1]
			claims, err := auth.ValidateAccessToken(tokenString, jwtSecret)
			if err != nil {
				response.SendError(w, http.StatusUnauthorized, "TOKEN_EXPIRED", "Access token is invalid or expired")
				return
			}

			// Attach claims to context
			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, UserRoleKey, claims.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetCurrentUserID extracts the authenticated user ID from context.
func GetCurrentUserID(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(UserIDKey).(string)
	return id, ok
}

// GetCurrentUserRole extracts the authenticated user role from context.
func GetCurrentUserRole(ctx context.Context) (models.UserRole, bool) {
	role, ok := ctx.Value(UserRoleKey).(models.UserRole)
	return role, ok
}


package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/tecdroid/royo/internal/models"
)

const AccessTokenDuration = 15 * time.Minute

type Claims struct {
	UserID string          `json:"userId"`
	Email  string          `json:"email"`
	Role   models.UserRole `json:"role"`
	jwt.RegisteredClaims
}

// GenerateAccessToken signs a new short-lived JWT for the authenticated user.
func GenerateAccessToken(user *models.User, secret string) (string, int64, error) {
	if secret == "" {
		return "", 0, errors.New("JWT secret is not configured")
	}

	expiresAt := time.Now().Add(AccessTokenDuration)
	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "royo-api",
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", 0, fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, int64(AccessTokenDuration.Seconds()), nil
}

// ValidateAccessToken parses and validates a signed JWT string, returning the Claims.
func ValidateAccessToken(tokenString, secret string) (*Claims, error) {
	if secret == "" {
		return nil, errors.New("JWT secret is not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token claims invalid")
}


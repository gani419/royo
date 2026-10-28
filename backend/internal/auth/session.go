package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"
)

const RefreshTokenDuration = 30 * 24 * time.Hour // 30 days

// GenerateRefreshToken creates a cryptographically secure random token string.
func GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// HashRefreshToken produces a SHA-256 hex digest of the raw refresh token for database persistence.
func HashRefreshToken(token string) string {
	hasher := sha256.New()
	hasher.Write([]byte(token))
	return hex.EncodeToString(hasher.Sum(nil))
}


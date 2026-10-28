package models

import (
	"time"
)

type AuthSession struct {
	ID               string    `json:"id"`
	UserID           string    `json:"userId"`
	RefreshTokenHash string    `json:"-"`
	UserAgent        string    `json:"userAgent"`
	ClientIP         string    `json:"clientIp"`
	IsRevoked        bool      `json:"isRevoked"`
	ExpiresAt        time.Time `json:"expiresAt"`
	CreatedAt        time.Time `json:"createdAt"`
}

type AuthTokens struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	TokenType    string `json:"tokenType"`
	ExpiresIn    int64  `json:"expiresIn"` // seconds
}

type AuthResponse struct {
	User   UserProfileResponse `json:"user"`
	Tokens AuthTokens          `json:"tokens"`
}


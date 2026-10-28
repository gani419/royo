package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/tecdroid/royo/internal/auth"
	"github.com/tecdroid/royo/internal/models"
	"github.com/tecdroid/royo/internal/repositories"
)

var (
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrInactiveUser        = errors.New("this account has been deactivated")
	ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")
)

type RegisterInput struct {
	FullName  string `json:"fullName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	UserAgent string
	ClientIP  string
}

type LoginInput struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	UserAgent string
	ClientIP  string
}

type AuthService struct {
	userRepo    repositories.UserRepository
	sessionRepo repositories.SessionRepository
	jwtSecret   string
}

func NewAuthService(
	userRepo repositories.UserRepository,
	sessionRepo repositories.SessionRepository,
	jwtSecret string,
) *AuthService {
	return &AuthService{
		userRepo:    userRepo,
		sessionRepo: sessionRepo,
		jwtSecret:   jwtSecret,
	}
}

// Register registers a new user, hashes their password, initializes their quota, and creates an active session.
func (s *AuthService) Register(ctx context.Context, input RegisterInput) (*models.AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" || len(input.Password) < 8 {
		return nil, errors.New("valid email and minimum 8-character password are required")
	}

	// Check for existing user
	existing, _ := s.userRepo.FindByEmail(ctx, email)
	if existing != nil {
		return nil, repositories.ErrUserAlreadyExists
	}

	passwordHash, err := auth.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:        email,
		PasswordHash: passwordHash,
		FullName:     strings.TrimSpace(input.FullName),
		Role:         models.RoleRider,
		IsActive:     true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to register user: %w", err)
	}

	// Initialize default free AI quota (5 messages per day)
	_ = s.userRepo.InitializeUserQuota(ctx, user.ID, 5)

	return s.createSessionAndTokens(ctx, user, input.UserAgent, input.ClientIP)
}

// Login verifies credentials and issues a fresh session with token pair.
func (s *AuthService) Login(ctx context.Context, input LoginInput) (*models.AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(input.Email))
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, ErrInactiveUser
	}

	if !auth.CheckPassword(input.Password, user.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	return s.createSessionAndTokens(ctx, user, input.UserAgent, input.ClientIP)
}

// RefreshToken implements rotation: verifies the old refresh token, revokes it, and issues a new pair.
func (s *AuthService) RefreshToken(ctx context.Context, rawRefreshToken, userAgent, clientIP string) (*models.AuthResponse, error) {
	tokenHash := auth.HashRefreshToken(rawRefreshToken)
	session, err := s.sessionRepo.FindByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	// Revoke old session immediately (Token Rotation)
	if err := s.sessionRepo.Revoke(ctx, session.ID); err != nil {
		return nil, ErrInvalidRefreshToken
	}

	// Fetch user
	user, err := s.userRepo.FindByID(ctx, session.UserID)
	if err != nil || !user.IsActive {
		return nil, ErrInvalidRefreshToken
	}

	return s.createSessionAndTokens(ctx, user, userAgent, clientIP)
}

// Logout revokes the session associated with the provided refresh token.
func (s *AuthService) Logout(ctx context.Context, rawRefreshToken string) error {
	tokenHash := auth.HashRefreshToken(rawRefreshToken)
	session, err := s.sessionRepo.FindByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil // idempotent logout
	}
	return s.sessionRepo.Revoke(ctx, session.ID)
}

// GetProfile retrieves safe profile data by user ID.
func (s *AuthService) GetProfile(ctx context.Context, userID string) (*models.UserProfileResponse, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	profile := user.ToProfile()
	return &profile, nil
}

func (s *AuthService) createSessionAndTokens(
	ctx context.Context,
	user *models.User,
	userAgent, clientIP string,
) (*models.AuthResponse, error) {
	// 1. Generate JWT Access Token
	accessToken, expiresIn, err := auth.GenerateAccessToken(user, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	// 2. Generate Cryptographically Secure Refresh Token
	rawRefreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// 3. Persist hashed refresh token in database
	session := &models.AuthSession{
		UserID:           user.ID,
		RefreshTokenHash: auth.HashRefreshToken(rawRefreshToken),
		UserAgent:        userAgent,
		ClientIP:         clientIP,
		IsRevoked:        false,
		ExpiresAt:        time.Now().Add(auth.RefreshTokenDuration),
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to persist auth session: %w", err)
	}

	return &models.AuthResponse{
		User: user.ToProfile(),
		Tokens: models.AuthTokens{
			AccessToken:  accessToken,
			RefreshToken: rawRefreshToken,
			TokenType:    "Bearer",
			ExpiresIn:    expiresIn,
		},
	}, nil
}

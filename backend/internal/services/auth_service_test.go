package services

import (
	"context"
	"testing"

	"github.com/tecdroid/royo/internal/repositories"
)

func TestAuthServiceLifecycle(t *testing.T) {
	ctx := context.Background()
	userRepo := repositories.NewMemoryUserRepository()
	sessionRepo := repositories.NewMemorySessionRepository()
	jwtSecret := "royo_test_secret_32_characters_long_key"

	service := NewAuthService(userRepo, sessionRepo, jwtSecret)

	// 1. Register User
	registerInput := RegisterInput{
		FullName:  "Classic 350 Rider",
		Email:     "rider@royo.tecdroid.com",
		Password:  "SecurePassword123!",
		UserAgent: "Mozilla/5.0 Test",
		ClientIP:  "127.0.0.1",
	}

	authResp, err := service.Register(ctx, registerInput)
	if err != nil {
		t.Fatalf("registration failed: %v", err)
	}

	if authResp.User.Email != registerInput.Email {
		t.Errorf("expected email %s, got %s", registerInput.Email, authResp.User.Email)
	}

	if authResp.Tokens.AccessToken == "" || authResp.Tokens.RefreshToken == "" {
		t.Fatal("expected both access and refresh tokens")
	}

	// 2. Reject Duplicate Email
	_, err = service.Register(ctx, registerInput)
	if err == nil {
		t.Fatal("expected registration with duplicate email to fail")
	}

	// 3. Login with Correct Password
	loginResp, err := service.Login(ctx, LoginInput{
		Email:     registerInput.Email,
		Password:  registerInput.Password,
		UserAgent: "Mozilla/5.0 Test",
		ClientIP:  "127.0.0.1",
	})
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}

	if loginResp.User.ID != authResp.User.ID {
		t.Errorf("expected user ID %s, got %s", authResp.User.ID, loginResp.User.ID)
	}

	// 4. Reject Login with Incorrect Password
	_, err = service.Login(ctx, LoginInput{
		Email:     registerInput.Email,
		Password:  "WrongPassword999!",
		UserAgent: "Mozilla/5.0 Test",
		ClientIP:  "127.0.0.1",
	})
	if err == nil {
		t.Fatal("expected login with wrong password to fail")
	}

	// 5. Token Refresh Rotation
	refreshResp, err := service.RefreshToken(ctx, loginResp.Tokens.RefreshToken, "Mozilla/5.0 Test", "127.0.0.1")
	if err != nil {
		t.Fatalf("token refresh failed: %v", err)
	}

	if refreshResp.Tokens.AccessToken == "" || refreshResp.Tokens.RefreshToken == "" {
		t.Fatal("expected new token pair upon refresh")
	}

	// Old refresh token must now be revoked
	_, err = service.RefreshToken(ctx, loginResp.Tokens.RefreshToken, "Mozilla/5.0 Test", "127.0.0.1")
	if err == nil {
		t.Fatal("expected reused old refresh token to be rejected")
	}

	// 6. Get Profile
	profile, err := service.GetProfile(ctx, authResp.User.ID)
	if err != nil {
		t.Fatalf("failed to get profile: %v", err)
	}

	if profile.Email != registerInput.Email {
		t.Errorf("expected profile email %s, got %s", registerInput.Email, profile.Email)
	}

	// 7. Logout
	err = service.Logout(ctx, refreshResp.Tokens.RefreshToken)
	if err != nil {
		t.Fatalf("logout failed: %v", err)
	}

	// Refresh should now fail after logout
	_, err = service.RefreshToken(ctx, refreshResp.Tokens.RefreshToken, "Mozilla/5.0 Test", "127.0.0.1")
	if err == nil {
		t.Fatal("expected refresh to fail after logout")
	}
}


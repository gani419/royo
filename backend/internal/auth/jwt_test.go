package auth

import (
	"testing"

	"github.com/tecdroid/royo/internal/models"
)

func TestGenerateAndValidateJWT(t *testing.T) {
	secret := "test_secret_key_minimum_32_characters_12345"
	user := &models.User{
		ID:    "usr-12345",
		Email: "rider@royo.tecdroid.com",
		Role:  models.RoleRider,
	}

	tokenString, expiresIn, err := GenerateAccessToken(user, secret)
	if err != nil {
		t.Fatalf("unexpected error generating token: %v", err)
	}

	if tokenString == "" {
		t.Fatal("expected non-empty token string")
	}

	if expiresIn <= 0 {
		t.Fatalf("expected positive expiresIn, got %d", expiresIn)
	}

	// Validate with correct secret
	claims, err := ValidateAccessToken(tokenString, secret)
	if err != nil {
		t.Fatalf("unexpected error validating token: %v", err)
	}

	if claims.UserID != user.ID {
		t.Errorf("expected UserID %s, got %s", user.ID, claims.UserID)
	}

	if claims.Email != user.Email {
		t.Errorf("expected Email %s, got %s", user.Email, claims.Email)
	}

	if claims.Role != user.Role {
		t.Errorf("expected Role %s, got %s", user.Role, claims.Role)
	}

	// Validate with wrong secret
	_, err = ValidateAccessToken(tokenString, "wrong_secret_key_should_fail_verification")
	if err == nil {
		t.Fatal("expected validation to fail with incorrect secret")
	}
}


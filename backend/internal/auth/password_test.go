package auth

import (
	"testing"
)

func TestHashAndCheckPassword(t *testing.T) {
	password := "Classic350@Rider!"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("unexpected error hashing password: %v", err)
	}

	if hash == password {
		t.Fatal("hash should not equal plain text password")
	}

	if !CheckPassword(password, hash) {
		t.Fatal("expected password check to succeed for correct password")
	}

	if CheckPassword("WrongPassword123!", hash) {
		t.Fatal("expected password check to fail for incorrect password")
	}
}

func TestShortPasswordRejection(t *testing.T) {
	_, err := HashPassword("short")
	if err == nil {
		t.Fatal("expected error when hashing password shorter than 8 characters")
	}
}


package config

import "testing"

func TestProductionCannotDowngradeToDevelopment(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("JWT_SECRET", "")
	if _, err := LoadConfig(); err == nil {
		t.Fatal("production accepted missing database")
	}
	t.Setenv("DATABASE_URL", "postgres://example.invalid/royo")
	t.Setenv("JWT_SECRET", "short")
	if _, err := LoadConfig(); err == nil {
		t.Fatal("production accepted short signing key")
	}
}
func TestDevelopmentPreservesProviderConfigurationWithoutDatabase(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("GEMINI_API_KEY", "test-only-value")
	t.Setenv("PORT", "18080")
	cfg, err := LoadConfig()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.GeminiAPIKey != "test-only-value" || cfg.Port != "18080" {
		t.Fatal("development configuration was lost")
	}
}

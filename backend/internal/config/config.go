package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv             string
	Port               string
	DatabaseURL        string
	JWTSecret          string
	JWTRefreshSecret   string
	GeminiAPIKey       string
	GeminiModel        string
	OpenAIAPIKey       string
	YouTubeAPIKey      string
	CORSAllowedOrigins []string
}

// LoadConfig reads configuration from environment variables and validates required parameters.
func LoadConfig() (*Config, error) {
	// Attempt loading from .env if present (non-fatal if missing in containerized environments)
	_ = godotenv.Load()

	cfg := &Config{
		AppEnv:           getEnv("APP_ENV", "development"),
		Port:             getEnv("PORT", "8080"),
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		JWTSecret:        os.Getenv("JWT_SECRET"),
		JWTRefreshSecret: os.Getenv("JWT_REFRESH_SECRET"),
		GeminiAPIKey:     os.Getenv("GEMINI_API_KEY"),
		GeminiModel:      getEnv("GEMINI_MODEL", "gemini-3.6-flash"),
		OpenAIAPIKey:     os.Getenv("OPENAI_API_KEY"),
		YouTubeAPIKey:    os.Getenv("YOUTUBE_API_KEY"),
	}

	origins := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,https://royo.tecdroid.com")
	cfg.CORSAllowedOrigins = strings.Split(origins, ",")

	// Validate required variables
	if cfg.DatabaseURL == "" && cfg.AppEnv == "production" {
		return nil, fmt.Errorf("missing required environment variable: DATABASE_URL")
	}

	if len(cfg.JWTSecret) < 32 && cfg.AppEnv == "production" {
		return nil, fmt.Errorf("missing required environment variable: JWT_SECRET")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

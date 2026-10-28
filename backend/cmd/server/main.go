package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/tecdroid/royo/internal/ai"
	"github.com/tecdroid/royo/internal/config"
	"github.com/tecdroid/royo/internal/database"
	"github.com/tecdroid/royo/internal/handlers"
	"github.com/tecdroid/royo/internal/middleware"
	"github.com/tecdroid/royo/internal/repositories"
	"github.com/tecdroid/royo/internal/response"
	"github.com/tecdroid/royo/internal/services"
	"github.com/tecdroid/royo/internal/youtube"
)

func main() {
	log.Println("[ROYO] Starting Repair On Your Own backend server...")

	// 1. Load Configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Invalid server configuration: %v", err)
	}

	if cfg.JWTSecret == "" {
		secret := make([]byte, 32)
		if _, err := rand.Read(secret); err != nil {
			log.Fatal("Could not create development signing key")
		}
		cfg.JWTSecret = hex.EncodeToString(secret)
	}

	// 2. Initialize Repositories (Postgres or Fallback)
	var userRepo repositories.UserRepository
	var sessionRepo repositories.SessionRepository
	var vehicleRepo repositories.VehicleRepository
	var chatRepo repositories.ChatRepository
	var quotaRepo repositories.QuotaRepository
	var videoRepo repositories.VideoRepository
	var maintRepo repositories.MaintenanceRepository
	var db *database.DB

	if cfg.DatabaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		dbInstance, err := database.ConnectRemotePostgres(ctx, cfg.DatabaseURL)
		if err != nil {
			if cfg.AppEnv == "production" {
				log.Fatal("Production database connection failed; refusing in-memory fallback")
			}
			log.Printf("[DB WARNING] Could not connect to remote PostgreSQL: %v", err)
			log.Println("[DB NOTICE] Falling back to in-memory repository for local mock execution")
			userRepo = repositories.NewMemoryUserRepository()
			sessionRepo = repositories.NewMemorySessionRepository()
			vRepo := repositories.NewMemoryVehicleRepository()
			vehicleRepo = vRepo
			chatRepo = repositories.NewMemoryChatRepository(vRepo)
			quotaRepo = repositories.NewMemoryQuotaRepository()
			videoRepo = repositories.NewMemoryVideoRepository()
			maintRepo = repositories.NewMemoryMaintenanceRepository()
		} else {
			db = dbInstance
			defer db.Close()
			userRepo = repositories.NewPostgresUserRepository(db.Pool)
			sessionRepo = repositories.NewPostgresSessionRepository(db.Pool)
			vehicleRepo = repositories.NewPostgresVehicleRepository(db.Pool)
			chatRepo = repositories.NewPostgresChatRepository(db.Pool)
			quotaRepo = repositories.NewPostgresQuotaRepository(db.Pool)
			videoRepo = repositories.NewPostgresVideoRepository(db.Pool)
			maintRepo = repositories.NewPostgresMaintenanceRepository(db.Pool)
		}
	} else {
		log.Println("[DB NOTICE] No DATABASE_URL provided. Initializing in-memory mock repository")
		userRepo = repositories.NewMemoryUserRepository()
		sessionRepo = repositories.NewMemorySessionRepository()
		vRepo := repositories.NewMemoryVehicleRepository()
		vehicleRepo = vRepo
		chatRepo = repositories.NewMemoryChatRepository(vRepo)
		quotaRepo = repositories.NewMemoryQuotaRepository()
		videoRepo = repositories.NewMemoryVideoRepository()
		maintRepo = repositories.NewMemoryMaintenanceRepository()
	}

	// 3. Initialize Services and Handlers
	authService := services.NewAuthService(userRepo, sessionRepo, cfg.JWTSecret)
	authHandler := handlers.NewAuthHandler(authService)

	maintService := services.NewMaintenanceService(maintRepo, vehicleRepo)
	maintHandler := handlers.NewMaintenanceHandler(maintService)

	vehicleService := services.NewVehicleService(vehicleRepo)
	vehicleHandler := handlers.NewVehicleHandler(vehicleService, maintHandler)

	quotaService := services.NewQuotaService(quotaRepo)
	quotaHandler := handlers.NewQuotaHandler(quotaService)

	ytClient := youtube.NewClient(cfg.YouTubeAPIKey, videoRepo)
	videoService := services.NewVideoService(ytClient)
	videoHandler := handlers.NewVideoHandler(videoService)

	aiProvider := ai.NewGeminiProvider(cfg.GeminiAPIKey, cfg.GeminiModel)
	chatService := services.NewChatService(chatRepo, vehicleRepo, quotaRepo, videoService, aiProvider)
	chatHandler := handlers.NewChatHandler(chatService)

	// 4. Setup Routes
	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "disconnected"
		if db != nil {
			dbStatus = "connected"
		}
		response.SendJSON(w, http.StatusOK, map[string]interface{}{
			"status":   "healthy",
			"app":      "Repair On Your Own (ROYO)",
			"env":      cfg.AppEnv,
			"database": dbStatus,
		})
	})

	// Public Auth Routes
	mux.HandleFunc("/api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("/api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("/api/v1/auth/refresh", authHandler.Refresh)
	mux.HandleFunc("/api/v1/auth/logout", authHandler.Logout)

	// Public Vehicle Metadata Routes
	mux.HandleFunc("/api/v1/vehicles/manufacturers", vehicleHandler.ListManufacturers)
	mux.HandleFunc("/api/v1/vehicles/models", vehicleHandler.ListModels)

	// Public YouTube Video Search Route
	mux.HandleFunc("/api/v1/videos/search", videoHandler.Search)

	// Protected Routes (Wrapped with RequireAuth middleware)
	authRequired := middleware.RequireAuth(cfg.JWTSecret)
	mux.Handle("/api/v1/auth/me", authRequired(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := middleware.GetCurrentUserID(r.Context())
		if !ok {
			response.SendError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User identity missing from context")
			return
		}
		authHandler.Me(w, r, userID)
	})))

	mux.Handle("/api/v1/ai/quota", authRequired(http.HandlerFunc(quotaHandler.GetQuota)))

	mux.Handle("/api/v1/vehicles", authRequired(http.HandlerFunc(vehicleHandler.HandleVehicles)))
	mux.Handle("/api/v1/vehicles/", authRequired(http.HandlerFunc(vehicleHandler.HandleVehicles)))

	mux.Handle("/api/v1/chat/sessions", authRequired(http.HandlerFunc(chatHandler.HandleChatSessions)))
	mux.Handle("/api/v1/chat/sessions/", authRequired(http.HandlerFunc(chatHandler.HandleChatSessions)))

	// 5. Wrap Middleware Stack: Recover -> RequestLogger -> CORS -> Mux
	corsMiddleware := middleware.CORS(cfg.CORSAllowedOrigins)
	handlerStack := middleware.Recover(
		middleware.RequestLogger(
			corsMiddleware(mux),
		),
	)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      handlerStack,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 6. Graceful Shutdown Listener
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("[ROYO] API Server listening on port %s (env: %s)", cfg.Port, cfg.AppEnv)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[ROYO] Server error: %v", err)
		}
	}()

	<-stopChan
	log.Println("[ROYO] Shutting down gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("[ROYO] Forced shutdown: %v", err)
	}

	log.Println("[ROYO] Server stopped successfully.")
}

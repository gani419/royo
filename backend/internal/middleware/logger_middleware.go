package middleware

import (
	"log"
	"net/http"
	"time"

	"github.com/tecdroid/royo/internal/response"
)

type responseWriterDelegator struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriterDelegator) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// RequestLogger logs incoming HTTP requests with method, path, response status, and elapsed duration.
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		delegator := &responseWriterDelegator{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(delegator, r)

		elapsed := time.Since(start)
		log.Printf("[HTTP] %s %s | Status: %d | Duration: %v | IP: %s",
			r.Method,
			r.URL.Path,
			delegator.statusCode,
			elapsed,
			r.RemoteAddr,
		)
	})
}

// Recover handles unhandled panics gracefully by returning an HTTP 500 error envelope.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("[PANIC RECOVERED] %v", rec)
				response.SendError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "An unexpected server error occurred.")
			}
		}()
		next.ServeHTTP(w, r)
	})
}


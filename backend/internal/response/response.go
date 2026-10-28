package response

import (
	"encoding/json"
	"net/http"
	"time"
)

type SuccessEnvelope struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data"`
	Message   string      `json:"message,omitempty"`
	Timestamp string      `json:"timestamp"`
}

type ErrorDetail struct {
	Code    string              `json:"code"`
	Message string              `json:"message"`
	Details map[string][]string `json:"details,omitempty"`
}

type ErrorEnvelope struct {
	Success   bool        `json:"success"`
	Error     ErrorDetail `json:"error"`
	Timestamp string      `json:"timestamp"`
}

// SendJSON encodes and sends a successful JSON response matching the ApiResponseEnvelope.
func SendJSON(w http.ResponseWriter, status int, data interface{}, message ...string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	msg := ""
	if len(message) > 0 {
		msg = message[0]
	}

	res := SuccessEnvelope{
		Success:   true,
		Data:      data,
		Message:   msg,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	_ = json.NewEncoder(w).Encode(res)
}

// SendError encodes and sends an error response matching the ApiErrorResponseEnvelope.
func SendError(w http.ResponseWriter, status int, code, message string, details ...map[string][]string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	var d map[string][]string
	if len(details) > 0 {
		d = details[0]
	}

	res := ErrorEnvelope{
		Success: false,
		Error: ErrorDetail{
			Code:    code,
			Message: message,
			Details: d,
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	_ = json.NewEncoder(w).Encode(res)
}


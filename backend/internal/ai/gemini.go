package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/tecdroid/royo/internal/models"
)

type GeminiProvider struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

func NewGeminiProvider(apiKey string, models ...string) *GeminiProvider {
	model := "gemini-3.6-flash"
	if len(models) > 0 && models[0] != "" {
		model = models[0]
	}
	return &GeminiProvider{
		apiKey: apiKey,
		model:  model,
		httpClient: &http.Client{
			Timeout: 25 * time.Second,
		},
	}
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Role  string       `json:"role,omitempty"`
	Parts []geminiPart `json:"parts"`
}

type geminiRequest struct {
	Contents          []geminiContent `json:"contents"`
	SystemInstruction *geminiContent  `json:"systemInstruction,omitempty"`
	GenerationConfig  struct {
		ResponseMimeType string  `json:"responseMimeType"`
		Temperature      float64 `json:"temperature"`
	} `json:"generationConfig"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (g *GeminiProvider) Diagnose(ctx context.Context, vehicle *models.Vehicle, userQuery string) (*models.AIStructuredResponse, error) {
	sanitizedQuery := SanitizeUserPrompt(userQuery, 1000)
	if sanitizedQuery == "" {
		return nil, fmt.Errorf("user query is empty after sanitization")
	}

	// Missing credentials are an unavailable service, never a fabricated diagnosis.
	if g.apiKey == "" {
		return nil, fmt.Errorf("AI assistance is unavailable; configure a valid Gemini provider and try again")
	}

	prompt := BuildVehicleDiagnosticPrompt(vehicle, sanitizedQuery)

	reqBody := geminiRequest{}
	reqBody.SystemInstruction = &geminiContent{
		Parts: []geminiPart{{Text: SystemInstructions}},
	}
	reqBody.Contents = []geminiContent{
		{
			Role:  "user",
			Parts: []geminiPart{{Text: prompt}},
		},
	}
	reqBody.GenerationConfig.ResponseMimeType = "application/json"
	reqBody.GenerationConfig.Temperature = 0.2

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to encode gemini request: %w", err)
	}

	endpoint := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent",
		g.model,
	)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(jsonBytes))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-goog-api-key", g.apiKey)

	resp, err := g.httpClient.Do(httpReq)
	if err != nil {
		// Fallback to rule-based analysis if network/API failure occurs
		return nil, fmt.Errorf("AI assistance is unavailable; configure a valid Gemini provider and try again")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI provider unavailable (status %d)", resp.StatusCode)
	}

	var geminiResp geminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return nil, fmt.Errorf("failed to decode gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("gemini returned no content candidates")
	}

	rawJSON := geminiResp.Candidates[0].Content.Parts[0].Text

	var structuredResp models.AIStructuredResponse
	if err := json.Unmarshal([]byte(rawJSON), &structuredResp); err != nil {
		return nil, fmt.Errorf("failed to parse structured ai json response: %w", err)
	}
	if strings.TrimSpace(structuredResp.ResponseText) == "" {
		return nil, fmt.Errorf("AI provider returned an empty response")
	}
	for _, cause := range structuredResp.PossibleCauses {
		if cause.Component == "" || cause.Explanation == "" || (cause.Likelihood != models.LikelihoodLow && cause.Likelihood != models.LikelihoodMedium && cause.Likelihood != models.LikelihoodHigh) {
			return nil, fmt.Errorf("AI provider returned an invalid cause")
		}
	}
	lower := strings.ToLower(sanitizedQuery)
	for _, critical := range []string{"brake", "steering", "fuel leak", "suspension", "frame crack", "fire", "smoke"} {
		if strings.Contains(lower, critical) {
			structuredResp.ProfessionalHelpRecommended = true
			structuredResp.SafetyWarnings = append(structuredResp.SafetyWarnings, "Safety-critical symptoms require a qualified mechanic. Stop riding and arrange professional inspection.")
			break
		}
	}

	g.enforceSafetyDisclaimers(&structuredResp)
	return &structuredResp, nil
}

// enforceSafetyDisclaimers ensures mandatory regulatory safety disclaimers are always attached.
func (g *GeminiProvider) enforceSafetyDisclaimers(resp *models.AIStructuredResponse) {
	const generalDisclaimer = "AI-generated diagnostic suggestions are for informational troubleshooting only and may be inaccurate. Always consult a certified technician before riding."

	hasDisclaimer := false
	for _, w := range resp.SafetyWarnings {
		if strings.Contains(w, "informational troubleshooting only") {
			hasDisclaimer = true
			break
		}
	}

	if !hasDisclaimer {
		resp.SafetyWarnings = append([]string{generalDisclaimer}, resp.SafetyWarnings...)
	}
}

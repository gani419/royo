package ai

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
)

type fixtureTransport func(*http.Request) (*http.Response, error)

func (f fixtureTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestMissingCredentialsDoesNotProduceCannedDiagnosis(t *testing.T) {
	if _, err := NewGeminiProvider("").Diagnose(context.Background(), nil, "My engine is rattling"); err == nil {
		t.Fatal("missing credentials produced a diagnosis")
	}
}
func TestRejectsEmptyModelResponseAndEscalatesSafety(t *testing.T) {
	for _, tc := range []struct {
		name, body string
		reject     bool
	}{{"empty", `{"responseText":""}`, true}, {"brakes", `{"responseText":"Several causes are possible","safetyWarnings":[],"professionalHelpRecommended":false}`, false}} {
		t.Run(tc.name, func(t *testing.T) {
			p := NewGeminiProvider("test-only")
			p.httpClient = &http.Client{Transport: fixtureTransport(func(r *http.Request) (*http.Response, error) {
				escaped := strings.ReplaceAll(tc.body, `"`, `\"`)
				body := `{"candidates":[{"content":{"parts":[{"text":"` + escaped + `"}]}}]}`
				return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
			})}
			result, err := p.Diagnose(context.Background(), nil, "My brake lever feels soft")
			if tc.reject {
				if err == nil {
					t.Fatal("accepted empty response")
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if !result.ProfessionalHelpRecommended || len(result.SafetyWarnings) < 2 {
				t.Fatal("safety escalation missing")
			}
		})
	}
}

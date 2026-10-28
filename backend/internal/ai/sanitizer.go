package ai

import (
	"regexp"
	"strings"
)

var (
	controlCharsRegex = regexp.MustCompile(`[\x00-\x1F\x7F-\x9F]`)
	htmlTagsRegex     = regexp.MustCompile(`<[^>]*>`)
)

// SanitizeUserPrompt removes dangerous control characters, strips HTML, and enforces max length bounds.
func SanitizeUserPrompt(input string, maxLen int) string {
	cleaned := htmlTagsRegex.ReplaceAllString(input, "")
	cleaned = controlCharsRegex.ReplaceAllString(cleaned, "")
	cleaned = strings.TrimSpace(cleaned)

	if maxLen > 0 && len(cleaned) > maxLen {
		cleaned = cleaned[:maxLen]
	}

	return cleaned
}


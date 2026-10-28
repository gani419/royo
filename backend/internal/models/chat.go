package models

import "time"

type MessageSenderType string

const (
	SenderUser      MessageSenderType = "user"
	SenderAssistant MessageSenderType = "assistant"
	SenderSystem    MessageSenderType = "system"
)

type LikelihoodLevel string

const (
	LikelihoodLow    LikelihoodLevel = "LOW"
	LikelihoodMedium LikelihoodLevel = "MEDIUM"
	LikelihoodHigh   LikelihoodLevel = "HIGH"
)

type PossibleCause struct {
	Component   string          `json:"component"`
	Likelihood  LikelihoodLevel `json:"likelihood"`
	Explanation string          `json:"explanation"`
}

type TroubleshootingStep struct {
	StepNumber       int      `json:"stepNumber"`
	Instruction      string   `json:"instruction"`
	SafetyPrecaution string   `json:"safetyPrecaution,omitempty"`
	ToolsRequired    []string `json:"toolsRequired,omitempty"`
}

type AIStructuredResponse struct {
	ResponseText                string                `json:"responseText"`
	PossibleCauses              []PossibleCause       `json:"possibleCauses"`
	FollowUpQuestions           []string              `json:"followUpQuestions"`
	TroubleshootingSteps        []TroubleshootingStep `json:"troubleshootingSteps"`
	YouTubeSearchQueries        []string              `json:"youtubeSearchQueries"`
	SafetyWarnings              []string              `json:"safetyWarnings"`
	ProfessionalHelpRecommended bool                  `json:"professionalHelpRecommended"`
}

type ChatSession struct {
	ID                 string    `json:"id"`
	UserID             string    `json:"userId"`
	VehicleID          string    `json:"vehicleId"`
	Vehicle            *Vehicle  `json:"vehicle,omitempty"`
	Title              string    `json:"title"`
	LastMessageSnippet string    `json:"lastMessageSnippet,omitempty"`
	MessageCount       int       `json:"messageCount"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type ChatMessage struct {
	ID             string                `json:"id"`
	SessionID      string                `json:"sessionId"`
	SenderType     MessageSenderType     `json:"senderType"`
	Content        string                `json:"content"`
	StructuredData *AIStructuredResponse `json:"structuredData,omitempty"`
	Videos         []YouTubeVideoItem    `json:"videos,omitempty"`
	CreatedAt      time.Time             `json:"createdAt"`
}

type CreateChatSessionRequest struct {
	VehicleID      string `json:"vehicleId"`
	InitialMessage string `json:"initialMessage,omitempty"`
}

type SendMessageRequest struct {
	Content string `json:"content"`
}


package models

import "time"

type UserQuota struct {
	UserID            string    `json:"userId"`
	DailyLimit        int       `json:"dailyLimit"`
	MessagesUsedToday int       `json:"messagesUsedToday"`
	RemainingMessages int       `json:"remainingMessages"`
	ResetsAt          time.Time `json:"resetsAt"`
	PlanName          string    `json:"planName"` // "FREE", "RIDER_PRO", "WORKSHOP"
}


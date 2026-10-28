package models

import "time"

type MaintenanceRecord struct {
	ID                string    `json:"id"`
	VehicleID         string    `json:"vehicleId"`
	Title             string    `json:"title"`
	Description       string    `json:"description,omitempty"`
	ServiceDate       time.Time `json:"serviceDate"`
	OdometerAtService int       `json:"odometerAtService"`
	Cost              float64   `json:"cost,omitempty"`
	CreatedAt         time.Time `json:"createdAt"`
}

type CreateMaintenanceRequest struct {
	Title             string  `json:"title"`
	Description       string  `json:"description,omitempty"`
	ServiceDate       string  `json:"serviceDate"` // ISO 8601 string
	OdometerAtService int     `json:"odometerAtService"`
	Cost              float64 `json:"cost,omitempty"`
}

type SubscriptionPlan struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"` // "FREE", "RIDER_PRO", "WORKSHOP"
	DailyAILimit int      `json:"dailyAiLimit"`
	MonthlyPrice float64  `json:"monthlyPrice"`
	Features     []string `json:"features"`
}


package models

import "time"

type VehicleCategory string

const (
	CategoryMotorcycle     VehicleCategory = "motorcycle"
	CategoryScooter        VehicleCategory = "scooter"
	CategoryCar            VehicleCategory = "car"
	CategoryElectricVehicle VehicleCategory = "electric_vehicle"
)

type VehicleManufacturer struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Country   string    `json:"country,omitempty"`
	LogoURL   string    `json:"logoUrl,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type VehicleModel struct {
	ID                   string              `json:"id"`
	ManufacturerID       string              `json:"manufacturerId"`
	Name                 string              `json:"name"`
	Category             VehicleCategory     `json:"category"`
	EngineDisplacementCc int                 `json:"engineDisplacementCc,omitempty"`
	FuelType             string              `json:"fuelType,omitempty"`
	YearStart            int                 `json:"yearStart,omitempty"`
	YearEnd              int                 `json:"yearEnd,omitempty"`
	Manufacturer         *VehicleManufacturer `json:"manufacturer,omitempty"`
	CreatedAt            time.Time           `json:"createdAt"`
}

type Vehicle struct {
	ID              string        `json:"id"`
	UserID          string        `json:"userId"`
	ModelID         string        `json:"modelId"`
	Model           *VehicleModel `json:"model,omitempty"`
	VIN             string        `json:"vin,omitempty"`
	Nickname        string        `json:"nickname,omitempty"`
	ModelYear       int           `json:"modelYear"`
	OdometerKm      int           `json:"odometerKm"`
	LastServiceDate *time.Time    `json:"lastServiceDate,omitempty"`
	CreatedAt       time.Time     `json:"createdAt"`
	UpdatedAt       time.Time     `json:"updatedAt"`
}

type CreateVehicleRequest struct {
	ModelID    string `json:"modelId"`
	Nickname   string `json:"nickname,omitempty"`
	ModelYear  int    `json:"modelYear"`
	OdometerKm int    `json:"odometerKm"`
	VIN        string `json:"vin,omitempty"`
}

type UpdateVehicleRequest struct {
	Nickname        *string    `json:"nickname,omitempty"`
	ModelYear       *int       `json:"modelYear,omitempty"`
	OdometerKm      *int       `json:"odometerKm,omitempty"`
	VIN             *string    `json:"vin,omitempty"`
	LastServiceDate *time.Time `json:"lastServiceDate,omitempty"`
}


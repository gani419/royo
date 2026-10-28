package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tecdroid/royo/internal/models"
)

var (
	ErrVehicleNotFound = errors.New("vehicle not found")
	ErrModelNotFound   = errors.New("vehicle model not found")
)

type VehicleRepository interface {
	ListManufacturers(ctx context.Context) ([]models.VehicleManufacturer, error)
	ListModels(ctx context.Context, manufacturerID string) ([]models.VehicleModel, error)
	FindModelByID(ctx context.Context, modelID string) (*models.VehicleModel, error)
	ListByUserID(ctx context.Context, userID string) ([]models.Vehicle, error)
	FindByID(ctx context.Context, id, userID string) (*models.Vehicle, error)
	Create(ctx context.Context, vehicle *models.Vehicle) error
	Update(ctx context.Context, vehicle *models.Vehicle) error
	Delete(ctx context.Context, id, userID string) error
}

type PostgresVehicleRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresVehicleRepository(pool *pgxpool.Pool) *PostgresVehicleRepository {
	return &PostgresVehicleRepository{pool: pool}
}

func (r *PostgresVehicleRepository) ListManufacturers(ctx context.Context) ([]models.VehicleManufacturer, error) {
	query := `
		SELECT id, name, country, logo_url, created_at
		FROM vehicle_manufacturers
		ORDER BY name ASC;
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query manufacturers: %w", err)
	}
	defer rows.Close()

	var list []models.VehicleManufacturer
	for rows.Next() {
		var m models.VehicleManufacturer
		if err := rows.Scan(&m.ID, &m.Name, &m.Country, &m.LogoURL, &m.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *PostgresVehicleRepository) ListModels(ctx context.Context, manufacturerID string) ([]models.VehicleModel, error) {
	query := `
		SELECT vm.id, vm.manufacturer_id, vm.name, vm.category, vm.engine_displacement_cc,
		       vm.fuel_type, vm.year_start, vm.year_end, vm.created_at,
		       m.id, m.name, m.country, m.logo_url, m.created_at
		FROM vehicle_models vm
		JOIN vehicle_manufacturers m ON m.id = vm.manufacturer_id
		WHERE ($1 = '' OR vm.manufacturer_id::text = $1)
		ORDER BY vm.name ASC;
	`
	rows, err := r.pool.Query(ctx, query, manufacturerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query models: %w", err)
	}
	defer rows.Close()

	var list []models.VehicleModel
	for rows.Next() {
		var vm models.VehicleModel
		var m models.VehicleManufacturer
		if err := rows.Scan(
			&vm.ID, &vm.ManufacturerID, &vm.Name, &vm.Category, &vm.EngineDisplacementCc,
			&vm.FuelType, &vm.YearStart, &vm.YearEnd, &vm.CreatedAt,
			&m.ID, &m.Name, &m.Country, &m.LogoURL, &m.CreatedAt,
		); err != nil {
			return nil, err
		}
		vm.Manufacturer = &m
		list = append(list, vm)
	}
	return list, nil
}

func (r *PostgresVehicleRepository) FindModelByID(ctx context.Context, modelID string) (*models.VehicleModel, error) {
	query := `
		SELECT vm.id, vm.manufacturer_id, vm.name, vm.category, vm.engine_displacement_cc,
		       vm.fuel_type, vm.year_start, vm.year_end, vm.created_at,
		       m.id, m.name, m.country, m.logo_url, m.created_at
		FROM vehicle_models vm
		JOIN vehicle_manufacturers m ON m.id = vm.manufacturer_id
		WHERE vm.id = $1
		LIMIT 1;
	`
	var vm models.VehicleModel
	var m models.VehicleManufacturer
	err := r.pool.QueryRow(ctx, query, modelID).Scan(
		&vm.ID, &vm.ManufacturerID, &vm.Name, &vm.Category, &vm.EngineDisplacementCc,
		&vm.FuelType, &vm.YearStart, &vm.YearEnd, &vm.CreatedAt,
		&m.ID, &m.Name, &m.Country, &m.LogoURL, &m.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrModelNotFound
		}
		return nil, err
	}
	vm.Manufacturer = &m
	return &vm, nil
}

func (r *PostgresVehicleRepository) ListByUserID(ctx context.Context, userID string) ([]models.Vehicle, error) {
	query := `
		SELECT v.id, v.user_id, v.model_id, v.vin, v.nickname, v.model_year, v.odometer_km, v.last_service_date, v.created_at, v.updated_at,
		       vm.id, vm.name, vm.category, vm.engine_displacement_cc, vm.fuel_type,
		       m.id, m.name
		FROM vehicles v
		JOIN vehicle_models vm ON vm.id = v.model_id
		JOIN vehicle_manufacturers m ON m.id = vm.manufacturer_id
		WHERE v.user_id = $1
		ORDER BY v.created_at DESC;
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list user vehicles: %w", err)
	}
	defer rows.Close()

	var list []models.Vehicle
	for rows.Next() {
		var v models.Vehicle
		var vm models.VehicleModel
		var m models.VehicleManufacturer

		if err := rows.Scan(
			&v.ID, &v.UserID, &v.ModelID, &v.VIN, &v.Nickname, &v.ModelYear, &v.OdometerKm, &v.LastServiceDate, &v.CreatedAt, &v.UpdatedAt,
			&vm.ID, &vm.Name, &vm.Category, &vm.EngineDisplacementCc, &vm.FuelType,
			&m.ID, &m.Name,
		); err != nil {
			return nil, err
		}
		vm.Manufacturer = &m
		v.Model = &vm
		list = append(list, v)
	}
	return list, nil
}

func (r *PostgresVehicleRepository) FindByID(ctx context.Context, id, userID string) (*models.Vehicle, error) {
	query := `
		SELECT v.id, v.user_id, v.model_id, v.vin, v.nickname, v.model_year, v.odometer_km, v.last_service_date, v.created_at, v.updated_at,
		       vm.id, vm.name, vm.category, vm.engine_displacement_cc, vm.fuel_type,
		       m.id, m.name
		FROM vehicles v
		JOIN vehicle_models vm ON vm.id = v.model_id
		JOIN vehicle_manufacturers m ON m.id = vm.manufacturer_id
		WHERE v.id = $1 AND v.user_id = $2
		LIMIT 1;
	`
	var v models.Vehicle
	var vm models.VehicleModel
	var m models.VehicleManufacturer

	err := r.pool.QueryRow(ctx, query, id, userID).Scan(
		&v.ID, &v.UserID, &v.ModelID, &v.VIN, &v.Nickname, &v.ModelYear, &v.OdometerKm, &v.LastServiceDate, &v.CreatedAt, &v.UpdatedAt,
		&vm.ID, &vm.Name, &vm.Category, &vm.EngineDisplacementCc, &vm.FuelType,
		&m.ID, &m.Name,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrVehicleNotFound
		}
		return nil, err
	}
	vm.Manufacturer = &m
	v.Model = &vm
	return &v, nil
}

func (r *PostgresVehicleRepository) Create(ctx context.Context, vehicle *models.Vehicle) error {
	query := `
		INSERT INTO vehicles (user_id, model_id, vin, nickname, model_year, odometer_km, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, created_at, updated_at;
	`
	return r.pool.QueryRow(
		ctx,
		query,
		vehicle.UserID,
		vehicle.ModelID,
		vehicle.VIN,
		vehicle.Nickname,
		vehicle.ModelYear,
		vehicle.OdometerKm,
	).Scan(&vehicle.ID, &vehicle.CreatedAt, &vehicle.UpdatedAt)
}

func (r *PostgresVehicleRepository) Update(ctx context.Context, vehicle *models.Vehicle) error {
	query := `
		UPDATE vehicles
		SET nickname = $1, model_year = $2, odometer_km = $3, vin = $4, last_service_date = $5, updated_at = NOW()
		WHERE id = $6 AND user_id = $7
		RETURNING updated_at;
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		vehicle.Nickname,
		vehicle.ModelYear,
		vehicle.OdometerKm,
		vehicle.VIN,
		vehicle.LastServiceDate,
		vehicle.ID,
		vehicle.UserID,
	).Scan(&vehicle.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrVehicleNotFound
		}
		return err
	}
	return nil
}

func (r *PostgresVehicleRepository) Delete(ctx context.Context, id, userID string) error {
	query := `DELETE FROM vehicles WHERE id = $1 AND user_id = $2;`
	tag, err := r.pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrVehicleNotFound
	}
	return nil
}


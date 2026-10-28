package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tecdroid/royo/internal/models"
)

var ErrMaintenanceRecordNotFound = errors.New("maintenance record not found")

type MaintenanceRepository interface {
	Create(ctx context.Context, record *models.MaintenanceRecord) error
	ListByVehicleID(ctx context.Context, vehicleID string) ([]models.MaintenanceRecord, error)
	Delete(ctx context.Context, id, vehicleID string) error
}

type PostgresMaintenanceRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresMaintenanceRepository(pool *pgxpool.Pool) *PostgresMaintenanceRepository {
	return &PostgresMaintenanceRepository{pool: pool}
}

func (r *PostgresMaintenanceRepository) Create(ctx context.Context, record *models.MaintenanceRecord) error {
	query := `
		INSERT INTO maintenance_records (vehicle_id, title, service_date, odometer_at_service, cost, description, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING id, created_at;
	`
	return r.pool.QueryRow(
		ctx,
		query,
		record.VehicleID,
		record.Title,
		record.ServiceDate,
		record.OdometerAtService,
		record.Cost,
		record.Description,
	).Scan(&record.ID, &record.CreatedAt)
}

func (r *PostgresMaintenanceRepository) ListByVehicleID(ctx context.Context, vehicleID string) ([]models.MaintenanceRecord, error) {
	query := `
		SELECT id, vehicle_id, title, service_date, odometer_at_service, cost, description, created_at
		FROM maintenance_records
		WHERE vehicle_id = $1
		ORDER BY service_date DESC, created_at DESC;
	`
	rows, err := r.pool.Query(ctx, query, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("failed to query maintenance records: %w", err)
	}
	defer rows.Close()

	var list []models.MaintenanceRecord
	for rows.Next() {
		var rec models.MaintenanceRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.VehicleID,
			&rec.Title,
			&rec.ServiceDate,
			&rec.OdometerAtService,
			&rec.Cost,
			&rec.Description,
			&rec.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, rec)
	}

	return list, rows.Err()
}

func (r *PostgresMaintenanceRepository) Delete(ctx context.Context, id, vehicleID string) error {
	query := `DELETE FROM maintenance_records WHERE id = $1 AND vehicle_id = $2;`
	tag, err := r.pool.Exec(ctx, query, id, vehicleID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrMaintenanceRecordNotFound
	}
	return nil
}

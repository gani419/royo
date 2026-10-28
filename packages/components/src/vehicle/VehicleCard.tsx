import React from 'react';
import { Vehicle } from '@royo/types';
import { colors, spacing, borderRadius } from '@royo/theme';
import { formatOdometer, formatVehicleTitle } from '@royo/utils';
import { Button } from '../common/Button';

export interface VehicleCardProps {
  vehicle: Vehicle;
  isSelected?: boolean;
  onSelect?: (vehicle: Vehicle) => void;
  onDiagnose?: (vehicle: Vehicle) => void;
  style?: React.CSSProperties;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  isSelected = false,
  onSelect,
  onDiagnose,
  style,
}) => {
  const modelName = vehicle.model?.name || 'Unknown Model';
  const manufacturerName = vehicle.model?.manufacturer?.name;
  const fullModel = manufacturerName ? `${manufacturerName} ${modelName}` : modelName;
  const title = formatVehicleTitle(vehicle.modelYear, fullModel, vehicle.nickname);

  return (
    <div
      onClick={() => onSelect && onSelect(vehicle)}
      style={{
        backgroundColor: colors.dark.surface,
        border: `1px solid ${isSelected ? colors.brand.primary : colors.dark.border}`,
        borderRadius: `${borderRadius.lg}px`,
        padding: `${spacing.lg}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${spacing.md}px`,
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
        boxShadow: isSelected ? `0 0 0 1px ${colors.brand.primary}` : 'none',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: colors.brand.primary,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              padding: `${spacing.xxs}px ${spacing.xs}px`,
              borderRadius: `${borderRadius.xs}px`,
            }}
          >
            {vehicle.model?.category || 'Motorcycle'}
          </span>
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 600,
              color: colors.dark.textPrimary,
              marginTop: `${spacing.xs}px`,
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>

        {isSelected && (
          <span
            style={{
              fontSize: '11px',
              color: colors.brand.primary,
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              padding: `${spacing.xxs}px ${spacing.sm}px`,
              borderRadius: `${borderRadius.full}px`,
              fontWeight: 600,
            }}
          >
            Active
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: `${spacing.lg}px`, fontSize: '13px', color: colors.dark.textSecondary }}>
        <div>
          <span style={{ color: colors.dark.textMuted }}>Odometer: </span>
          <span style={{ fontWeight: 500, color: colors.dark.textPrimary }}>
            {formatOdometer(vehicle.odometerKm)}
          </span>
        </div>

        {vehicle.model?.engineDisplacementCc && (
          <div>
            <span style={{ color: colors.dark.textMuted }}>Displacement: </span>
            <span style={{ fontWeight: 500, color: colors.dark.textPrimary }}>
              {vehicle.model.engineDisplacementCc} cc
            </span>
          </div>
        )}
      </div>

      {onDiagnose && (
        <div style={{ marginTop: `${spacing.xs}px` }}>
          <Button
            variant="primary"
            size="sm"
            style={{ width: '100%' }}
            onClick={(e) => {
              e.stopPropagation();
              onDiagnose(vehicle);
            }}
          >
            Ask AI Assistant
          </Button>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { colors, spacing, borderRadius } from '@royo/theme';
import { createVehicleSchema, CreateVehicleInput } from '@royo/schemas';
import { VehicleManufacturer, VehicleModel, CreateVehicleDto } from '@royo/types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ErrorView } from '../common/ErrorView';

export interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (dto: CreateVehicleDto) => Promise<unknown>;
  fetchManufacturers: () => Promise<VehicleManufacturer[]>;
  fetchModels: (manufacturerId?: string) => Promise<VehicleModel[]>;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onAddVehicle,
  fetchManufacturers,
  fetchModels,
}) => {
  const [manufacturers, setManufacturers] = useState<VehicleManufacturer[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>('');

  const [values, setValues] = useState<{
    modelId: string;
    nickname: string;
    modelYear: number;
    odometerKm: number;
    vin: string;
  }>({
    modelId: '',
    nickname: '',
    modelYear: new Date().getFullYear(),
    odometerKm: 0,
    vin: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateVehicleInput, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load manufacturers when opened
  useEffect(() => {
    if (isOpen) {
      fetchManufacturers()
        .then((m) => {
          setManufacturers(m);
          if (m.length > 0 && !selectedManufacturerId) {
            setSelectedManufacturerId(m[0]?.id || '');
          }
        })
        .catch(() => {});
    }
  }, [isOpen, fetchManufacturers, selectedManufacturerId]);

  // Load models when manufacturer changes
  useEffect(() => {
    if (selectedManufacturerId) {
      fetchModels(selectedManufacturerId)
        .then((mdls) => {
          setModels(mdls);
          if (mdls.length > 0) {
            setValues((prev) => ({ ...prev, modelId: mdls[0]?.id || '' }));
          }
        })
        .catch(() => {});
    }
  }, [selectedManufacturerId, fetchModels]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = createVehicleSchema.safeParse({
      ...values,
      vin: values.vin || undefined,
    });

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof CreateVehicleInput, string>> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateVehicleInput;
        if (field) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddVehicle({
        modelId: values.modelId,
        nickname: values.nickname.trim() || undefined,
        modelYear: values.modelYear,
        odometerKm: values.odometerKm,
        vin: values.vin.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to add vehicle to garage'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing.md}px`,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: colors.dark.surface,
          border: `1px solid ${colors.dark.border}`,
          borderRadius: `${borderRadius.lg}px`,
          maxWidth: '480px',
          width: '100%',
          padding: `${spacing.xl}px`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${spacing.lg}px` }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
            Add Motorcycle to Garage
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.dark.textMuted,
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {submitError && <ErrorView message={submitError} style={{ marginBottom: `${spacing.md}px` }} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.md}px` }}>
          {/* Manufacturer Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.xxs}px` }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: colors.dark.textSecondary }}>
              Manufacturer
            </label>
            <select
              value={selectedManufacturerId}
              onChange={(e) => setSelectedManufacturerId(e.target.value)}
              style={{
                backgroundColor: colors.dark.surfaceElevated,
                color: colors.dark.textPrimary,
                border: `1px solid ${colors.dark.border}`,
                borderRadius: `${borderRadius.md}px`,
                padding: `${spacing.sm}px ${spacing.md}px`,
                fontSize: '15px',
                outline: 'none',
              }}
            >
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.xxs}px` }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: colors.dark.textSecondary }}>
              Model
            </label>
            <select
              value={values.modelId}
              onChange={(e) => setValues({ ...values, modelId: e.target.value })}
              style={{
                backgroundColor: colors.dark.surfaceElevated,
                color: colors.dark.textPrimary,
                border: `1px solid ${errors.modelId ? colors.status.error : colors.dark.border}`,
                borderRadius: `${borderRadius.md}px`,
                padding: `${spacing.sm}px ${spacing.md}px`,
                fontSize: '15px',
                outline: 'none',
              }}
            >
              {models.map((mdl) => (
                <option key={mdl.id} value={mdl.id}>
                  {mdl.name} ({mdl.engineDisplacementCc} cc)
                </option>
              ))}
            </select>
            {errors.modelId && (
              <span style={{ fontSize: '12px', color: colors.status.error }}>
                {errors.modelId}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${spacing.md}px` }}>
            <Input
              label="Model Year"
              type="number"
              value={values.modelYear}
              onChange={(e) => setValues({ ...values, modelYear: parseInt(e.target.value, 10) || 0 })}
              error={errors.modelYear}
            />

            <Input
              label="Odometer (km)"
              type="number"
              value={values.odometerKm}
              onChange={(e) => setValues({ ...values, odometerKm: parseInt(e.target.value, 10) || 0 })}
              error={errors.odometerKm}
            />
          </div>

          <Input
            label="Nickname (Optional)"
            placeholder="e.g. Stealth Classic"
            value={values.nickname}
            onChange={(e) => setValues({ ...values, nickname: e.target.value })}
            error={errors.nickname}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: `${spacing.md}px`, marginTop: `${spacing.md}px` }}>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Add to Garage
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


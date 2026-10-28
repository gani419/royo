import React, { useState } from 'react';
import { MaintenanceRecord, CreateMaintenanceRequest, Vehicle } from '@royo/types';
import { colors, spacing, borderRadius } from '@royo/theme';
import { formatOdometerKm, formatDate } from '@royo/utils';
import { Wrench, Plus, X, Calendar } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ErrorView } from '../common/ErrorView';

export interface MaintenanceLogbookProps {
  vehicle: Vehicle;
  records: MaintenanceRecord[];
  isLoading: boolean;
  error?: string | null;
  onAddRecord: (req: CreateMaintenanceRequest) => Promise<boolean>;
}

export const MaintenanceLogbook: React.FC<MaintenanceLogbookProps> = ({
  vehicle,
  records,
  isLoading,
  error,
  onAddRecord,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [odometer, setOdometer] = useState<string>(vehicle.odometerKm.toString());
  const [cost, setCost] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a service title');
      return;
    }
    const odoNum = parseInt(odometer, 10);
    if (isNaN(odoNum) || odoNum < 0) {
      setFormError('Please enter a valid odometer reading');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const success = await onAddRecord({
        title: title.trim(),
        description: description.trim() || undefined,
        odometerAtService: odoNum,
        cost: cost ? parseFloat(cost) : undefined,
        serviceDate: new Date().toISOString(),
      });

      if (success) {
        setTitle('');
        setDescription('');
        setCost('');
        setShowAddForm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.dark.surface,
        border: `1px solid ${colors.dark.border}`,
        borderRadius: `${borderRadius.lg}px`,
        padding: `${spacing.lg}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${spacing.md}px`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: `${spacing.sm}px`,
          borderBottom: `1px solid ${colors.dark.border}`,
          paddingBottom: `${spacing.sm}px`,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={18} color="var(--brand-primary)" />
            Maintenance Logbook
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {vehicle.model.manufacturer?.name} {vehicle.model.name} • {formatOdometerKm(vehicle.odometerKm)}
          </span>
        </div>

        <Button
          variant={showAddForm ? 'outline' : 'primary'}
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <X size={14} /> Cancel
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Log Service
            </span>
          )}
        </Button>
      </div>

      {error && <ErrorView message={error} />}

      {/* Add Record Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: colors.dark.surfaceElevated,
            padding: `${spacing.md}px`,
            borderRadius: `${borderRadius.md}px`,
            border: `1px solid ${colors.dark.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${spacing.sm}px`,
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.brand.primaryLight }}>
            New Service Entry
          </span>

          {formError && <ErrorView message={formError} />}

          <Input
            label="Service / Repair Title"
            placeholder="e.g. Engine Oil & Filter Change"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="Notes / Parts Used (Optional)"
            placeholder="e.g. Motul 15W-50 Synthetic, OEM filter replaced"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${spacing.sm}px` }}>
            <Input
              label="Odometer (km)"
              type="number"
              placeholder="e.g. 12500"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
            />

            <Input
              label="Cost (₹ / $)"
              type="number"
              placeholder="e.g. 1850"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            style={{ marginTop: `${spacing.xs}px` }}
          >
            Save Record
          </Button>
        </form>
      )}

      {/* List Records */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: `${spacing.lg}px 0`, color: colors.dark.textMuted }}>
          <p style={{ margin: 0, fontSize: '13px' }}>Loading service history...</p>
        </div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: `${spacing.lg}px 0`, color: colors.dark.textMuted }}>
          <p style={{ margin: 0, fontSize: '13px' }}>No service records logged yet for this vehicle.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px`, maxHeight: '380px', overflowY: 'auto' }}>
          {records.map((rec) => (
            <div
              key={rec.id}
              style={{
                backgroundColor: colors.dark.surfaceElevated,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: `${borderRadius.sm}px`,
                border: `1px solid ${colors.dark.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: `${spacing.md}px`,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: colors.dark.textPrimary }}>
                    {rec.title}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: colors.brand.primaryLight,
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      padding: `1px 6px`,
                      borderRadius: `${borderRadius.xs}px`,
                    }}
                  >
                    {formatOdometerKm(rec.odometerAtService)}
                  </span>
                </div>

                {rec.description && (
                  <p style={{ fontSize: '12px', color: colors.dark.textSecondary, margin: `${spacing.xxs}px 0 0 0` }}>
                    {rec.description}
                  </p>
                )}

                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: `${spacing.xxs}px`, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {formatDate(rec.serviceDate)}
                </span>
              </div>

              {rec.cost !== undefined && rec.cost > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: colors.status.success }}>
                    ₹{rec.cost.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

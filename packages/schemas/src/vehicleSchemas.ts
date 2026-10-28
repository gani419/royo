import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const createVehicleSchema = z.object({
  modelId: z.string().min(1, 'Please select a vehicle model').max(128),
  nickname: z
    .string()
    .trim()
    .max(50, 'Nickname cannot exceed 50 characters')
    .optional(),
  modelYear: z
    .number({ invalid_type_error: 'Model year must be a valid number' })
    .int('Model year must be an integer')
    .min(1950, 'Model year cannot be earlier than 1950')
    .max(currentYear + 1, `Model year cannot exceed ${currentYear + 1}`),
  odometerKm: z
    .number({ invalid_type_error: 'Odometer reading must be a valid number' })
    .int('Odometer reading must be an integer')
    .min(0, 'Odometer reading cannot be negative')
    .max(999999, 'Odometer reading cannot exceed 999,999 km'),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format')
    .optional()
    .or(z.literal('')),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  lastServiceDate: z
    .string()
    .datetime({ message: 'Last service date must be a valid ISO datetime' })
    .optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;


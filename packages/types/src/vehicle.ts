import { EntityId, Timestamps } from './common';

export type VehicleCategory = 'motorcycle' | 'scooter' | 'car' | 'electric_vehicle';

export interface VehicleManufacturer {
  id: EntityId;
  name: string;
  country?: string;
  logoUrl?: string;
}

export interface VehicleModel {
  id: EntityId;
  manufacturerId: EntityId;
  name: string;
  category: VehicleCategory;
  engineDisplacementCc?: number;
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  yearStart?: number;
  yearEnd?: number;
  manufacturer?: VehicleManufacturer;
}

export interface Vehicle extends Timestamps {
  id: EntityId;
  userId: EntityId;
  modelId: EntityId;
  model: VehicleModel;
  nickname?: string;
  modelYear: number;
  odometerKm: number;
  vin?: string;
  lastServiceDate?: string;
}

export interface CreateVehicleDto {
  modelId: EntityId;
  nickname?: string;
  modelYear: number;
  odometerKm: number;
  vin?: string;
}

export interface UpdateVehicleDto extends Partial<CreateVehicleDto> {
  lastServiceDate?: string;
}


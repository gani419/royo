import { ApiClient } from '../apiClient';
import { ApiEndpoints } from '../ApiEndpoints';
import {
  Vehicle,
  VehicleModel,
  VehicleManufacturer,
  CreateVehicleDto,
  UpdateVehicleDto,
} from '@royo/types';

export class VehicleService {
  constructor(private client: ApiClient) {}

  public async getVehicles(): Promise<Vehicle[]> {
    return this.client.get<Vehicle[]>(ApiEndpoints.VEHICLES.LIST);
  }

  public async getVehicleById(id: string): Promise<Vehicle> {
    return this.client.get<Vehicle>(ApiEndpoints.VEHICLES.DETAILS(id));
  }

  public async createVehicle(dto: CreateVehicleDto): Promise<Vehicle> {
    return this.client.post<Vehicle>(ApiEndpoints.VEHICLES.CREATE, dto);
  }

  public async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    return this.client.patch<Vehicle>(ApiEndpoints.VEHICLES.UPDATE(id), dto);
  }

  public async deleteVehicle(id: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(ApiEndpoints.VEHICLES.DELETE(id));
  }

  public async getManufacturers(): Promise<VehicleManufacturer[]> {
    return this.client.get<VehicleManufacturer[]>(
      ApiEndpoints.VEHICLES.MANUFACTURERS, { requiresAuth: false }
    );
  }

  public async getModels(manufacturerId?: string): Promise<VehicleModel[]> {
    return this.client.get<VehicleModel[]>(ApiEndpoints.VEHICLES.MODELS, {
      requiresAuth: false,
      params: { manufacturerId },
    });
  }
}


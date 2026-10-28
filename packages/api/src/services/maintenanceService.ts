import { ApiClient } from '../apiClient';
import { ApiEndpoints } from '../ApiEndpoints';
import { MaintenanceRecord, CreateMaintenanceRequest } from '@royo/types';

export class MaintenanceService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async listRecords(vehicleId: string): Promise<MaintenanceRecord[]> {
    return this.client.get<MaintenanceRecord[]>(ApiEndpoints.VEHICLES.MAINTENANCE(vehicleId));
  }

  async createRecord(vehicleId: string, req: CreateMaintenanceRequest): Promise<MaintenanceRecord> {
    return this.client.post<MaintenanceRecord>(ApiEndpoints.VEHICLES.MAINTENANCE(vehicleId), req);
  }
}


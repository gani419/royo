export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  title: string;
  description?: string;
  serviceDate: string; // ISO 8601 string
  odometerAtService: number;
  cost?: number;
  createdAt: string;
}

export interface CreateMaintenanceRequest {
  title: string;
  description?: string;
  serviceDate: string;
  odometerAtService: number;
  cost?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: 'FREE' | 'RIDER_PRO' | 'WORKSHOP';
  dailyAiLimit: number;
  monthlyPrice: number;
  features: string[];
}


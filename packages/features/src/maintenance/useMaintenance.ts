import { useState, useEffect, useCallback, useRef } from "react";
import {
  MaintenanceRecord,
  CreateMaintenanceRequest,
  Vehicle,
} from "@royo/types";
import { MaintenanceService } from "@royo/api";
import { getSharedApiClient } from "@royo/store";
import { getErrorMessage } from "@royo/utils";

export function useMaintenance(vehicle?: Vehicle | null) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const vehicleId = vehicle?.id;
  const fetchRecords = useCallback(async () => {
    const request = ++generation.current;
    setRecords([]);
    setError(null);
    if (!vehicleId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await new MaintenanceService(
        getSharedApiClient(),
      ).listRecords(vehicleId);
      if (request === generation.current) setRecords(data ?? []);
    } catch (err) {
      if (request === generation.current) setError(getErrorMessage(err));
    } finally {
      if (request === generation.current) setIsLoading(false);
    }
  }, [vehicleId]);
  useEffect(() => {
    void fetchRecords();
    return () => {
      generation.current++;
    };
  }, [fetchRecords]);
  const addRecord = async (req: CreateMaintenanceRequest): Promise<boolean> => {
    if (!vehicleId) return false;
    setIsLoading(true);
    setError(null);
    const request = generation.current;
    try {
      const created = await new MaintenanceService(
        getSharedApiClient(),
      ).createRecord(vehicleId, req);
      if (request === generation.current)
        setRecords((prev) => [created, ...prev]);
      return true;
    } catch (err) {
      if (request === generation.current) setError(getErrorMessage(err));
      return false;
    } finally {
      if (request === generation.current) setIsLoading(false);
    }
  };
  return { records, isLoading, error, addRecord, refreshRecords: fetchRecords };
}

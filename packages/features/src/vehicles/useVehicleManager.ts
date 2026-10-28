import { useState, useCallback, useEffect, useRef } from "react";
import {
  useAppDispatch,
  useAppSelector,
  setSelectedVehicleId,
  getSharedApiClient,
} from "@royo/store";
import { VehicleService } from "@royo/api";
import { Vehicle, CreateVehicleDto } from "@royo/types";
import { getErrorMessage } from "@royo/utils";

export function useVehicleManager() {
  const dispatch = useAppDispatch();
  const selectedVehicleId = useAppSelector(
    (state) => state.vehicle.selectedVehicleId,
  );
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const getVehicleService = useCallback(() => {
    return new VehicleService(getSharedApiClient());
  }, []);

  const loadVehicles = useCallback(async () => {
    const request = ++requestGeneration.current;
    setIsLoading(true);
    setError(null);
    try {
      const service = getVehicleService();
      const list = await service.getVehicles();
      if (request === requestGeneration.current) setVehicles(list ?? []);
      // Auto-select first vehicle if none selected
    } catch (err) {
      if (request === requestGeneration.current) setError(getErrorMessage(err));
    } finally {
      if (request === requestGeneration.current) setIsLoading(false);
    }
  }, [getVehicleService]);

  const selectVehicle = useCallback(
    (id: string | null) => {
      dispatch(setSelectedVehicleId(id));
    },
    [dispatch],
  );

  const addVehicle = useCallback(
    async (dto: CreateVehicleDto): Promise<Vehicle> => {
      setIsLoading(true);
      setError(null);
      try {
        const service = getVehicleService();
        const created = await service.createVehicle(dto);
        setVehicles((prev) => [...prev, created]);
        dispatch(setSelectedVehicleId(created.id));
        return created;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getVehicleService, dispatch],
  );

  const activeVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;

  useEffect(() => {
    setVehicles([]);
    setError(null);
    if (userId) loadVehicles().catch(() => {});
    else setIsLoading(false);
    return () => {
      requestGeneration.current++;
    };
  }, [loadVehicles, userId]);

  return {
    vehicles,
    activeVehicle,
    selectedVehicleId,
    isLoading,
    error,
    selectVehicle,
    addVehicle,
    refresh: loadVehicles,
  };
}

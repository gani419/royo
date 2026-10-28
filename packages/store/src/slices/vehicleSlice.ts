import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VehicleState {
  selectedVehicleId: string | null;
}

const initialState: VehicleState = {
  selectedVehicleId: null,
};

export const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    setSelectedVehicleId: (state, action: PayloadAction<string | null>) => {
      state.selectedVehicleId = action.payload;
    },
    updateVehicleOdometer: (
      _state,
      _action: PayloadAction<{ vehicleId: string; odometerKm: number }>
    ) => {
      // Handled or listened by RTK / queries
    },
  },
});

export const { setSelectedVehicleId, updateVehicleOdometer } = vehicleSlice.actions;

export default vehicleSlice.reducer;


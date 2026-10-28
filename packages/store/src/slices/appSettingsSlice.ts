import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppTheme = 'dark' | 'light' | 'system';

export interface AppSettingsState {
  theme: AppTheme;
  diagnosticMode: boolean;
  soundEnabled: boolean;
}

const initialState: AppSettingsState = {
  theme: 'dark',
  diagnosticMode: false,
  soundEnabled: true,
};

export const appSettingsSlice = createSlice({
  name: 'appSettings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<AppTheme>) => {
      state.theme = action.payload;
    },
    setDiagnosticMode: (state, action: PayloadAction<boolean>) => {
      state.diagnosticMode = action.payload;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
  },
});

export const { setTheme, setDiagnosticMode, setSoundEnabled } =
  appSettingsSlice.actions;

export default appSettingsSlice.reducer;


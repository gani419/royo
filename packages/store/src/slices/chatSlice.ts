import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatState {
  activeSessionId: string | null;
  drafts: Record<string, string>; // Keyed by sessionId or 'new'
  isGenerating: boolean;
}

const initialState: ChatState = {
  activeSessionId: null,
  drafts: {},
  isGenerating: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveSessionId: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
    },
    setDraftMessage: (
      state,
      action: PayloadAction<{ key: string; draft: string }>
    ) => {
      state.drafts[action.payload.key] = action.payload.draft;
    },
    clearDraftMessage: (state, action: PayloadAction<string>) => {
      delete state.drafts[action.payload];
    },
    setIsGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
  },
});

export const {
  setActiveSessionId,
  setDraftMessage,
  clearDraftMessage,
  setIsGenerating,
} = chatSlice.actions;

export default chatSlice.reducer;


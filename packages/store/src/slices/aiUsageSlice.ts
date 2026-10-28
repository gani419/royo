import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserAIQuota } from '@royo/types';

export interface AIUsageState {
  quota: UserAIQuota | null;
  optimisticMessagesUsed: number;
}

const initialState: AIUsageState = {
  quota: null,
  optimisticMessagesUsed: 0,
};

export const aiUsageSlice = createSlice({
  name: 'aiUsage',
  initialState,
  reducers: {
    setQuota: (state, action: PayloadAction<UserAIQuota>) => {
      state.quota = action.payload;
      state.optimisticMessagesUsed = 0; // reconcile with server
    },
    incrementOptimisticUsage: (state) => {
      state.optimisticMessagesUsed += 1;
    },
  },
});

export const { setQuota, incrementOptimisticUsage } = aiUsageSlice.actions;

export default aiUsageSlice.reducer;


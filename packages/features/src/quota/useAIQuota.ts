import { useCallback, useEffect, useState, useRef } from "react";
import {
  useAppDispatch,
  useAppSelector,
  setQuota,
  incrementOptimisticUsage,
  getSharedApiClient,
} from "@royo/store";
import { AIService } from "@royo/api";

export function useAIQuota() {
  const dispatch = useAppDispatch();
  const { quota, optimisticMessagesUsed } = useAppSelector(
    (state) => state.aiUsage,
  );
  const userId = useAppSelector((state) => state.auth.user?.id);
  const currentUserId = useRef(userId);
  currentUserId.current = userId;
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const getAIService = useCallback(() => {
    return new AIService(getSharedApiClient());
  }, []);

  const refreshQuota = useCallback(async () => {
    if (!userId) return;
    setIsFetching(true);
    try {
      const aiService = getAIService();
      const quotaData = await aiService.getQuota();
      if (currentUserId.current === userId) dispatch(setQuota(quotaData));
    } catch {
      // Non-fatal if offline
    } finally {
      setIsFetching(false);
    }
  }, [getAIService, dispatch, userId]);

  const recordUsageOptimistically = useCallback(() => {
    dispatch(incrementOptimisticUsage());
  }, [dispatch]);

  const effectiveRemaining = quota
    ? Math.max(0, quota.remainingMessages - optimisticMessagesUsed)
    : 5;

  const isQuotaExhausted = effectiveRemaining <= 0;

  useEffect(() => {
    refreshQuota().catch(() => {});
  }, [refreshQuota]);

  return {
    quota,
    effectiveRemaining,
    isQuotaExhausted,
    isFetching,
    refreshQuota,
    recordUsageOptimistically,
  };
}

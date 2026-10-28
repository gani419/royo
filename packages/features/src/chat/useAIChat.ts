import { useState, useCallback, useEffect, useRef } from "react";
import {
  useAppDispatch,
  useAppSelector,
  setActiveSessionId,
  setIsGenerating,
  setDraftMessage,
  getSharedApiClient,
} from "@royo/store";
import { ChatService } from "@royo/api";
import { ChatSession, ChatMessage, Vehicle } from "@royo/types";
import { getErrorMessage } from "@royo/utils";
import { useAIQuota } from "../quota/useAIQuota";

export function useAIChat(activeVehicle: Vehicle | null) {
  const dispatch = useAppDispatch();
  const { activeSessionId, isGenerating, drafts } = useAppSelector(
    (s) => s.chat,
  );
  const userId = useAppSelector((s) => s.auth.user?.id);
  const currentUserId = useRef(userId);
  currentUserId.current = userId;
  const { refreshQuota } = useAIQuota();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setLoading] = useState(false);
  const [chatError, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const sending = useRef(false);
  const service = () => new ChatService(getSharedApiClient());
  const loadSessions = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      return [];
    }
    try {
      const list = await service().getSessions();
      if (currentUserId.current === userId) setSessions(list ?? []);
      return list ?? [];
    } catch (err) {
      setError(getErrorMessage(err));
      return [];
    }
  }, [userId]);
  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);
  // Reset context when the account or vehicle changes, including during a request.
  useEffect(() => {
    generation.current++;
    dispatch(setActiveSessionId(null));
    setMessages([]);
    setError(null);
    setLoading(false);
  }, [activeVehicle?.id, userId, dispatch]);
  const loadMessages = useCallback(async (sessionId: string) => {
    const request = ++generation.current;
    setLoading(true);
    setError(null);
    setMessages([]);
    try {
      const list = await service().getMessages(sessionId);
      if (request === generation.current) setMessages(list ?? []);
    } catch (err) {
      if (request === generation.current) setError(getErrorMessage(err));
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, []);
  const selectSession = useCallback(
    (id: string | null) => {
      if (sending.current) return;
      generation.current++;
      dispatch(setActiveSessionId(id));
      setMessages([]);
      setError(null);
      if (id) void loadMessages(id);
    },
    [dispatch, loadMessages],
  );
  const deleteSession = async (id: string) => {
    if (sending.current) return;
    try {
      await service().deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) selectSession(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  const draftKey = activeSessionId ?? `new:${activeVehicle?.id ?? "none"}`;
  const setDraft = (draft: string) =>
    dispatch(setDraftMessage({ key: draftKey, draft }));
  const sendMessage = async (content: string): Promise<boolean> => {
    if (sending.current) return false;
    if (!userId || !activeVehicle) {
      setError("Sign in and select a motorcycle to start a conversation.");
      return false;
    }
    if (content.trim().length < 5 || content.length > 1000) {
      setError("Describe the issue in 5–1,000 characters.");
      return false;
    }
    sending.current = true;
    dispatch(setIsGenerating(true));
    setError(null);
    const request = generation.current;
    let target = activeSessionId;
    try {
      if (!target) {
        const session = await service().createSession({
          vehicleId: activeVehicle.id,
        });
        target = session.id;
        if (request !== generation.current) return false;
        dispatch(setActiveSessionId(target));
        dispatch(setDraftMessage({ key: target, draft: content }));
        setSessions((prev) => [session, ...prev]);
      }
      const response = await service().sendMessage(target, {
        content: content.trim(),
      });
      if (request !== generation.current) return false;
      const now = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${response.id}`,
          sessionId: target!,
          senderType: "user",
          content,
          createdAt: now,
          updatedAt: now,
        },
        response,
      ]);
      dispatch(setDraftMessage({ key: draftKey, draft: "" }));
      dispatch(setDraftMessage({ key: target, draft: "" }));
      return true;
    } catch (err) {
      if (request === generation.current) setError(getErrorMessage(err));
      return false;
    } finally {
      sending.current = false;
      dispatch(setIsGenerating(false));
      void refreshQuota();
    }
  };
  return {
    sessions,
    activeSessionId,
    messages,
    isLoadingMessages,
    isGenerating,
    chatError,
    currentDraft: drafts[draftKey] ?? "",
    setDraft,
    selectSession,
    deleteSession,
    sendMessage,
    loadMessages,
    refreshSessions: loadSessions,
  };
}

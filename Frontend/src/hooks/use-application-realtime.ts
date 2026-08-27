import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ParseStatus, PipelineStatus } from "@/types/recruitment";

/* ── types ── */

interface ApplicationRealtimeState {
  parseStatus: ParseStatus | null;
  pipelineStatus: PipelineStatus | null;
  screeningId: string | null;
  aiScore: number | null;
  loading: boolean;
}

interface ScreeningCompletePayload {
  pipelineStatus: PipelineStatus;
  screeningId: string;
  aiScore: number | null;
}

const POLL_INTERVAL = 15_000;

const INITIAL_STATE: ApplicationRealtimeState = {
  parseStatus: null,
  pipelineStatus: null,
  screeningId: null,
  aiScore: null,
  loading: false,
};

/* ── hook ── */

export function useApplicationRealtime(applicationId: string | null) {
  const [state, setState] = useState<ApplicationRealtimeState>(INITIAL_STATE);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchInitialState = async (id: string) => {
    try {
      const res = await fetch(`/api/recruitment/applications/${id}`);
      if (!res.ok) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      const data = await res.json();
      setState({
        parseStatus: data.cv?.parse_status ?? null,
        pipelineStatus: data.application?.pipeline_status ?? null,
        screeningId: data.application?.current_screening_id ?? null,
        aiScore: data.screening?.ai_score ?? null,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      setState((prev) => {
        if (prev.parseStatus !== "PENDING" && prev.parseStatus !== "PROCESSING") {
          if (pollRef.current) clearInterval(pollRef.current);
          return prev;
        }
        return prev;
      });
      await fetchInitialState(id);
    }, POLL_INTERVAL);
  };

  useEffect(() => {
    if (!applicationId) {
      setState(INITIAL_STATE);
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    fetchInitialState(applicationId);

    // Supabase Realtime broadcast subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`application:${applicationId}`)
      .on("broadcast", { event: "screening_complete" }, ({ payload }) => {
        const p = payload as ScreeningCompletePayload;
        setState((prev) => ({
          ...prev,
          parseStatus: "COMPLETED",
          pipelineStatus: p.pipelineStatus ?? prev.pipelineStatus,
          screeningId: p.screeningId ?? prev.screeningId,
          aiScore: p.aiScore ?? prev.aiScore,
        }));
        if (pollRef.current) clearInterval(pollRef.current);
      })
      .subscribe();

    startPolling(applicationId);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  return state;
}

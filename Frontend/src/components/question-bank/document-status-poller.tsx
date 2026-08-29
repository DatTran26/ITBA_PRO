"use client";

import { useEffect, useRef } from "react";
import type { DocumentSource } from "./question-bank-types";

type Status = DocumentSource["status"];

interface Props {
  documentId: string;
  onStatus: (status: Status) => void;
  active: boolean;
}

const POLL_MS = 3000;

const TERMINAL: Status[] = ["topics_ready", "done", "failed"];

export function DocumentStatusPoller({ documentId, onStatus, active }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/document-sources/${documentId}`);
        if (!res.ok) return;
        const data: { status: Status } = await res.json();
        if (cancelled) return;
        onStatus(data.status);
        if (!TERMINAL.includes(data.status)) {
          timerRef.current = setTimeout(poll, POLL_MS);
        }
      } catch {
        if (!cancelled) {
          timerRef.current = setTimeout(poll, POLL_MS);
        }
      }
    }

    // Poll immediately so a freshly-mounted poller (e.g. returning to the tab
    // mid-extraction) reflects current status without waiting a full interval.
    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [documentId, onStatus, active]);

  return null;
}

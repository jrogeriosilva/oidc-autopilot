import { useEffect, useRef } from "react";
import type { LogLine, ModuleCard, ExecutionSummary } from "../types/api";

export interface SSECallbacks {
  onLogLine: (line: LogLine) => void;
  onModuleList: (cards: ModuleCard[]) => void;
  onModuleUpdate: (card: ModuleCard) => void;
  onPlanDone: (outcome: ExecutionSummary) => void;
  onStopped: (cards: ModuleCard[]) => void;
}

export function useSSE(callbacks: SSECallbacks) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      es = new EventSource("/api/feed");

      es.addEventListener("message", (ev) => {
        try {
          cbRef.current.onLogLine(JSON.parse(ev.data));
        } catch { /* ignore malformed */ }
      });

      es.addEventListener("moduleList", (ev) => {
        try {
          cbRef.current.onModuleList(JSON.parse(ev.data));
        } catch { /* ignore */ }
      });

      es.addEventListener("moduleUpdate", (ev) => {
        try {
          cbRef.current.onModuleUpdate(JSON.parse(ev.data));
        } catch { /* ignore */ }
      });

      es.addEventListener("planDone", (ev) => {
        try {
          cbRef.current.onPlanDone(JSON.parse(ev.data));
        } catch { /* ignore */ }
      });

      es.addEventListener("stopped", (ev) => {
        try {
          const d = JSON.parse(ev.data);
          cbRef.current.onStopped(d.cards || []);
        } catch { /* ignore */ }
      });

      es.onerror = () => {
        es?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);
}

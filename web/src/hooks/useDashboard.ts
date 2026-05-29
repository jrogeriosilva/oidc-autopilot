import { useReducer, useEffect, useCallback, useState, useRef } from "react";
import type {
  LogLine,
  ModuleCard,
  ExecutionSummary,
} from "../types/api";
import { fetchHealth } from "../api/client";
import { useSSE } from "./useSSE";

type Status = "idle" | "running" | "done" | "errored" | "stopped";

interface DashboardState {
  status: Status;
  cards: ModuleCard[];
  logs: LogLine[];
  outcome: ExecutionSummary | null;
  startedAt: number | null;
  cardStarts: Record<string, number>;
}

type Action =
  | { type: "SET_RUNNING" }
  | { type: "ADD_LOG"; line: LogLine }
  | { type: "CLEAR_LOGS" }
  | { type: "SET_MODULE_LIST"; cards: ModuleCard[] }
  | { type: "UPDATE_MODULE"; card: ModuleCard }
  | { type: "PLAN_DONE"; outcome: ExecutionSummary }
  | { type: "STOPPED"; cards: ModuleCard[] }
  | { type: "ERROR" }
  | { type: "RESTORE"; state: Partial<DashboardState> };

const LOG_CAP = 5_000;

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case "SET_RUNNING":
      return { status: "running", cards: [], logs: [], outcome: null, startedAt: Date.now(), cardStarts: {} };

    case "ADD_LOG": {
      const logs =
        state.logs.length >= LOG_CAP
          ? [...state.logs.slice(1), action.line]
          : [...state.logs, action.line];
      return { ...state, logs };
    }

    case "CLEAR_LOGS":
      return { ...state, logs: [] };

    case "SET_MODULE_LIST":
      return { ...state, cards: action.cards, cardStarts: {} };

    case "UPDATE_MODULE": {
      const cards = state.cards.map((c) =>
        c.name === action.card.name ? { ...c, ...action.card } : c,
      );
      const status = action.card.status;
      const isActive = status && status !== "PENDING" && status !== "CREATED";
      const isDone = status === "FINISHED" || status === "INTERRUPTED" || status === "ERROR";
      const cardStarts = { ...state.cardStarts };
      const existing = cardStarts[action.card.name];
      if (isActive && !existing && !isDone) {
        cardStarts[action.card.name] = Date.now();
      }
      // Stamp final duration on the card if finishing.
      if (isDone && existing) {
        const idx = cards.findIndex((c) => c.name === action.card.name);
        if (idx >= 0) cards[idx] = { ...cards[idx], durationMs: Date.now() - existing };
      }
      return { ...state, cards, cardStarts };
    }

    case "PLAN_DONE": {
      const hasFails = action.outcome.failed > 0;
      const cards = state.cards.map((c) => {
        const mod = action.outcome.modules.find((m) => m.name === c.name);
        return mod
          ? { ...c, status: mod.state, result: mod.result, lastMessage: mod.result }
          : c;
      });
      return {
        ...state,
        status: hasFails ? "errored" : "done",
        outcome: action.outcome,
        cards,
      };
    }

    case "STOPPED": {
      const cards = state.cards.map((c) => {
        const updated = action.cards.find((u) => u.name === c.name);
        return updated || c;
      });
      return { ...state, status: "stopped", cards };
    }

    case "ERROR":
      return { ...state, status: "errored" };

    case "RESTORE":
      return { ...state, ...action.state };

    default:
      return state;
  }
}

const initialState: DashboardState = {
  status: "idle",
  cards: [],
  logs: [],
  outcome: null,
  startedAt: null,
  cardStarts: {},
};

export function useDashboard() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Restore state from /api/health on mount
  useEffect(() => {
    fetchHealth()
      .then((d) => {
        if (d.executionInFlight) {
          dispatch({
            type: "RESTORE",
            state: { status: "running", cards: d.moduleCards },
          });
        } else if (d.outcome) {
          dispatch({ type: "PLAN_DONE", outcome: d.outcome });
        } else if (d.moduleCards.length > 0) {
          dispatch({
            type: "RESTORE",
            state: { cards: d.moduleCards },
          });
        }
      })
      .catch(() => {});
  }, []);

  // SSE integration
  useSSE({
    onLogLine: useCallback(
      (line: LogLine) => dispatch({ type: "ADD_LOG", line }),
      [],
    ),
    onModuleList: useCallback(
      (cards: ModuleCard[]) => dispatch({ type: "SET_MODULE_LIST", cards }),
      [],
    ),
    onModuleUpdate: useCallback(
      (card: ModuleCard) => dispatch({ type: "UPDATE_MODULE", card }),
      [],
    ),
    onPlanDone: useCallback(
      (outcome: ExecutionSummary) => dispatch({ type: "PLAN_DONE", outcome }),
      [],
    ),
    onStopped: useCallback(
      (cards: ModuleCard[]) => dispatch({ type: "STOPPED", cards }),
      [],
    ),
  });

  const setRunning = useCallback(() => dispatch({ type: "SET_RUNNING" }), []);
  const setError = useCallback(() => dispatch({ type: "ERROR" }), []);
  const clearLogs = useCallback(() => dispatch({ type: "CLEAR_LOGS" }), []);

  // Live tick to drive elapsed time + per-card durations.
  const [now, setNow] = useState(() => Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (state.status === "running") {
      tickRef.current = setInterval(() => setNow(Date.now()), 500);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
      };
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, [state.status]);

  const elapsedMs = state.startedAt ? now - state.startedAt : 0;

  // Decorate cards with live durationMs based on cardStarts (final stamp wins).
  const decoratedCards: ModuleCard[] = state.cards.map((c) => {
    if (c.durationMs != null) return c;
    const start = state.cardStarts[c.name];
    if (start == null) return c;
    return { ...c, durationMs: now - start };
  });

  return {
    ...state,
    cards: decoratedCards,
    elapsedMs,
    setRunning,
    setError,
    clearLogs,
  };
}

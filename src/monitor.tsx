import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_CONFIG,
  type Config,
  type EcgBlock,
  type PpgBlock,
  type Telemetry,
} from "./types";
import {
  ecgPoints,
  isFresh,
  mergeBlocks,
  normalizeTelemetry,
  ppgPoints,
  readDatabase,
  validateConfig,
} from "./data";

function useMonitorState() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG),
    [ready, setReady] = useState(false);
  const [latest, setLatest] = useState<Telemetry | null>(null),
    [history, setHistory] = useState<Telemetry[]>([]);
  const [ecgBlocks, setEcgBlocks] = useState<Record<string, EcgBlock>>({}),
    [ppgBlocks, setPpgBlocks] = useState<Record<string, PpgBlock>>({});
  const [sessions, setSessions] = useState<string[]>([]),
    [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false),
    [revision, setRevision] = useState(0),
    [historyLoading, setHistoryLoading] = useState(false),
    [hasOlder, setHasOlder] = useState(true);
  const [active, setActive] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  const historyKeys = useRef<Record<string, Telemetry>>({}),
    sessionRef = useRef("");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener("change", (s) =>
      setActive(s === "active"),
    );
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("health-monitor-config");
        const c = saved ? JSON.parse(saved) : DEFAULT_CONFIG;
        if (!validateConfig(c)) {
          if (!cancelled) setConfig(c);
          const cached = await AsyncStorage.getItem(
            `health-cache:${c.deviceId}`,
          );
          if (cached && !cancelled)
            setLatest(normalizeTelemetry(JSON.parse(cached)));
        }
      } catch {
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!ready || !active) return;
    const controller = new AbortController();
    let cancelled = false,
      timer: ReturnType<typeof setTimeout>;
    let round = 0;
    const tick = async () => {
      try {
        const raw = await readDatabase<unknown>(
          config,
          "latest",
          {},
          controller.signal,
        );
        const record = normalizeTelemetry(raw);
        if (cancelled) return;
        if (!record)
          throw new Error(
            "No compatible device data found. Check the database URL and device ID.",
          );
        setLatest(record);
        setError("");
        if (round++ % 10 === 0)
          void AsyncStorage.setItem(
            `health-cache:${config.deviceId}`,
            JSON.stringify(record),
          ).catch(() => {});
        if (round === 1) {
          const available = await readDatabase<Record<string, boolean>>(
            config,
            "sessions",
            { shallow: "true" },
            controller.signal,
          );
          if (!cancelled)
            setSessions(
              [
                record.sessionId!,
                ...Object.keys(available || {}).filter(
                  (s) => s !== record.sessionId,
                ),
              ].filter(Boolean),
            );
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Connection unavailable.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = setTimeout(tick, config.refreshMs);
        }
      }
    };
    void tick();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [config, ready, active, revision]);
  const session = selectedSession || latest?.sessionId || "";
  useEffect(() => {
    if (!ready || !active || !session || paused) return;
    let cancelled = false,
      timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    let lastEcg = "",
      lastPpg = "",
      lastHistory = "";
    historyKeys.current = {};
    sessionRef.current = session;
    const poll = async () => {
      const path = `sessions/${session}`;
      const query = (last: string, limit: number) => ({
        orderBy: '"$key"',
        ...(last ? { startAt: JSON.stringify(last) } : {}),
        limitToLast: String(limit),
      });
      const results = await Promise.allSettled([
        readDatabase<Record<string, EcgBlock>>(
          config,
          `${path}/ecg`,
          query(lastEcg, 8),
          controller.signal,
        ),
        readDatabase<Record<string, PpgBlock>>(
          config,
          `${path}/ppg`,
          query(lastPpg, 8),
          controller.signal,
        ),
        readDatabase<Record<string, unknown>>(
          config,
          `${path}/telemetry`,
          query(lastHistory, 180),
          controller.signal,
        ),
      ]);
      if (cancelled) return;
      const [e, p, h] = results;
      if (e.status === "fulfilled" && e.value) {
        const b = e.value;
        setEcgBlocks((old) => mergeBlocks(old, b));
        lastEcg = Object.keys(b).sort().at(-1) || lastEcg;
      }
      if (p.status === "fulfilled" && p.value) {
        const b = p.value;
        setPpgBlocks((old) => mergeBlocks(old, b));
        lastPpg = Object.keys(b).sort().at(-1) || lastPpg;
      }
      if (h.status === "fulfilled" && h.value) {
        Object.entries(h.value).forEach(([key, v]) => {
          const n = normalizeTelemetry(v);
          if (n) historyKeys.current[key] = n;
        });
        const entries = Object.entries(historyKeys.current)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-1200);
        historyKeys.current = Object.fromEntries(entries);
        setHistory(entries.map(([, v]) => v));
        lastHistory = Object.keys(h.value).sort().at(-1) || lastHistory;
      }
      const failure = results.find((r) => r.status === "rejected");
      if (failure?.status === "rejected")
        setError(
          `Some graph data is unavailable: ${String(failure.reason?.message || failure.reason)}`,
        );
      timer = setTimeout(poll, 4000);
    };
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setEcgBlocks({});
      setPpgBlocks({});
      setHistory([]);
      setHasOlder(true);
      void poll();
    });
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [config, ready, session, active, paused, revision]);
  const loadOlder = useCallback(async () => {
    if (historyLoading || !session) return;
    setHistoryLoading(true);
    const captured = session;
    try {
      const first = Object.keys(historyKeys.current).sort()[0];
      if (!first) return;
      const records = await readDatabase<Record<string, unknown>>(
        config,
        `sessions/${session}/telemetry`,
        { orderBy: '"$key"', endAt: JSON.stringify(first), limitToLast: "180" },
      );
      if (sessionRef.current !== captured) return;
      const entries = Object.entries(records || {}).filter(
        ([key]) => key < first,
      );
      setHasOlder(entries.length > 0);
      entries.forEach(([key, value]) => {
        const n = normalizeTelemetry(value);
        if (n) historyKeys.current[key] = n;
      });
      setHistory(
        Object.entries(historyKeys.current)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-1200)
          .map(([, v]) => v),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "History could not be loaded.");
    } finally {
      setHistoryLoading(false);
    }
  }, [config, session, historyLoading]);
  const saveConfig = useCallback(async (next: Config) => {
    const problem = validateConfig(next);
    if (problem) throw new Error(problem);
    await AsyncStorage.setItem("health-monitor-config", JSON.stringify(next));
    setLatest(null);
    setHistory([]);
    setEcgBlocks({});
    setPpgBlocks({});
    setSelectedSession(null);
    setConfig(next);
  }, []);
  const clearCache = useCallback(async () => {
    await AsyncStorage.removeItem(`health-cache:${config.deviceId}`);
    setLatest(null);
  }, [config.deviceId]);
  return {
    config,
    saveConfig,
    latest,
    history,
    analysisHistory:
      selectedSession && selectedSession !== latest?.sessionId ? [] : history,
    ecgBlocks,
    ppgBlocks,
    ecg: useMemo(() => ecgPoints(ecgBlocks), [ecgBlocks]),
    ppg: useMemo(() => ppgPoints(ppgBlocks), [ppgBlocks]),
    sessions,
    session,
    selectedSession,
    setSelectedSession,
    error,
    loading,
    now,
    fresh: isFresh(latest, now),
    paused,
    setPaused,
    refresh: () => setRevision((r) => r + 1),
    loadOlder,
    historyLoading,
    hasOlder,
    clearCache,
  };
}
const MonitorContext = createContext<ReturnType<typeof useMonitorState> | null>(
  null,
);
export function MonitorProvider({ children }: { children: React.ReactNode }) {
  const value = useMonitorState();
  return (
    <MonitorContext.Provider value={value}>{children}</MonitorContext.Provider>
  );
}
export function useMonitor() {
  const value = useContext(MonitorContext);
  if (!value) throw new Error("Monitor provider is missing");
  return value;
}

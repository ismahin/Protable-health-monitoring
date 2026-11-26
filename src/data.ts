import type { Config, EcgBlock, PpgBlock, Point, Telemetry } from "./types";

export function validateConfig(config: Config): string | null {
  try {
    const u = new URL(config.databaseUrl);
    if (
      u.protocol !== "https:" ||
      !/\.(firebaseio\.com|firebasedatabase\.app)$/.test(u.hostname) ||
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      u.port ||
      u.pathname !== "/"
    )
      return "Use an HTTPS Firebase Realtime Database root URL.";
  } catch {
    return "Enter a valid Firebase database URL.";
  }
  if (
    typeof config.deviceId !== "string" ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(config.deviceId)
  )
    return "Device ID may contain letters, numbers, hyphens and underscores.";
  return null;
}
export async function readDatabase<T>(
  config: Config,
  path: string,
  query: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<T | null> {
  const url = new URL(
    `${config.databaseUrl.replace(/\/$/, "")}/devices/${config.deviceId}/${path}.json`,
  );
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  const timeout = new AbortController();
  const abort = () => timeout.abort();
  signal?.addEventListener("abort", abort);
  if (signal?.aborted) abort();
  const timer = setTimeout(abort, 15000);
  try {
    const response = await fetch(url.toString(), { signal: timeout.signal });
    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? "Firebase access denied. Configure authentication and database rules before using a private database."
          : `Firebase request failed (${response.status}).`,
      );
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
const finite = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);
export function normalizeTelemetry(value: unknown): Telemetry | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Telemetry;
  if (
    !v.pulseOx ||
    !v.ecg ||
    !v.gps ||
    !v.device ||
    !v.wifi ||
    !finite(v.measuredAtEpochMs) ||
    !finite(v.uptimeMs) ||
    !finite(v.ecg.rawAdcCounts) ||
    !finite(v.ecg.filteredCounts) ||
    !finite(v.ecg.rmsCounts) ||
    !finite(v.pulseOx.irCounts) ||
    !finite(v.pulseOx.redCounts) ||
    !finite(v.gps.ageMs) ||
    !finite(v.gps.satellites) ||
    !finite(v.device.freeHeapBytes) ||
    typeof v.ecg.status !== "string" ||
    typeof v.pulseOx.status !== "string"
  )
    return null;
  return {
    ...v,
    pulseOx: {
      ...v.pulseOx,
      heartRateValid:
        v.pulseOx.heartRateValid === true &&
        finite(v.pulseOx.heartRateBpm) &&
        v.pulseOx.heartRateBpm > 0,
      spo2Valid:
        v.pulseOx.spo2Valid === true &&
        finite(v.pulseOx.spo2Percent) &&
        v.pulseOx.spo2Percent > 0 &&
        v.pulseOx.spo2Percent <= 100,
    },
    ecg: {
      ...v.ecg,
      leadPlusOff: v.ecg.leadPlusOff !== false,
      leadMinusOff: v.ecg.leadMinusOff !== false,
      heartRateValid:
        v.ecg.heartRateValid === true &&
        v.ecg.stateCode === 4 &&
        v.ecg.leadPlusOff === false &&
        v.ecg.leadMinusOff === false &&
        finite(v.ecg.heartRateBpm) &&
        v.ecg.heartRateBpm > 0,
    },
    gps: {
      ...v.gps,
      altitudeMeters: finite(v.gps.altitudeMeters)
        ? v.gps.altitudeMeters
        : undefined,
      speedKmh: finite(v.gps.speedKmh) ? v.gps.speedKmh : undefined,
      hdop: finite(v.gps.hdop) ? v.gps.hdop : undefined,
      valid:
        v.gps.valid === true &&
        finite(v.gps.latitudeDeg) &&
        Math.abs(v.gps.latitudeDeg) <= 90 &&
        finite(v.gps.longitudeDeg) &&
        Math.abs(v.gps.longitudeDeg) <= 180,
    },
  };
}
export function isFresh(v: Telemetry | null, now = Date.now()) {
  const age = now - (v?.measuredAtEpochMs || 0);
  return !!v && age >= -5000 && age < 15000;
}
export function ecgPoints(blocks: Record<string, EcgBlock>): Point[] {
  const points = new Map<number, Point>();
  Object.values(blocks).forEach((b) => {
    if (
      !finite(b.startEpochMs) ||
      !Array.isArray(b.offsetMs) ||
      !Array.isArray(b.sequence) ||
      !Array.isArray(b.filteredCounts)
    )
      return;
    const n = Math.min(
      b.count,
      b.offsetMs.length,
      b.sequence.length,
      b.filteredCounts.length,
    );
    for (let i = 0; i < n; i++)
      if (
        finite(b.offsetMs[i]) &&
        finite(b.filteredCounts[i]) &&
        finite(b.sequence[i])
      )
        points.set(b.sequence[i], {
          t: b.startEpochMs + b.offsetMs[i],
          y: b.filteredCounts[i],
          seq: b.sequence[i],
          quality: b.quality?.[i],
          gap: !!b.leadOffBits?.[i],
        });
  });
  const result = [...points.values()].sort((a, b) => a.seq! - b.seq!);
  return result.map((p, i) => ({
    ...p,
    gap:
      p.gap ||
      (i > 0 &&
        (p.seq !== result[i - 1].seq! + 1 ||
          p.t - result[i - 1].t > 24 ||
          p.t < result[i - 1].t)),
  }));
}
export function ppgPoints(
  blocks: Record<string, PpgBlock>,
  channel: "irCounts" | "redCounts" = "irCounts",
): Point[] {
  const points = new Map<number, Point>();
  Object.values(blocks).forEach((b) => {
    if (
      !Array.isArray(b.offsetMs) ||
      !Array.isArray(b[channel]) ||
      !finite(b.startEpochMs)
    )
      return;
    for (
      let i = 0;
      i < Math.min(b.count, b.offsetMs.length, b[channel].length);
      i++
    )
      if (finite(b[channel][i])) {
        const t = b.startEpochMs + b.offsetMs[i];
        points.set(t, { t, y: b[channel][i] });
      }
  });
  return [...points.values()]
    .sort((a, b) => a.t - b.t)
    .map((p, i, a) => ({ ...p, gap: i > 0 && p.t - a[i - 1].t > 50 }));
}
export function mergeBlocks<T>(
  existing: Record<string, T>,
  incoming: Record<string, T> | null,
  limit = 24,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries({ ...existing, ...incoming })
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-limit),
  );
}
export function windowPoints(points: Point[], seconds: number) {
  const end = points.at(-1)?.t || 0;
  return points.filter((p) => p.t >= end - seconds * 1000);
}
// Preserve local extrema AND discontinuities when fitting a dense trace to pixels.
export function reducePoints(points: Point[], width: number): Point[] {
  const budget = Math.max(20, Math.floor(width));
  if (points.length <= budget * 2) return points;
  const chunk = Math.ceil(points.length / budget),
    out: Point[] = [];
  for (let i = 0; i < points.length; i += chunk) {
    const group = points.slice(i, i + chunk);
    let low = group[0],
      high = group[0];
    for (const p of group) {
      if (p.y < low.y) low = p;
      if (p.y > high.y) high = p;
    }
    const selected = [
      group[0],
      low,
      high,
      group.at(-1)!,
      ...group.filter((p) => p.gap),
    ];
    out.push(...[...new Set(selected)].sort((a, b) => a.t - b.t));
  }
  return out;
}
export function trendPoints(
  history: Telemetry[],
  metric: "hr" | "spo2" | "ecg",
): Point[] {
  return history
    .map((v) => ({
      t: v.measuredAtEpochMs,
      y:
        metric === "hr"
          ? (v.pulseOx.heartRateBpm ?? 0)
          : metric === "spo2"
            ? (v.pulseOx.spo2Percent ?? 0)
            : (v.ecg.heartRateBpm ?? 0),
      gap:
        metric === "hr"
          ? !v.pulseOx.heartRateValid
          : metric === "spo2"
            ? !v.pulseOx.spo2Valid
            : !v.ecg.heartRateValid,
    }))
    .sort((a, b) => a.t - b.t);
}

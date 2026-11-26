import { describe, it, expect } from "vitest";
import {
  normalizeTelemetry,
  isFresh,
  ecgPoints,
  ppgPoints,
  mergeBlocks,
  reducePoints,
  validateConfig,
} from "../src/data";
import { analyze, answerQuestion } from "../src/insights";
import { chartPath } from "../src/chart";
import { DEFAULT_CONFIG, type EcgBlock, type Telemetry } from "../src/types";
const now = 1795532400000;
function record(overrides: Partial<Telemetry> = {}): Telemetry {
  return {
    measuredAtEpochMs: now,
    uptimeMs: 1000,
    sessionId: "a",
    pulseOx: {
      heartRateValid: true,
      heartRateBpm: 75,
      spo2Valid: true,
      spo2Percent: 98,
      status: "TRACKING",
      irCounts: 40000,
      redCounts: 30000,
      sampleCount: 100,
      droppedBatches: 0,
    },
    ecg: {
      heartRateValid: true,
      heartRateBpm: 75,
      rawAdcCounts: 2000,
      filteredCounts: 20,
      rmsCounts: 20,
      stateCode: 4,
      status: "TRACKING",
      leadPlusOff: false,
      leadMinusOff: false,
      sampleCount: 250,
      lateSamples: 0,
      uploadDroppedSamples: 0,
    },
    gps: {
      valid: true,
      latitudeDeg: 0,
      longitudeDeg: 0,
      satellites: 8,
      ageMs: 100,
      hdop: 1,
      characters: 100,
      passedChecksums: 8,
      failedChecksums: 0,
    },
    wifi: { connected: true, rssiDbm: -55 },
    device: {
      firmware: "test",
      freeHeapBytes: 100000,
      ppgUploadDroppedSamples: 0,
    },
    ...overrides,
  };
}
function block(start = 1): EcgBlock {
  return {
    count: 3,
    startSequence: start,
    startEpochMs: now,
    nominalSampleRateHz: 250,
    sequence: [start, start + 1, start + 2],
    offsetMs: [0, 4, 8],
    rawCounts: [2000, 2001, 2002],
    filteredCounts: [0, 1, 2],
    quality: [4, 4, 4],
    leadOffBits: [0, 0, 0],
  };
}
describe("measurement integrity", () => {
  it("rejects malformed records and impossible coordinates", () => {
    expect(normalizeTelemetry({})).toBeNull();
    const r = record();
    r.gps.latitudeDeg = 99;
    expect(normalizeTelemetry(r)?.gps.valid).toBe(false);
  });
  it("does not display null, zero or invalid sensor measurements as valid", () => {
    const r = record();
    r.pulseOx.spo2Percent = NaN;
    r.pulseOx.heartRateBpm = 0;
    r.ecg.leadPlusOff = true;
    const n = normalizeTelemetry(r)!;
    expect(n.pulseOx.spo2Valid).toBe(false);
    expect(n.pulseOx.heartRateValid).toBe(false);
    expect(n.ecg.heartRateValid).toBe(false);
  });
  it("recognizes stale or implausibly future measurements", () => {
    expect(isFresh(record(), now)).toBe(true);
    expect(isFresh(record(), now + 16000)).toBe(false);
    expect(isFresh(record(), now - 6000)).toBe(false);
  });
  it("deduplicates overlapping ECG blocks and keeps sequence gaps", () => {
    const a = block(),
      b = block(3);
    b.startEpochMs = now + 8;
    const c = block(10);
    c.startEpochMs = now + 100;
    const p = ecgPoints({ a, b, c });
    expect(p.map((x) => x.seq)).toEqual([1, 2, 3, 4, 5, 10, 11, 12]);
    expect(p[5].gap).toBe(true);
    expect(p[3].t).toBe(now + 12);
  });
  it("handles truncated sample arrays without inventing samples", () => {
    const b = block();
    b.filteredCounts = [1];
    expect(ecgPoints({ b })).toHaveLength(1);
  });
  it("keeps PPG acquisition times and flags a missing interval", () => {
    const p = ppgPoints({
      a: {
        count: 3,
        startEpochMs: now,
        nominalSampleRateHz: 100,
        offsetMs: [0, 10, 100],
        irCounts: [1, 2, 3],
        redCounts: [2, 3, 4],
      },
    });
    expect(p[2].gap).toBe(true);
    expect(p[1].t).toBe(now + 10);
  });
  it("never draws through lead-off samples", () => {
    const p = [
      { t: now, y: 1, quality: 4 },
      { t: now + 4, y: 2, quality: 0 },
      { t: now + 8, y: 3, quality: 4 },
    ];
    const path = chartPath(p, 400, 200, 0, 4, now, now + 8);
    expect((path.match(/M/g) || []).length).toBe(2);
    expect(path.includes("L")).toBe(false);
  });
  it("preserves narrow QRS-like extrema during rendering reduction", () => {
    const points = Array.from({ length: 3000 }, (_, i) => ({
      t: i,
      y: i === 1001 ? 1000 : 0,
      gap: i === 1500,
    }));
    const reduced = reducePoints(points, 200);
    expect(reduced.some((p) => p.y === 1000)).toBe(true);
    expect(reduced.some((p) => p.gap)).toBe(true);
  });
  it("bounds buffered block memory", () =>
    expect(Object.keys(mergeBlocks({ a: 1, b: 2 }, { c: 3 }, 2))).toEqual([
      "b",
      "c",
    ]));
  it("validates Firebase endpoints and safe device IDs", () => {
    expect(validateConfig(DEFAULT_CONFIG)).toBeNull();
    expect(
      validateConfig({ ...DEFAULT_CONFIG, databaseUrl: "http://evil.example" }),
    ).toBeTruthy();
    expect(
      validateConfig({ ...DEFAULT_CONFIG, deviceId: "../other" }),
    ).toBeTruthy();
  });
});
describe("local analysis safety and evidence", () => {
  it("withholds physiological interpretation when the device is stale", () => {
    const insights = analyze(record(), [], now + 16000);
    expect(insights.map((i) => i.id)).toEqual(["stale"]);
    expect(
      answerQuestion("heart rate", record(), [], now + 16000),
    ).not.toContain("75 bpm");
  });
  it("explains electrode failures instead of reporting a rhythm problem", () => {
    const r = record();
    r.ecg.leadMinusOff = true;
    expect(analyze(r, [], now)[0].id).toBe("leads");
    expect(answerQuestion("ECG", r, [], now)).toContain(
      "disconnected electrode",
    );
  });
  it("needs sufficient valid data before flagging personal baseline changes", () => {
    const r = record();
    r.pulseOx.heartRateBpm = 110;
    const history = Array.from({ length: 15 }, (_, i) =>
      record({ measuredAtEpochMs: now - (i + 1) * 3000 }),
    );
    expect(
      analyze(r, history.slice(0, 5), now).some((i) => i.id === "trend-hr"),
    ).toBe(false);
    const insight = analyze(r, history, now).find((i) => i.id === "trend-hr");
    expect(insight?.evidence).toContain("15 valid samples");
    expect(insight?.body).toContain("does not determine");
  });
  it("does not offer medication or a disease diagnosis", () =>
    expect(
      answerQuestion("What medication do I need?", record(), [], now),
    ).toContain("cannot diagnose"));
  it("prioritizes emergency symptoms even when there is no fresh sensor data", () =>
    expect(answerQuestion("severe chest pain", null, [], now)).toContain(
      "urgent medical care",
    ));
  it("does not confuse location zero with missing coordinates", () =>
    expect(answerQuestion("gps", record(), [], now)).toContain(
      "0.000000, 0.000000",
    ));
});

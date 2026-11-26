export type Telemetry = {
  deviceId?: string;
  sessionId?: string;
  measuredAtEpochMs: number;
  receivedAt?: number;
  uptimeMs: number;
  pulseOx: {
    heartRateValid: boolean;
    heartRateBpm?: number;
    spo2Valid: boolean;
    spo2Percent?: number;
    status: string;
    irCounts: number;
    redCounts: number;
    sampleCount: number;
    droppedBatches: number;
  };
  ecg: {
    heartRateValid: boolean;
    heartRateBpm?: number;
    rawAdcCounts: number;
    filteredCounts: number;
    rmsCounts: number;
    stateCode: number;
    status: string;
    leadPlusOff: boolean;
    leadMinusOff: boolean;
    sampleCount: number;
    lateSamples: number;
    uploadDroppedSamples: number;
  };
  gps: {
    valid: boolean;
    latitudeDeg?: number;
    longitudeDeg?: number;
    satellites: number;
    ageMs: number;
    altitudeMeters?: number;
    speedKmh?: number;
    hdop?: number;
    characters: number;
    passedChecksums: number;
    failedChecksums: number;
  };
  wifi: { connected: boolean; rssiDbm: number };
  device: {
    firmware: string;
    freeHeapBytes: number;
    ppgUploadDroppedSamples: number;
  };
};
export type EcgBlock = {
  count: number;
  startSequence: number;
  startEpochMs: number;
  nominalSampleRateHz: number;
  sequence: number[];
  offsetMs: number[];
  rawCounts: number[];
  filteredCounts: number[];
  quality: number[];
  leadOffBits: number[];
};
export type PpgBlock = {
  count: number;
  startEpochMs: number;
  nominalSampleRateHz: number;
  offsetMs: number[];
  irCounts: number[];
  redCounts: number[];
};
export type Point = {
  t: number;
  y: number;
  quality?: number;
  seq?: number;
  gap?: boolean;
};
export type Config = {
  databaseUrl: string;
  deviceId: string;
  refreshMs: number;
  tileUrl: string;
};
export type Insight = {
  id: string;
  title: string;
  body: string;
  action: string;
  tone: "good" | "attention" | "neutral";
  evidence: string;
};
export const DEFAULT_CONFIG: Config = {
  databaseUrl: "https://health-monitor-a4958-default-rtdb.firebaseio.com",
  deviceId: "esp32s3_14c19fcb0d3c",
  refreshMs: 3000,
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
};

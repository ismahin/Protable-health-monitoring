import { isFresh } from "./data";
import type { Insight, Telemetry } from "./types";
export const median = (values: number[]) => {
  const a = [...values].sort((x, y) => x - y);
  return a.length
    ? (a[Math.floor((a.length - 1) / 2)] + a[Math.ceil((a.length - 1) / 2)]) / 2
    : 0;
};
export function analyze(
  latest: Telemetry | null,
  history: Telemetry[],
  now = Date.now(),
): Insight[] {
  if (!latest)
    return [
      {
        id: "missing",
        title: "Connect your monitor",
        body: "No sensor record has been received yet.",
        action: "Check the device ID in Developer > Connection settings.",
        tone: "neutral",
        evidence: "No available measurements",
      },
    ];
  if (!isFresh(latest, now))
    return [
      {
        id: "stale",
        title: "Waiting for fresh measurements",
        body: "The monitor is offline or its last upload is older than 15 seconds. Historical readings cannot describe your current condition.",
        action: "Reconnect the monitor before interpreting the readings.",
        tone: "attention",
        evidence: "Measurement timestamp is stale",
      },
    ];
  const result: Insight[] = [];
  if (latest.ecg.leadPlusOff || latest.ecg.leadMinusOff)
    result.push({
      id: "leads",
      title: "ECG connection needs attention",
      body: "The monitor reports a disconnected electrode lead. The graph is an engineering signal preview, not a usable rhythm assessment.",
      action:
        "Check the electrode cable and module wiring. Use isolated battery power for body-connected measurements.",
      tone: "attention",
      evidence: `LO+ ${latest.ecg.leadPlusOff ? "off" : "connected"} · LO− ${latest.ecg.leadMinusOff ? "off" : "connected"}`,
    });
  else if (latest.ecg.stateCode !== 4)
    result.push({
      id: "quality",
      title: "Let the ECG signal settle",
      body: "The firmware reports a weak, noisy, or settling signal. ECG heart rate is withheld until the input passes its quality checks.",
      action:
        "Keep the cable still and check electrode contact before interpreting the trace.",
      tone: "attention",
      evidence: latest.ecg.status,
    });
  if (!latest.pulseOx.heartRateValid || !latest.pulseOx.spo2Valid)
    result.push({
      id: "optical",
      title: "Improve the optical reading",
      body: "Heart rate or oxygen saturation is not currently valid. Missing readings are never treated as zero.",
      action:
        "Cover the pulse sensor steadily, avoid pressure and bright light, and wait for a stable measurement.",
      tone: "neutral",
      evidence: latest.pulseOx.status,
    });
  const recent = history.filter(
    (v) =>
      v.measuredAtEpochMs >= latest.measuredAtEpochMs - 600000 &&
      v.measuredAtEpochMs < latest.measuredAtEpochMs &&
      isFresh({ ...v, measuredAtEpochMs: latest.measuredAtEpochMs }, now),
  );
  for (const metric of ["hr", "spo2"] as const) {
    const valid =
      metric === "hr"
        ? latest.pulseOx.heartRateValid
        : latest.pulseOx.spo2Valid;
    const values = recent
      .filter((v) =>
        metric === "hr" ? v.pulseOx.heartRateValid : v.pulseOx.spo2Valid,
      )
      .map(
        (v) =>
          (metric === "hr" ? v.pulseOx.heartRateBpm : v.pulseOx.spo2Percent)!,
      );
    if (!valid || values.length < 12) continue;
    const center = median(values),
      mad = median(values.map((v) => Math.abs(v - center))),
      current = (
        metric === "hr"
          ? latest.pulseOx.heartRateBpm
          : latest.pulseOx.spo2Percent
      )!;
    const deviation = Math.abs(current - center),
      floor = metric === "hr" ? 8 : 2;
    if (deviation > Math.max(floor, 3 * 1.4826 * mad))
      result.push({
        id: `trend-${metric}`,
        title: `${metric === "hr" ? "Pulse" : "SpO₂"} changed from recent readings`,
        body: `The current reading differs from your recent median of ${center.toFixed(0)} ${metric === "hr" ? "bpm" : "%"}. This statistical flag does not determine whether a value is healthy.`,
        action:
          "Repeat the measurement at rest. Discuss persistent unexpected readings or symptoms with a qualified clinician.",
        tone: "attention",
        evidence: `Robust baseline · ${values.length} valid samples · median absolute deviation ${mad.toFixed(1)}`,
      });
  }
  if (latest.gps.valid && latest.gps.hdop && latest.gps.hdop > 5)
    result.push({
      id: "gps",
      title: "Location accuracy is limited",
      body: "Satellite geometry is weak. The map marker may drift and is not an emergency location guarantee.",
      action: "Move the GPS antenna toward a clear view of the sky.",
      tone: "neutral",
      evidence: `HDOP ${latest.gps.hdop.toFixed(1)} · ${latest.gps.satellites} satellites`,
    });
  if (!result.length)
    result.push({
      id: "collect",
      title: "Keep building your baseline",
      body: "Sensor quality checks currently pass. Local analysis compares valid readings with your recent personal baseline; it cannot diagnose a condition.",
      action:
        "Keep measurement conditions consistent and review trends over time.",
      tone: "good",
      evidence: `${recent.length} recent records available`,
    });
  return result;
}
export function answerQuestion(
  question: string,
  latest: Telemetry | null,
  history: Telemetry[],
  now = Date.now(),
): string {
  const q = question.toLowerCase();
  if (/chest pain|cannot breathe|can't breathe|faint|emergency/.test(q))
    return "If you have severe chest pain, difficulty breathing, fainting, or another emergency symptom, seek urgent medical care now. Do not wait for this prototype or its readings.";
  if (!latest || !isFresh(latest, now))
    return (
      analyze(latest, history, now)[0].body +
      " " +
      analyze(latest, history, now)[0].action
    );
  if (/diagnos|disease|medicine|medication|treatment/.test(q))
    return "This local assistant cannot diagnose disease or recommend treatment or medication. Share concerning readings and symptoms with a qualified clinician.";
  if (/location|gps|map/.test(q))
    return latest.gps.valid
      ? `The last device fix is ${latest.gps.latitudeDeg!.toFixed(6)}, ${latest.gps.longitudeDeg!.toFixed(6)}, using ${latest.gps.satellites} satellites. Open Location to view it; this is the monitor location, not your phone location.`
      : "There is no valid GPS fix. Place the antenna where it has a clearer view of the sky.";
  if (/oxygen|spo2|saturation/.test(q))
    return latest.pulseOx.spo2Valid
      ? `The latest sensor estimate is ${latest.pulseOx.spo2Percent}%. This prototype is not clinically validated. Repeat unexpected readings with a validated device and seek care if you feel unwell.`
      : "SpO₂ is not valid yet. Hold a finger steadily over the optical sensor and wait for a stable reading.";
  if (/heart|pulse|bpm/.test(q))
    return latest.pulseOx.heartRateValid
      ? `The latest optical pulse is ${latest.pulseOx.heartRateBpm} bpm. ${analyze(latest, history, now).find((i) => i.id === "trend-hr")?.body || "Review the pulse trend in Signals; one reading cannot establish a diagnosis."}`
      : "The optical pulse is not valid yet. Keep your finger still on the pulse sensor and wait for a stable reading.";
  if (/ecg|electrode|signal|graph/.test(q))
    return (
      analyze(latest, history, now).find(
        (i) => i.id === "leads" || i.id === "quality",
      )?.body ||
      "The ECG input passes the firmware signal gate. The graph shows filtered ADC counts, not calibrated millivolts. Rhythm diagnosis is not supported."
    );
  if (/wifi|connect|offline/.test(q))
    return `The last device report shows Wi-Fi ${latest.wifi.connected ? "connected" : "disconnected"} (${latest.wifi.rssiDbm} dBm). Hold BOOT for four seconds to reopen Health Monitoring setup; the dashboard also works offline.`;
  return (
    analyze(latest, history, now)
      .map((i) => `${i.title}. ${i.action}`)
      .join("\n\n") +
    "\n\nI answer questions about current readings, signal quality, recent trends, GPS, and connectivity locally. I am not a general language model or diagnostic system."
  );
}

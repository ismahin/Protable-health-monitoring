import React, { useState } from "react";
import { View, Switch } from "react-native";
import { useMonitor } from "../monitor";
import { C } from "../theme";
import {
  Badge,
  Button,
  Card,
  CardHeading,
  ChipGroup,
  Disclosure,
  Page,
  Row,
  Txt,
} from "../components/ui";
import Chart from "../components/Chart";
import { trendPoints, windowPoints } from "../data";
import { exportJson } from "../export";
export default function Signals() {
  const m = useMonitor();
  const [seconds, setSeconds] = useState(10),
    [validOnly, setValidOnly] = useState(false),
    [metric, setMetric] = useState<"hr" | "spo2" | "ecg">("hr"),
    [notice, setNotice] = useState("");
  const save = async () => {
    try {
      await exportJson({
        schemaVersion: 1,
        deviceId: m.config.deviceId,
        sessionId: m.session,
        scope: "Loaded data only",
        exportedAt: new Date().toISOString(),
        latest: m.latest,
        telemetry: m.history,
        ecg: m.ecgBlocks,
        ppg: m.ppgBlocks,
      });
      setNotice("Export ready");
    } catch {
      setNotice("Export unavailable");
    }
  };
  return (
    <Page
      title="Signals"
      action={
        <Button
          secondary
          label={m.paused ? "Resume" : "Pause"}
          icon={m.paused ? "play" : "pause"}
          onPress={() => m.setPaused(!m.paused)}
        />
      }
    >
      <Row
        style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
      >
        <ChipGroup
          values={[
            { value: 5, label: "5s" },
            { value: 10, label: "10s" },
            { value: 30, label: "30s" },
          ]}
          value={seconds}
          onChange={setSeconds}
        />
        <Badge
          text={
            m.paused ? "Paused" : m.selectedSession ? "Recording" : "Latest"
          }
          tone={m.paused ? "amber" : "green"}
        />
      </Row>
      <Card style={{ backgroundColor: "#0F252C", borderColor: "#234C4D" }}>
        <CardHeading title="ECG" subtitle="ADC counts · 250 Hz" />
        <Chart
          points={windowPoints(m.ecg, seconds)}
          height={240}
          onlyValid={validOnly}
        />
        <Row style={{ justifyContent: "space-between", marginTop: 12 }}>
          <Txt style={{ fontSize: 12, color: C.muted }}>Quality filter</Txt>
          <Switch
            accessibilityLabel="Show only quality-passed ECG samples"
            value={validOnly}
            onValueChange={setValidOnly}
            trackColor={{ false: C.line, true: C.green }}
          />
        </Row>
      </Card>
      <Card>
        <CardHeading title="Optical pulse" subtitle="IR counts · 100 Hz" />
        <Chart
          points={windowPoints(m.ppg, seconds)}
          height={180}
          color={C.blue}
          unit="IR counts"
        />
      </Card>
      <Card>
        <CardHeading title="Trends" />
        <ChipGroup
          values={[
            { value: "hr", label: "Heart rate" },
            { value: "spo2", label: "SpO₂" },
            { value: "ecg", label: "ECG rate" },
          ]}
          value={metric}
          onChange={setMetric}
        />
        <View style={{ marginTop: 18 }}>
          <Chart
            points={trendPoints(m.history, metric)}
            mode="trend"
            height={200}
            unit={metric === "spo2" ? "%" : "bpm"}
            color={metric === "spo2" ? C.blue : C.green}
          />
        </View>
      </Card>
      <Card>
        <Disclosure title="Recordings & export">
          <ChipGroup
            value={m.selectedSession || "live"}
            onChange={(s) => m.setSelectedSession(s === "live" ? null : s)}
            values={[
              { value: "live", label: "Current" },
              ...m.sessions
                .slice(0, 12)
                .map((s, i) => ({ value: s, label: "Session " + (i + 1) })),
            ]}
          />
          <Row style={{ flexWrap: "wrap" }}>
            <Button
              secondary
              label={m.historyLoading ? "Loading..." : "Older readings"}
              disabled={
                m.historyLoading || !m.hasOlder || m.history.length >= 1200
              }
              onPress={() => void m.loadOlder()}
              icon="time-outline"
            />
            <Button
              label="Export data"
              onPress={() => void save()}
              icon="download-outline"
            />
          </Row>
          {notice ? (
            <Txt style={{ fontSize: 12, color: C.muted }}>{notice}</Txt>
          ) : null}
          <Txt style={{ fontSize: 12, color: C.muted }}>
            ECG preview · Not calibrated in mV
          </Txt>
        </Disclosure>
      </Card>
    </Page>
  );
}

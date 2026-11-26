import React from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useMonitor } from "../monitor";
import { C, fonts } from "../theme";
import {
  Badge,
  Card,
  CardHeading,
  Icon,
  Page,
  Row,
  Txt,
} from "../components/ui";
import { Metric } from "../components/Metric";
import Chart from "../components/Chart";
import { windowPoints } from "../data";
import { analyze } from "../insights";
export default function Overview() {
  const m = useMonitor(),
    v = m.latest,
    wide = useWindowDimensions().width > 1150;
  const leadOff = v?.ecg.leadPlusOff || v?.ecg.leadMinusOff;
  const insight = analyze(v, m.analysisHistory, m.now)[0];
  return (
    <Page title="PORTABLE HEALTH MONITORING SYSTEM">
      <Row style={{ flexWrap: "wrap", alignItems: "stretch", gap: 12 }}>
        <Metric
          title="Heart rate"
          icon="heart-outline"
          value={v?.pulseOx.heartRateValid ? v.pulseOx.heartRateBpm : undefined}
          unit="bpm"
          color={C.red}
          note={
            v?.pulseOx.heartRateValid ? "Pulse detected" : "Waiting for finger"
          }
        />
        <Metric
          title="Oxygen"
          icon="water-outline"
          value={v?.pulseOx.spo2Valid ? v.pulseOx.spo2Percent : undefined}
          unit="%"
          color={C.blue}
          note={v?.pulseOx.spo2Valid ? "SpO₂ estimate" : "Waiting for reading"}
        />
        <Metric
          title="ECG rate"
          icon="pulse-outline"
          value={v?.ecg.heartRateValid ? v.ecg.heartRateBpm : undefined}
          unit="bpm"
          note={
            leadOff
              ? "Lead disconnected"
              : v?.ecg.heartRateValid
                ? "Signal acquired"
                : "Acquiring signal"
          }
        />
        <Metric
          title="Satellites"
          icon="navigate-outline"
          value={v?.gps.satellites}
          unit="sat"
          color={C.lime}
          note={v?.gps.valid ? "GPS fix" : "Searching"}
        />
      </Row>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 18 }}>
        <Card
          style={{
            flex: wide ? 1.8 : undefined,
            backgroundColor: "#0F252C",
            borderColor: "#234C4D",
          }}
        >
          <CardHeading
            title="ECG waveform"
            right={
              <Badge
                text={
                  !m.fresh
                    ? "Recorded"
                    : leadOff
                      ? "Lead off"
                      : v?.ecg.stateCode === 4
                        ? "Signal ready"
                        : v?.ecg.stateCode === 2
                          ? "Weak signal"
                          : v?.ecg.stateCode === 3
                            ? "Noisy signal"
                            : "Settling"
                }
                tone={
                  !m.fresh
                    ? "gray"
                    : leadOff || v?.ecg.stateCode !== 4
                      ? "amber"
                      : "green"
                }
              />
            }
          />
          <Chart points={windowPoints(m.ecg, 10)} height={wide ? 260 : 210} />
          <Row style={{ justifyContent: "space-between", marginTop: 10 }}>
            <Txt style={{ fontSize: 12, color: C.muted }}>
              ADC counts · 250 Hz
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Expand signals"
              onPress={() => router.navigate("/signals")}
            >
              <Row style={{ gap: 6 }}>
                <Txt
                  style={{
                    color: C.green,
                    fontFamily: fonts.bold,
                    fontSize: 12,
                  }}
                >
                  View signals
                </Txt>
                <Icon name="expand-outline" color={C.green} size={14} />
              </Row>
            </Pressable>
          </Row>
        </Card>
        <View style={{ flex: wide ? 1 : undefined, gap: 18 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View insight"
            onPress={() => router.navigate("/insights")}
          >
            <Card>
              <Row
                style={{ justifyContent: "space-between", marginBottom: 15 }}
              >
                <Row>
                  <View
                    style={{
                      padding: 9,
                      borderRadius: 12,
                      backgroundColor: C.mint,
                    }}
                  >
                    <Icon name="sparkles-outline" size={17} color={C.green} />
                  </View>
                  <Txt style={{ fontSize: 12, fontFamily: fonts.bold }}>
                    Smart insight
                  </Txt>
                </Row>
                <Icon name="arrow-forward" size={17} color={C.muted} />
              </Row>
              <Txt
                style={{ fontFamily: fonts.bold, fontSize: 15, lineHeight: 23 }}
              >
                {insight.title}
              </Txt>
              <Txt
                numberOfLines={2}
                style={{
                  color: C.muted,
                  fontSize: 12,
                  lineHeight: 20,
                  marginTop: 8,
                }}
              >
                {insight.action}
              </Txt>
            </Card>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open location"
            onPress={() => router.navigate("/location")}
          >
            <Card>
              <Row style={{ justifyContent: "space-between" }}>
                <Row>
                  <View
                    style={{
                      padding: 10,
                      backgroundColor: "#1B2F42",
                      borderRadius: 13,
                    }}
                  >
                    <Icon name="location-outline" color={C.blue} />
                  </View>
                  <View>
                    <Txt style={{ fontFamily: fonts.bold, fontSize: 13 }}>
                      Monitor location
                    </Txt>
                    <Txt style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>
                      {v?.gps.valid ? "GPS fix available" : "Waiting for GPS"}
                    </Txt>
                  </View>
                </Row>
                <Icon name="arrow-forward" size={18} color={C.muted} />
              </Row>
              {v?.gps.valid && (
                <Txt
                  selectable
                  style={{
                    fontSize: 13,
                    letterSpacing: 0.3,
                    color: C.blue,
                    marginTop: 17,
                  }}
                >
                  {v.gps.latitudeDeg!.toFixed(5)}°,{" "}
                  {v.gps.longitudeDeg!.toFixed(5)}°
                </Txt>
              )}
            </Card>
          </Pressable>
        </View>
      </View>
      <Row style={{ justifyContent: "space-between" }}>
        <Row style={{ gap: 7 }}>
          <Icon
            name={v?.wifi.connected ? "wifi" : "wifi-outline"}
            size={15}
            color={m.fresh ? C.green : C.muted}
          />
          <Txt style={{ fontSize: 12, color: C.muted }}>
            {m.fresh && v?.wifi.connected ? v.wifi.rssiDbm + " dBm" : "Offline"}
          </Txt>
        </Row>
        <Txt style={{ fontSize: 12, color: C.muted }}>
          {v
            ? "Updated " +
              new Date(v.measuredAtEpochMs).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "Waiting for monitor"}
        </Txt>
      </Row>
    </Page>
  );
}

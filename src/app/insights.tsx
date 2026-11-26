import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useMonitor } from "../monitor";
import { analyze } from "../insights";
import {
  Badge,
  Button,
  Card,
  CardHeading,
  Disclosure,
  Icon,
  Page,
  Row,
  Txt,
} from "../components/ui";
import ChatScreen from "../components/ChatScreen";
import { C, fonts } from "../theme";
const shortActions: Record<string, string> = {
  missing: "Connect your monitor to get started.",
  stale: "Reconnect for fresh readings.",
  leads: "Check the ECG cable and electrode contact.",
  quality: "Keep still while the signal settles.",
  optical: "Hold your finger steadily on the sensor.",
  gps: "Move the antenna near a clear sky view.",
  collect: "Keep measuring to build your baseline.",
  "trend-hr": "Repeat your pulse reading at rest.",
  "trend-spo2": "Repeat your oxygen reading at rest.",
};
export default function Insights() {
  const m = useMonitor();
  const insights = useMemo(
    () => analyze(m.latest, m.analysisHistory, m.now),
    [m.latest, m.analysisHistory, m.now],
  );
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <Page title="Insights" action={<Badge text="Local insights" />}>
      {insights.map((i) => (
        <Card key={i.id}>
          <Row style={{ alignItems: "flex-start", gap: 13 }}>
            <View
              style={{
                padding: 10,
                borderRadius: 13,
                backgroundColor: i.tone === "attention" ? C.amberBg : C.mint,
              }}
            >
              <Icon
                name={
                  i.tone === "attention"
                    ? "alert-circle-outline"
                    : "sparkles-outline"
                }
                color={i.tone === "attention" ? C.amber : C.green}
                size={21}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Txt
                style={{ fontFamily: fonts.bold, fontSize: 15, lineHeight: 22 }}
              >
                {i.title}
              </Txt>
              <Txt
                style={{
                  fontSize: 12,
                  color: C.muted,
                  lineHeight: 20,
                  marginTop: 7,
                }}
              >
                {shortActions[i.id] || i.action}
              </Txt>
              <View style={{ marginTop: 10 }}>
                <Disclosure title="Why this appeared">
                  <Txt style={{ color: C.muted, fontSize: 12, lineHeight: 19 }}>
                    {i.body}
                  </Txt>
                  <Txt style={{ color: C.green, fontSize: 12, lineHeight: 18 }}>
                    {i.evidence}
                  </Txt>
                </Disclosure>
              </View>
            </View>
          </Row>
        </Card>
      ))}
      <Card>
        <CardHeading
          title="PHMS AI"
          right={<Icon name="sparkles" color={C.green} />}
        />
        <Txt style={{ fontFamily: fonts.bold, fontSize: 20, lineHeight: 28 }}>
          Let&apos;s make sense of it.
        </Txt>
        <Txt
          style={{
            color: C.muted,
            fontSize: 12,
            lineHeight: 20,
            marginTop: 9,
            marginBottom: 20,
          }}
        >
          Ask a question, explore a reading, or get a little guidance.
        </Txt>
        <Button
          label="Open chat"
          icon="chatbubble-ellipses-outline"
          onPress={() => setChatOpen(true)}
        />
        <Txt style={{ fontSize: 12, color: C.muted, marginTop: 13 }}>
          Powered by Groq. Messages are shared only when you send.
        </Txt>
      </Card>
      <ChatScreen visible={chatOpen} onClose={() => setChatOpen(false)} />
    </Page>
  );
}

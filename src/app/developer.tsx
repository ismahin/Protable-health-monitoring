import React from "react";
import { View, Image, useWindowDimensions } from "react-native";
import { C, fonts } from "../theme";
import {
  Badge,
  Card,
  CardHeading,
  Disclosure,
  Icon,
  Page,
  Row,
  Txt,
} from "../components/ui";
import ConnectionPanel from "../components/ConnectionPanel";
export default function Developer() {
  const wide = useWindowDimensions().width > 900;
  return (
    <Page title="Developer" showStatus={false}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ height: 4, backgroundColor: C.green }} />
        <View
          style={{
            padding: wide ? 36 : 25,
            flexDirection: wide ? "row" : "column",
            alignItems: "center",
            gap: wide ? 40 : 25,
          }}
        >
          <View
            style={{
              width: wide ? 270 : 245,
              maxWidth: "100%",
              aspectRatio: 472 / 552,
              backgroundColor: "#fff",
              borderRadius: 22,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "#354958",
            }}
          >
            <Image
              source={require("../../assets/profile.jpg")}
              accessibilityLabel="Easeen Patwary, developer"
              resizeMode="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </View>
          <View
            style={{
              flex: wide ? 1 : undefined,
              alignItems: wide ? "flex-start" : "center",
            }}
          >
            <Badge text="DEVELOPER" />
            <Txt
              style={{
                fontFamily: fonts.extra,
                fontSize: wide ? 34 : 28,
                letterSpacing: -0.8,
                marginTop: 16,
                textAlign: wide ? "left" : "center",
              }}
            >
              Easeen Patwary
            </Txt>
            <Txt style={{ color: C.muted, fontSize: 13, marginTop: 9 }}>
              Design & Development
            </Txt>
            <View
              style={{
                height: 1,
                backgroundColor: C.line,
                width: 70,
                marginVertical: 25,
              }}
            />
            <Row>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  backgroundColor: C.mint,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="pulse" size={26} color={C.green} />
              </View>
              <View>
                <Txt
                  style={{
                    fontFamily: fonts.extra,
                    fontSize: 21,
                    letterSpacing: 1,
                  }}
                >
                  PHMS
                </Txt>
                <Txt style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                  Portable Health Monitoring System
                </Txt>
              </View>
            </Row>
            <Txt style={{ fontSize: 12, color: C.muted, marginTop: 22 }}>
              Version 1.1.0
            </Txt>
          </View>
        </View>
      </Card>
      <Card>
        <CardHeading title="About PHMS" />
        <Txt style={{ fontSize: 12, lineHeight: 21, color: C.muted }}>
          Live readings, signals and location. Together in one place.
        </Txt>
        <View style={{ marginTop: 15 }}>
          <Disclosure title="About insights">
            <Txt style={{ fontSize: 12, lineHeight: 20, color: C.muted }}>
              Insights use local rules and statistical trends. This prototype is
              not clinically validated and does not diagnose or prescribe.
              Questions stay on your device.
            </Txt>
          </Disclosure>
        </View>
      </Card>
      <Card>
        <ConnectionPanel />
      </Card>
    </Page>
  );
}

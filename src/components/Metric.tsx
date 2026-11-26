import React from "react";
import { View } from "react-native";
import { C, fonts } from "../theme";
import { Card, Icon, Txt, Row, type IconName } from "./ui";
export function Metric({
  title,
  value,
  unit,
  icon,
  color = C.green,
  note,
}: {
  title: string;
  value?: number;
  unit: string;
  icon: IconName;
  color?: string;
  note: string;
}) {
  return (
    <Card style={{ flex: 1, minWidth: 128, padding: 14, overflow: "hidden" }}>
      <Row style={{ justifyContent: "space-between", gap: 4 }}>
        <View
          style={{
            padding: 8,
            borderRadius: 11,
            backgroundColor: color + "15",
          }}
        >
          <Icon name={icon} color={color} size={19} />
        </View>
        <Txt style={{ fontSize: 12, color: C.muted }}>{title}</Txt>
      </Row>
      <Row style={{ alignItems: "baseline", marginTop: 8, gap: 5 }}>
        <Txt
          style={{ fontFamily: fonts.extra, fontSize: 32, letterSpacing: -1 }}
        >
          {value === undefined ? "—" : value.toFixed(0)}
        </Txt>
        <Txt style={{ color: C.muted, fontSize: 12 }}>{unit}</Txt>
      </Row>
      <Txt
        style={{
          fontSize: 12,
          color: value === undefined ? C.muted : color,
          marginTop: 8,
        }}
        numberOfLines={1}
      >
        {note}
      </Txt>
    </Card>
  );
}

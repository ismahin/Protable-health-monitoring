import React, { useState } from "react";
import { View } from "react-native";
import Svg, { Path, Line, Text as SvgText } from "react-native-svg";
import type { Point } from "../types";
import { reducePoints } from "../data";
import { C } from "../theme";
import { chartPath } from "../chart";
import { Txt } from "./ui";
export default function Chart({
  points,
  height = 220,
  color = C.green,
  unit = "ADC counts",
  mode = "signal",
  onlyValid = false,
}: {
  points: Point[];
  height?: number;
  color?: string;
  unit?: string;
  mode?: "signal" | "trend";
  onlyValid?: boolean;
}) {
  const [width, setWidth] = useState(300);
  const visible = points.filter(
    (p) =>
      Number.isFinite(p.y) &&
      p.quality !== 0 &&
      (!onlyValid || p.quality === 4) &&
      !(mode === "trend" && p.gap),
  );
  const ys = visible.map((p) => p.y);
  let min = ys.length ? Math.min(...ys) : 0,
    max = ys.length ? Math.max(...ys) : 1;
  const pad = Math.max(
    (max - min) * 0.15,
    unit === "%" ? 1 : unit === "bpm" ? 4 : 10,
  );
  min -= pad;
  max += pad;
  const start = points[0]?.t || 0,
    end = points.at(-1)?.t || 1;
  const plot = reducePoints(points, width);
  const filtered =
    mode === "trend" ? plot.map((p) => (p.gap ? { ...p, y: NaN } : p)) : plot;
  const path = chartPath(
    filtered,
    width,
    height,
    min,
    max,
    start,
    end,
    onlyValid,
  );
  return (
    <View
      onLayout={(e) => setWidth(Math.max(200, e.nativeEvent.layout.width))}
      style={{ height }}
      accessibilityRole="image"
      accessibilityLabel={`${unit} graph, ${visible.length} available samples`}
    >
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const y = 12 + (i * (height - 40)) / 4;
          return (
            <React.Fragment key={i}>
              <Line
                x1={48}
                x2={width - 12}
                y1={y}
                y2={y}
                stroke={C.line}
                strokeDasharray="3 5"
              />
              <SvgText
                x={39}
                y={y + 3}
                textAnchor="end"
                fill={C.muted}
                fontSize={9}
              >
                {(max - (i * (max - min)) / 4).toFixed(unit === "%" ? 1 : 0)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const t = start + (i * (end - start)) / 4,
            x = 48 + (i * (width - 60)) / 4;
          return (
            <SvgText
              key={i}
              x={x}
              y={height - 7}
              textAnchor={i === 4 ? "end" : "middle"}
              fill={C.muted}
              fontSize={9}
            >
              {mode === "signal"
                ? `${((t - end) / 1000).toFixed(0)}s`
                : new Date(t).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </SvgText>
          );
        })}
        <Path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      {!visible.length && (
        <View
          style={{
            position: "absolute",
            top: height / 2 - 20,
            left: 48,
            right: 0,
            alignItems: "center",
          }}
        >
          <Txt style={{ color: C.muted, fontSize: 12 }}>Waiting for signal</Txt>
        </View>
      )}
    </View>
  );
}

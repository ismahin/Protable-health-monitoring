import React, {
  useCallback,
  useEffect,
  useState,
  type ComponentProps,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, fonts } from "../theme";
import { useMonitor } from "../monitor";
export type IconName = ComponentProps<typeof Ionicons>["name"];
export const Icon = ({
  name,
  size = 20,
  color = C.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) => <Ionicons name={name} size={size} color={color} />;
export function Txt({
  children,
  style,
  ...props
}: ComponentProps<typeof Text>) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: fonts.regular, color: C.ink, fontSize: 16 }, style]}
    >
      {children}
    </Text>
  );
}
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, style]}
    >
      {children}
    </View>
  );
}
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduce(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}
export function Motion({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}) {
  const [value] = useState(() => new Animated.Value(0));
  const reduce = useReducedMotion();
  useFocusEffect(
    useCallback(() => {
      value.setValue(reduce ? 1 : 0);
      const animation = Animated.timing(value, {
        toValue: 1,
        duration: reduce ? 0 : 360,
        delay: reduce ? 0 : delay,
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [value, reduce, delay]),
  );
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
export function LiveDot({ live }: { live: boolean }) {
  const [opacity] = useState(() => new Animated.Value(1));
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!live || reduce) {
      opacity.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [live, reduce, opacity]);
  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: live ? C.green : C.amber,
        opacity,
      }}
    />
  );
}
export function Badge({
  text,
  tone = "green",
}: {
  text: string;
  tone?: "green" | "amber" | "gray";
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: 8,
        paddingHorizontal: 9,
        paddingVertical: 6,
        backgroundColor:
          tone === "green" ? C.mint : tone === "amber" ? C.amberBg : "#1C2A37",
      }}
    >
      <Txt
        style={{
          fontSize: 12,
          fontFamily: fonts.bold,
          letterSpacing: 0.4,
          color:
            tone === "green" ? C.green : tone === "amber" ? C.amber : C.muted,
        }}
      >
        {text}
      </Txt>
    </View>
  );
}
export function Button({
  label,
  onPress,
  icon,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduce = useReducedMotion();
  const press = (toValue: number) => {
    if (!reduce)
      Animated.spring(scale, {
        toValue,
        useNativeDriver: true,
        speed: 30,
        bounciness: 3,
      }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 13,
          borderRadius: 13,
          backgroundColor: secondary ? "#172735" : C.green,
          borderWidth: 1,
          borderColor: secondary ? C.line : C.green,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        })}
      >
        {icon && (
          <Icon name={icon} size={16} color={secondary ? C.ink : C.bg} />
        )}
        <Txt
          style={{
            fontFamily: fonts.bold,
            fontSize: 12,
            color: secondary ? C.ink : C.bg,
          }}
        >
          {label}
        </Txt>
      </Pressable>
    </Animated.View>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.card,
          borderRadius: 22,
          padding: 20,
          borderWidth: 1,
          borderColor: C.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function CardHeading({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <Row
      style={{
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
      }}
    >
      <View style={{ flex: 1 }}>
        <Txt style={{ fontFamily: fonts.bold, fontSize: 16 }}>{title}</Txt>
        {subtitle && (
          <Txt style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>
            {subtitle}
          </Txt>
        )}
      </View>
      {right}
    </Row>
  );
}
export function Page({
  title,
  subtitle,
  children,
  action,
  showStatus = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  showStatus?: boolean;
}) {
  const m = useMonitor();
  const wide = useWindowDimensions().width > 900;
  const [showError, setShowError] = useState(false);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: wide ? 32 : 20,
          paddingBottom: 32,
          gap: 20,
          maxWidth: 1380,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <Row style={{ justifyContent: "space-between", marginBottom: 7 }}>
          <Row>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                backgroundColor: C.mint,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="pulse" size={21} color={C.green} />
            </View>
            <Txt
              style={{
                fontFamily: fonts.extra,
                fontSize: 21,
                letterSpacing: 1,
              }}
            >
              PHMS
            </Txt>
          </Row>
          <Row>
            {showStatus && (
              <Row
                style={{
                  backgroundColor: "#14232E",
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 20,
                  gap: 7,
                }}
              >
                <LiveDot live={m.fresh} />
                <Txt
                  style={{
                    fontSize: 12,
                    color: m.fresh ? C.green : C.amber,
                    fontFamily: fonts.bold,
                  }}
                >
                  {m.fresh ? "Live" : "Offline"}
                </Txt>
              </Row>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open developer profile"
              onPress={() => router.navigate("/developer")}
            >
              <Image
                source={require("../../assets/profile.jpg")}
                accessibilityLabel="Easeen Patwary"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: C.line,
                }}
              />
            </Pressable>
          </Row>
        </Row>
        <Row
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 190 }}>
            <Txt
              accessibilityRole="header"
              style={{
                fontFamily: fonts.extra,
                fontSize:
                  title === "PORTABLE HEALTH MONITORING SYSTEM"
                    ? wide
                      ? 27
                      : 22
                    : wide
                      ? 29
                      : 26,
                letterSpacing: -0.7,
                lineHeight: wide ? 35 : 29,
              }}
            >
              {title}
            </Txt>
            {subtitle && (
              <Txt style={{ color: C.muted, fontSize: 12, marginTop: 7 }}>
                {subtitle}
              </Txt>
            )}
          </View>
          {action}
        </Row>
        {showStatus && !m.fresh && m.latest ? (
          <Row
            style={{
              backgroundColor: C.amberBg,
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Icon name="time-outline" size={16} color={C.amber} />
            <Txt style={{ fontSize: 12, color: C.amber, flex: 1 }}>
              Last update{" "}
              {new Date(m.latest.measuredAtEpochMs).toLocaleString()}
            </Txt>
          </Row>
        ) : null}
        {showStatus && m.error ? (
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Connection details"
              onPress={() => setShowError((v) => !v)}
            >
              <Row>
                <Icon name="cloud-offline-outline" size={16} color={C.amber} />
                <Txt style={{ fontSize: 12, color: C.amber, flex: 1 }}>
                  Connection unavailable
                </Txt>
                <Icon
                  name={showError ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={C.amber}
                />
              </Row>
            </Pressable>
            {showError && (
              <View style={{ paddingTop: 12, gap: 12 }}>
                <Txt style={{ fontSize: 12, color: C.muted, lineHeight: 18 }}>
                  {m.error}
                </Txt>
                <Button secondary label="Retry" onPress={m.refresh} />
              </View>
            )}
          </View>
        ) : null}
        <Motion>
          <View style={{ gap: 20 }}>{children}</View>
        </Motion>
      </ScrollView>
    </SafeAreaView>
  );
}
export function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Row
      style={{
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: C.line,
      }}
    >
      <Txt style={{ fontSize: 12, color: C.muted, flex: 1 }}>{label}</Txt>
      <Txt
        selectable
        style={{
          fontSize: 12,
          fontFamily: fonts.medium,
          textAlign: "right",
          flex: 1,
        }}
      >
        {value ?? "—"}
      </Txt>
    </Row>
  );
}
export function ChipGroup<T extends string | number>({
  values,
  value,
  onChange,
}: {
  values: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <Row style={{ gap: 6, flexWrap: "wrap" }}>
      {values.map((item) => (
        <Pressable
          key={String(item.value)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === item.value }}
          onPress={() => onChange(item.value)}
          style={({ pressed }) => ({
            paddingHorizontal: 13,
            paddingVertical: 9,
            borderRadius: 11,
            backgroundColor: value === item.value ? C.mint : "#172735",
            borderWidth: 1,
            borderColor: value === item.value ? "#2F6C5C" : C.line,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Txt
            style={{
              fontSize: 12,
              fontFamily: fonts.bold,
              color: value === item.value ? C.green : C.muted,
            }}
          >
            {item.label}
          </Txt>
        </Pressable>
      ))}
    </Row>
  );
}
export function Disclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        onPress={() => setOpen(!open)}
        style={{ paddingVertical: 9 }}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Txt
            style={{ fontFamily: fonts.medium, fontSize: 12, color: C.muted }}
          >
            {title}
          </Txt>
          <Icon
            name={open ? "chevron-up" : "chevron-down"}
            color={C.muted}
            size={15}
          />
        </Row>
      </Pressable>
      {open && <View style={{ paddingTop: 14, gap: 14 }}>{children}</View>}
    </View>
  );
}

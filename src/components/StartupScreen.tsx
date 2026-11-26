import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { C, fonts } from "../theme";

/** Decorative branding only; starts independently of internet or sensor readings. */
export default function StartupScreen({
  onComplete,
  onVisible,
}: {
  onComplete: () => void;
  onVisible?: () => void;
}) {
  const [entrance] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(0));
  const [exit] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        animation = Animated.sequence([
          Animated.timing(entrance, {
            toValue: 1,
            duration: reduceMotion ? 0 : 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 1,
            duration: reduceMotion ? 250 : 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(exit, {
            toValue: 0,
            duration: reduceMotion ? 0 : 260,
            useNativeDriver: true,
          }),
        ]);
        animation.start(({ finished }) => {
          if (finished && !cancelled) onComplete();
        });
      });
    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [entrance, progress, exit, onComplete]);
  return (
    <Animated.View
      onLayout={onVisible}
      style={[StyleSheet.absoluteFill, styles.screen, { opacity: exit }]}
      accessibilityLabel="PHMS is starting"
      accessibilityViewIsModal
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 390 844"
          preserveAspectRatio="xMidYMid slice"
        >
          <Circle cx="345" cy="90" r="220" fill="#20483F" />
          <Circle
            cx="345"
            cy="90"
            r="162"
            fill="none"
            stroke="#31584C"
            strokeWidth="1"
          />
          <Circle
            cx="345"
            cy="90"
            r="108"
            fill="none"
            stroke="#31584C"
            strokeWidth="1"
          />
          <Circle cx="-60" cy="780" r="245" fill="#1B4339" />
          <Path
            d="M-20 620H80L102 597L121 657L145 563L171 679L193 614L211 620H410"
            fill="none"
            stroke="#D9F18D"
            strokeOpacity="0.1"
            strokeWidth="2"
          />
        </Svg>
      </View>
      <Animated.View
        style={{
          alignItems: "center",
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        }}
      >
        <View style={styles.logo}>
          <Svg width={104} height={104} viewBox="0 0 104 104">
            <Path
              d="M14 53H31L38 39L48 72L59 27L69 60L76 53H90"
              fill="none"
              stroke={C.lime}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={styles.title}>PHMS</Text>
        <Text style={styles.eyebrow}>HEALTH MONITOR</Text>
        <Text style={styles.tagline}>Portable Health Monitoring System</Text>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.progress,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 136],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.loading}>Connecting your signals</Text>
      </Animated.View>
      <View style={styles.footer}>
        <View style={styles.dot} />
        <Text style={styles.footerText}>PORTABLE · CONNECTED · SIMPLE</Text>
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  screen: {
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  logo: {
    width: 124,
    height: 124,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: "#204C40",
    borderWidth: 1,
    borderColor: "#3D6553",
    marginBottom: 25,
  },
  title: {
    fontFamily: fonts.extra,
    fontSize: 42,
    letterSpacing: -1.8,
    color: "#FFFFFF",
  },
  eyebrow: {
    fontFamily: fonts.bold,
    color: "#C1D6C7",
    fontSize: 12,
    letterSpacing: 3.8,
    marginTop: 8,
  },
  tagline: {
    fontFamily: fonts.regular,
    color: "#C1D6C7",
    fontSize: 13,
    marginTop: 28,
  },
  track: {
    width: 136,
    height: 3,
    borderRadius: 4,
    backgroundColor: "#31594A",
    marginTop: 44,
    overflow: "hidden",
  },
  progress: { height: 3, borderRadius: 4, backgroundColor: C.lime },
  loading: {
    fontFamily: fonts.regular,
    color: "#8BAE9B",
    fontSize: 12,
    marginTop: 15,
  },
  footer: {
    position: "absolute",
    bottom: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.lime },
  footerText: {
    fontFamily: fonts.medium,
    color: "#9ABBAB",
    fontSize: 12,
    letterSpacing: 2.2,
  },
});

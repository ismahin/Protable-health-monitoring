import React, { useCallback, useState } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { Tabs, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { MonitorProvider } from "../monitor";
import { C, fonts } from "../theme";
import { Icon, Txt, Row, type IconName } from "../components/ui";
import StartupScreen from "../components/StartupScreen";
const routes = [
  { name: "index", label: "Home", icon: "grid-outline" },
  { name: "signals", label: "Signals", icon: "pulse-outline" },
  { name: "location", label: "Location", icon: "map-outline" },
  { name: "insights", label: "Insights", icon: "sparkles-outline" },
  { name: "developer", label: "Developer", icon: "code-slash-outline" },
] as const;
function Navigation({ wide = false }: { wide?: boolean }) {
  const path = usePathname(),
    insets = useSafeAreaInsets();
  return (
    <View
      style={
        wide
          ? {
              width: 204,
              padding: 20,
              paddingTop: 42,
              backgroundColor: C.card,
              borderRightWidth: 1,
              borderColor: C.line,
            }
          : {
              flexDirection: "row",
              backgroundColor: "#101D28",
              borderTopWidth: 1,
              borderColor: C.line,
              paddingHorizontal: 8,
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 12),
            }
      }
    >
      {wide && (
        <Row style={{ marginBottom: 43, gap: 11 }}>
          <View
            style={{
              backgroundColor: C.mint,
              width: 40,
              height: 40,
              borderRadius: 13,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="pulse" color={C.green} size={25} />
          </View>
          <View>
            <Txt
              style={{
                fontFamily: fonts.extra,
                fontSize: 23,
                letterSpacing: 1,
              }}
            >
              PHMS
            </Txt>
            <Txt style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
              HEALTH MONITOR
            </Txt>
          </View>
        </Row>
      )}
      {routes.map((r) => {
        const href = r.name === "index" ? "/" : "/" + r.name,
          selected = path === href;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={r.label}
            key={r.name}
            onPress={() => router.navigate(href as "/")}
            style={({ pressed }) =>
              wide
                ? {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 13,
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: selected
                      ? C.mint
                      : pressed
                        ? C.bg
                        : "transparent",
                    marginBottom: 9,
                  }
                : {
                    flex: 1,
                    alignItems: "center",
                    gap: 5,
                    opacity: pressed ? 0.6 : 1,
                  }
            }
          >
            <View
              style={
                wide
                  ? {}
                  : {
                      paddingHorizontal: 16,
                      paddingVertical: 7,
                      borderRadius: 13,
                      backgroundColor: selected ? C.mint : "transparent",
                    }
              }
            >
              <Icon
                name={r.icon as IconName}
                color={selected ? C.green : C.muted}
                size={20}
              />
            </View>
            <Txt
              style={{
                fontSize: wide ? 14 : 12,
                fontFamily: selected ? fonts.bold : fonts.medium,
                color: selected ? C.green : C.muted,
              }}
            >
              {r.label}
            </Txt>
          </Pressable>
        );
      })}
      {wide && (
        <View style={{ marginTop: "auto", padding: 13 }}>
          <Txt style={{ fontSize: 12, color: C.muted }}>PHMS / 1.1.0</Txt>
        </View>
      )}
    </View>
  );
}
function Shell() {
  const wide = useWindowDimensions().width > 1050;
  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: C.bg }}>
      {wide && <Navigation wide />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: C.bg },
            animation: "none",
          }}
          tabBar={() => (wide ? null : <Navigation />)}
        >
          {routes.map((r) => (
            <Tabs.Screen
              key={r.name}
              name={r.name}
              options={{ title: r.label + " | PHMS" }}
            />
          ))}
        </Tabs>
      </View>
    </View>
  );
}
export default function Layout() {
  const [bootDone, setBootDone] = useState(false);
  const finishBoot = useCallback(() => setBootDone(true), []);
  const [loaded, error] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.navy,
          alignItems: "center",
          justifyContent: "center",
        }}
      ></View>
    );
  return (
    <SafeAreaProvider>
      <MonitorProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1 }}>
          <Shell />
          {!bootDone && <StartupScreen onComplete={finishBoot} />}
        </View>
      </MonitorProvider>
    </SafeAreaProvider>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { View, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { mapHtml } from "../map/html";
import { Txt } from "./ui";
import { C } from "../theme";
export type MapProps = { lat: number; lon: number; tileUrl: string };
export default function DeviceMap({ lat, lon, tileUrl }: MapProps) {
  const ref = useRef<WebView<unknown>>(null);
  const [html] = useState(() => mapHtml(lat, lon, tileUrl));
  const [error, setError] = useState(false);
  useEffect(() => {
    ref.current?.injectJavaScript(
      `window.updatePosition&&window.updatePosition(${JSON.stringify({ lat, lon })});true;`,
    );
  }, [lat, lon]);
  return (
    <View
      style={{
        height: 380,
        borderRadius: 17,
        overflow: "hidden",
        backgroundColor: C.bg,
      }}
    >
      <WebView<unknown>
        ref={ref}
        originWhitelist={["https://*", "about:blank"]}
        source={{ html, baseUrl: "https://healthmonitor.local/" }}
        userAgent="PHMS/1.1 (Expo; personal GPS monitor)"
        javaScriptEnabled
        domStorageEnabled
        onError={() => setError(true)}
        onLoadEnd={() =>
          ref.current?.injectJavaScript(
            `window.updatePosition&&window.updatePosition(${JSON.stringify({ lat, lon })});true;`,
          )
        }
        onShouldStartLoadWithRequest={(r) => {
          if (r.url.startsWith("https://www.openstreetmap.org/")) {
            void Linking.openURL(r.url).catch(() => setError(true));
            return false;
          }
          return (
            r.url === "about:blank" ||
            r.url.startsWith("https://healthmonitor.local/")
          );
        }}
        style={{ backgroundColor: C.bg }}
      />
      {error && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            justifyContent: "center",
            padding: 25,
            backgroundColor: C.bg,
          }}
        >
          <Txt>Map could not load. Your GPS coordinates are shown below.</Txt>
        </View>
      )}
    </View>
  );
}

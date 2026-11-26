import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { useMonitor } from "../monitor";
import { Button, DataRow, Disclosure, Txt } from "./ui";
import { C, fonts } from "../theme";
export default function ConnectionPanel() {
  const m = useMonitor();
  const [url, setUrl] = useState<string | null>(null),
    [device, setDevice] = useState<string | null>(null),
    [notice, setNotice] = useState("");
  const save = async () => {
    try {
      await m.saveConfig({
        ...m.config,
        databaseUrl: (url ?? m.config.databaseUrl).trim().replace(/\/$/, ""),
        deviceId: (device ?? m.config.deviceId).trim(),
      });
      setNotice("Saved");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to save");
    }
  };
  return (
    <Disclosure title="Connection settings">
      <View style={{ gap: 12 }}>
        {[
          {
            label: "Database URL",
            value: url ?? m.config.databaseUrl,
            set: setUrl,
          },
          {
            label: "Device ID",
            value: device ?? m.config.deviceId,
            set: setDevice,
          },
        ].map((f) => (
          <View key={f.label}>
            <Txt style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
              {f.label}
            </Txt>
            <TextInput
              accessibilityLabel={f.label}
              value={f.value}
              onChangeText={f.set}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.line,
                borderRadius: 12,
                padding: 13,
                color: C.ink,
                fontFamily: fonts.regular,
                fontSize: 12,
              }}
            />
          </View>
        ))}
        <Button label="Save connection" onPress={() => void save()} />
        {notice ? (
          <Txt style={{ fontSize: 12, color: C.amber }}>{notice}</Txt>
        ) : null}
        <Txt style={{ fontSize: 12, lineHeight: 17, color: C.muted }}>
          Current database is public. Secure its rules before sharing.
        </Txt>
        <DataRow label="Firmware" value={m.latest?.device.firmware ?? "—"} />
        <DataRow
          label="Wi-Fi"
          value={
            m.latest?.wifi.connected
              ? m.latest.wifi.rssiDbm + " dBm"
              : "Offline"
          }
        />
      </View>
    </Disclosure>
  );
}

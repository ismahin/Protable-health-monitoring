import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
export async function exportJson(payload: unknown) {
  const body = JSON.stringify(payload, null, 2),
    name = `phms-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(
      new Blob([body], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable on this device.");
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(body);
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Export loaded monitor data",
    UTI: "public.json",
  });
}

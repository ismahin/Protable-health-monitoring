import React, { useEffect, useRef, useState } from "react";
import { mapHtml } from "../map/html";
import type { MapProps } from "./DeviceMap";
export default function DeviceMap({ lat, lon, tileUrl }: MapProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [html] = useState(() => mapHtml(lat, lon, tileUrl));
  const update = () =>
    ref.current?.contentWindow?.postMessage(
      { type: "position", lat, lon },
      "*",
    );
  useEffect(update, [lat, lon]);
  return (
    <iframe
      ref={ref}
      title="Monitor GPS location on OpenStreetMap"
      srcDoc={html}
      onLoad={update}
      sandbox="allow-scripts allow-popups"
      referrerPolicy="strict-origin-when-cross-origin"
      style={{
        width: "100%",
        height: 380,
        border: 0,
        borderRadius: 17,
        display: "block",
      }}
    />
  );
}

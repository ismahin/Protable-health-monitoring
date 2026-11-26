import fs from "node:fs";
// Bundle Leaflet locally: no CDN script, API key, or external JS service at runtime.
const js = fs.readFileSync("node_modules/leaflet/dist/leaflet.js", "utf8");
const css = fs.readFileSync("node_modules/leaflet/dist/leaflet.css", "utf8");
fs.mkdirSync("src/map", { recursive: true });
fs.writeFileSync(
  "src/map/leafletBundle.ts",
  `// Generated from Leaflet 1.9.4 (BSD-2-Clause); run npm run bundle:map.\nexport const leafletJs=${JSON.stringify(js)};\nexport const leafletCss=${JSON.stringify(css)};\n`,
);
fs.mkdirSync("licenses", { recursive: true });
fs.copyFileSync("node_modules/leaflet/LICENSE", "licenses/Leaflet-LICENSE.txt");

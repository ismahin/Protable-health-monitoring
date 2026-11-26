# PHMS - Portable Health Monitoring System

The browser companion to the PHMS mobile app. Built with Expo SDK 58, React and React Native Web, with a dark responsive dashboard and reduced-motion-aware animations.

- **Home:** heart rate in bpm, oxygen saturation in %, ECG rate and satellite status.
- **Signals:** real ECG and PPG traces, time windows, pause/resume, quality filtering, trends, sessions and JSON export.
- **Location:** receiver coordinates on OpenStreetMap with altitude, speed and GPS diagnostics.
- **Insights:** on-device quality checks and direct Groq question answering. Each question is independent; closing chat clears it.
- **Developer:** Easeen Patwary's profile, photo and advanced Firebase connection settings.

The site reads the existing ESP32 Firebase uploads. Missing and invalid readings stay missing; stale readings are labeled, and waveform gaps are preserved. There is no demo-data fallback and no automatic phone/browser location access.

## Local development

Requires Node 24 and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
# Set EXPO_PUBLIC_GROQ_API_KEY in .env.local if you want AI chat.
npm run dev
```

Open the web address printed by Expo. On this workspace the local environment is already configured, so do not overwrite `.env.local`.

Production preview:

```powershell
npm run build
npm run preview
```

Open `http://localhost:8083`. `dist/` is the static deployment output.

## Vercel hosting

1. Import `ismahin/Protable-health-monitoring` at [Vercel New Project](https://vercel.com/new).
2. Leave **Root Directory** at the repository root. Use framework **Other**.
3. Build command is **npm run build**, output directory **dist**, install command **npm ci**. These are supplied in `vercel.json`.
4. Add **EXPO_PUBLIC_GROQ_API_KEY** with your Groq key to the Production and Preview environments if AI chat is needed.
5. Deploy. Vercel will rebuild future pushes to `main`. After changing the key, redeploy for it to enter the browser bundle.

The repository contains no provider key or local environment file. Firebase dashboards, graphs and maps work without a Groq key; only AI chat needs that variable. `vercel.json` includes the SPA fallback so refreshing `/signals`, `/location`, `/insights` or `/developer` works.

## Data and privacy

Defaults are in `src/types.ts` and can be changed under Developer > Connection settings. They point to the existing health-monitor Firebase database and device. The browser only reads Firebase and never changes its rules.

The current database is public. Anyone able to load it may access its health and GPS data. This dashboard does not add authentication. Secure both the device uploads and database reads before using private records.

AI is the requested direct-key prototype: the browser calls Groq without a custom server, login or pairing code. An `EXPO_PUBLIC_` key is visible in the deployed browser bundle, even when configured as a Vercel environment variable. Use a revocable, limited key and keep it out of Git. Groq account quotas and billing settings still apply; no paid fallback or plan change is configured.

Chat sends only the current question, not previous answers, sensor records, coordinates or waveform samples. Groq processes text that you send. Local insights are rules/statistics, and neither local nor AI suggestions are validated medical diagnoses. ECG values are engineering ADC counts, not calibrated mV.

Only connection settings and one latest-reading snapshot are cached in browser storage; the latter can include GPS coordinates. Clear site data to remove them. Map tile providers receive requests for the viewed area; OpenStreetMap attribution is retained. Leaflet JS/CSS and Manrope fonts are bundled locally.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
# Start npm run preview in another terminal first:
npm run test:ui
npm run test:chat-ui
```

The chat browser check makes one small real Groq request, then mocks errors to verify retry/cancel behavior. Browser screenshots can contain live GPS readings and stay in ignored `artifacts/`. Data fixtures are used only in tests.

See [Expo web deployment](https://docs.expo.dev/guides/publishing-websites/) for the static export configuration. Leaflet's license is in `licenses/`.

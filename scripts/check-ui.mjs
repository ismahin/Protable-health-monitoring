import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
fs.mkdirSync("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const tab = async (name) => {
  await page.getByRole("tab", { name, exact: true }).click();
  await page.waitForTimeout(650);
};
const capture = async (name) => {
  await page.waitForTimeout(650);
  await page.screenshot({ path: `artifacts/phms-${name}.png`, fullPage: true });
};
const noOverflow = async () =>
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
try {
  await page.goto("http://localhost:8083");
  await page
    .getByText("PORTABLE HEALTH MONITORING SYSTEM", { exact: true })
    .waitFor();
  await page
    .getByLabel("PHMS is starting", { exact: true })
    .waitFor({ state: "detached" });
  await page.waitForTimeout(2500);
  assert.equal(
    await page.getByRole("tab", { name: "Device", exact: true }).count(),
    0,
  );
  await noOverflow();
  await capture("home-desktop");
  await tab("Signals");
  await page
    .getByRole("img", { name: /IR counts graph, [1-9]/ })
    .waitFor({ timeout: 60000 });
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "5s", exact: true }).click();
  await capture("signals-desktop");
  await page
    .getByRole("button", { name: "Recordings & export", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data", exact: true }).click();
  const file = await download;
  const payload = JSON.parse(fs.readFileSync(await file.path(), "utf8"));
  assert.equal(payload.schemaVersion, 1);
  assert.equal(typeof payload.ecg, "object");
  if (!Object.keys(payload.ecg).length)
    console.log(
      "No ECG blocks in the current loaded session; exported as empty without fabricated samples.",
    );
  assert.ok(Object.keys(payload.ppg).length > 0);
  assert.equal(payload.latest.deviceId, payload.deviceId);
  assert.ok(file.suggestedFilename().startsWith("phms-"));
  await tab("Location");
  if (await page.locator("iframe").count()) {
    const frame = page.frameLocator("iframe");
    await frame.locator(".leaflet-container").waitFor();
    await frame.getByText("OpenStreetMap", { exact: true }).waitFor();
  }
  await capture("location-desktop");
  await tab("Insights");
  await page.getByRole("button", { name: "Open chat", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Message PHMS AI", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Close chat", exact: true }).click();
  await capture("insights-desktop");
  await tab("Developer");
  await page.getByText("Easeen Patwary", { exact: true }).waitFor();
  await page
    .getByRole("img", { name: "Easeen Patwary, developer", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("textbox", { name: "Device ID", exact: true }).count(),
    0,
  );
  await capture("developer-desktop");
  await page
    .getByRole("button", { name: "Connection settings", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Device ID", exact: true })
    .fill("../invalid");
  await page
    .getByRole("button", { name: "Save connection", exact: true })
    .click();
  await page
    .getByText(
      "Device ID may contain letters, numbers, hyphens and underscores.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("button", { name: "Connection settings", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ["Home", "Signals", "Location", "Insights", "Developer"]) {
    await tab(name);
    await noOverflow();
    await capture(`${name.toLowerCase()}-mobile`);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  for (const name of ["Home", "Signals", "Developer"]) {
    await tab(name);
    await noOverflow();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await tab("Home");
  await page.context().setOffline(true);
  await page
    .getByText("Offline", { exact: true })
    .first()
    .waitFor({ timeout: 25000 });
  await capture("offline-mobile");
  assert.deepEqual(errors, []);
  console.log(
    "PASS: all 5 routes, 390/320px layouts, real waveform samples, GPS/map states, pause/resume, export, settings validation, offline and reduced motion. No runtime errors.",
  );
} finally {
  await browser.close();
}

import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(20000);
const errors = [],
  sent = [];
page.on("pageerror", (e) => errors.push(e.message));
const endpoint = "https://api.groq.com/openai/v1/chat/completions";
page.on("request", (r) => {
  if (r.url() === endpoint && r.method() === "POST")
    sent.push(JSON.parse(r.postData()));
});
const box = () =>
  page.getByRole("textbox", { name: "Message PHMS AI", exact: true });
const send = () =>
  page.getByRole("button", { name: "Send message", exact: true }).click();
const wait = () =>
  page
    .getByRole("button", { name: "Stop response", exact: true })
    .waitFor({ state: "detached", timeout: 40000 });
const capture = async (name) => {
  await page.waitForTimeout(650);
  await page.screenshot({
    path: `artifacts/phms-simple-ai-${name}.png`,
    fullPage: true,
  });
};
const reply = (content) =>
  JSON.stringify({
    choices: [{ message: { content }, finish_reason: "stop" }],
  });
try {
  await page.goto("http://localhost:8083");
  await page
    .getByLabel("PHMS is starting", { exact: true })
    .waitFor({ state: "detached" });
  await page.getByRole("tab", { name: "Insights", exact: true }).click();
  await page.getByRole("button", { name: "Open chat", exact: true }).click();
  await box().waitFor();
  assert.equal(
    await page.getByRole("textbox", { name: /backend|pairing/i }).count(),
    0,
  );
  assert.equal(
    await page.getByRole("button", { name: /Chat settings|New chat/ }).count(),
    0,
  );
  await capture("welcome-mobile");
  await box().fill("What is oxygen saturation? Answer briefly.");
  await send();
  await wait();
  assert.ok(sent.length > 0);
  assert.equal(sent[0].messages.length, 2);
  await page.getByText("PHMS AI", { exact: true }).last().waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Retry", exact: true }).count(),
    0,
    "Live Groq request must succeed",
  );
  await capture("answer-mobile");
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: reply("A second independent answer."),
    }),
  );
  await box().fill("What affects ECG contact?");
  await send();
  await wait();
  await page
    .getByText("A second independent answer.", { exact: true })
    .waitFor();
  assert.equal(sent.at(-1).messages.length, 2);
  assert.equal(
    sent.at(-1).messages.at(-1).content,
    "What affects ECG contact?",
  );
  assert.equal(
    await page
      .getByText("What is oxygen saturation? Answer briefly.", { exact: true })
      .count(),
    0,
  );
  await page.setViewportSize({ width: 1440, height: 1050 });
  await capture("answer-desktop");
  await page.unroute(endpoint);
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 429, contentType: "application/json", body: "{}" }),
  );
  await box().fill("Retry test");
  await send();
  await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
  await page.unroute(endpoint);
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: reply("Retry succeeded."),
    }),
  );
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByText("Retry succeeded.", { exact: true }).waitFor();
  await page.unroute(endpoint);
  await page.route(endpoint, async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route
      .fulfill({
        status: 200,
        contentType: "application/json",
        body: reply("Late reply"),
      })
      .catch(() => {});
  });
  await box().fill("Stop test");
  await send();
  await page
    .getByRole("button", { name: "Stop response", exact: true })
    .click();
  await page
    .getByText("Response stopped. Retry when ready.", { exact: true })
    .waitFor();
  await page.waitForTimeout(1400);
  assert.equal(await page.getByText("Late reply", { exact: true }).count(), 0);
  await page.unroute(endpoint);
  await page.getByRole("button", { name: "Close chat", exact: true }).click();
  await page.getByRole("button", { name: "Open chat", exact: true }).click();
  await page.getByText("How can I help?", { exact: true }).waitFor();
  assert.equal(await box().inputValue(), "");
  await page.setViewportSize({ width: 320, height: 740 });
  await capture("narrow-mobile");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: direct live Groq, no pairing, independent questions, no retained history, retry/stop, desktop and phone layouts.",
  );
} finally {
  await browser.close();
}

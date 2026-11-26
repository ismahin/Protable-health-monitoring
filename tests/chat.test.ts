import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { requestChat } from "../src/chat";
const response = (content = "A clear answer.") =>
  Response.json({ choices: [{ message: { content }, finish_reason: "stop" }] });
beforeEach(() => vi.stubEnv("EXPO_PUBLIC_GROQ_API_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("direct, independent Groq questions", () => {
  it("calls Groq directly with the configured key", async () => {
    const mock = vi.fn<
      (_input: unknown, _init?: RequestInit) => Promise<Response>
    >(async () => response());
    vi.stubGlobal("fetch", mock);
    expect(
      (await requestChat("What is SpO2?", new AbortController().signal)).reply,
    ).toBe("A clear answer.");
    expect(mock.mock.calls[0][0]).toBe(
      "https://api.groq.com/openai/v1/chat/completions",
    );
    expect(
      new Headers(mock.mock.calls[0][1]?.headers).get("Authorization"),
    ).toBe("Bearer test-key");
  });
  it("never sends previous questions, answers or sensor data", async () => {
    const mock = vi.fn<
      (_input: unknown, _init?: RequestInit) => Promise<Response>
    >(async () => response());
    vi.stubGlobal("fetch", mock);
    await requestChat("Remember Cedar", new AbortController().signal);
    await requestChat("Explain pulse", new AbortController().signal);
    const body = JSON.parse(String(mock.mock.calls[1][1]?.body));
    expect(body.messages).toHaveLength(2);
    expect(body.messages[1]).toEqual({
      role: "user",
      content: "Explain pulse",
    });
    expect(JSON.stringify(body)).not.toContain("Cedar");
    expect(body).not.toHaveProperty("monitor");
    expect(body).not.toHaveProperty("history");
  });
  it("fails for a missing key before a network request", async () => {
    vi.stubEnv("EXPO_PUBLIC_GROQ_API_KEY", "");
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    await expect(
      requestChat("Hello", new AbortController().signal),
    ).rejects.toThrow("not configured");
    expect(mock).not.toHaveBeenCalled();
  });
  it("bounds user input before contacting the provider", async () => {
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    await expect(
      requestChat("  ", new AbortController().signal),
    ).rejects.toThrow("Type a question");
    await expect(
      requestChat("a".repeat(2001), new AbortController().signal),
    ).rejects.toThrow("2,000");
    expect(mock).not.toHaveBeenCalled();
  });
  it("reports usage limits without exposing upstream errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("test-key", { status: 429 })),
    );
    await expect(
      requestChat("Hello", new AbortController().signal),
    ).rejects.toThrow("usage limit");
  });
  it("reports rejected credentials without returning the key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("test-key", { status: 401 })),
    );
    await expect(
      requestChat("Hello", new AbortController().signal),
    ).rejects.toThrow("Groq rejected the API key");
  });
  it("rejects empty answers and marks truncated answers", async () => {
    const mock = vi.fn(async () => response(""));
    vi.stubGlobal("fetch", mock);
    await expect(
      requestChat("Hello", new AbortController().signal),
    ).rejects.toThrow("No answer");
    mock.mockResolvedValueOnce(
      Response.json({
        choices: [
          { message: { content: "Partial answer." }, finish_reason: "length" },
        ],
      }),
    );
    expect(
      (await requestChat("Hello", new AbortController().signal)).truncated,
    ).toBe(true);
  });
  it("cancels the provider request when the user stops", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: unknown, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            const fail = () =>
              reject(new DOMException("Aborted", "AbortError"));
            if (init?.signal?.aborted) fail();
            else init?.signal?.addEventListener("abort", fail);
          }),
      ),
    );
    const controller = new AbortController();
    const assertion = expect(
      requestChat("Hello", controller.signal),
    ).rejects.toThrow("Request cancelled");
    controller.abort();
    await assertion;
  });
  it("times out an unresponsive connection", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: unknown, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) =>
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            ),
          ),
      ),
    );
    const assertion = expect(
      requestChat("Hello", new AbortController().signal),
    ).rejects.toThrow("too long");
    await vi.advanceTimersByTimeAsync(30000);
    await assertion;
  });
});

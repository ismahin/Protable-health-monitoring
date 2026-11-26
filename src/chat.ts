const SYSTEM = `You are PHMS AI, a helpful assistant in the Portable Health Monitoring System developed by Easeen Patwary.
Answer the current question clearly and concisely. Reply only in the language of the question; use Bangla for Bangla questions, and do not add duplicate translations unless requested. Prefer short paragraphs or a short list; no tables.
Each question is independent. You have no chat history and cannot see sensor readings, ECG graphs, GPS or medical records unless the user types information in this question. Do not invent readings or claim access to sensors.
Explain health concepts and monitor use as general education, not diagnosis. Do not prescribe medications/doses or identify arrhythmias. For potentially urgent symptoms, recommend urgent professional care rather than reassurance from this prototype. Avoid repetitive long disclaimers.`;

/** One question per request. No conversation or sensor data is sent. */
export async function requestChat(question: string, signal: AbortSignal) {
  const q = question.trim();
  if (!q) throw new Error("Type a question first.");
  if (q.length > 2000)
    throw new Error("Keep your question under 2,000 characters.");
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();
  if (!key) throw new Error("AI is not configured in this build.");
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort);
  if (signal.aborted) abort();
  const timer = setTimeout(abort, 30000);
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          temperature: 0.3,
          reasoning_effort: "low",
          include_reasoning: false,
          max_completion_tokens: 1200,
          stream: false,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: q },
          ],
        }),
      },
    );
    if (!response.ok) {
      if (response.status === 429)
        throw new Error("Groq usage limit reached. Please try again later.");
      if (response.status === 401 || response.status === 403)
        throw new Error(
          "Groq rejected the API key. Update the app configuration.",
        );
      throw new Error("AI is temporarily unavailable. Please retry.");
    }
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim())
      throw new Error("No answer was received. Please retry.");
    return {
      reply: reply.trim(),
      truncated: data.choices[0].finish_reason === "length",
    };
  } catch (e) {
    if (signal.aborted) throw new Error("Request cancelled.");
    if (controller.signal.aborted)
      throw new Error("The response took too long. Please retry.");
    if (e instanceof TypeError)
      throw new Error("Cannot reach Groq. Check your internet connection.");
    throw e;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}

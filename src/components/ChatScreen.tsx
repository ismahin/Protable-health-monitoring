import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, fonts } from "../theme";
import { requestChat } from "../chat";
import { Button, Icon, Motion, Row, Txt, useReducedMotion } from "./ui";

function RichText({ text }: { text: string }) {
  return (
    <View style={{ gap: 8 }}>
      {text
        .split("\n")
        .filter((line) => line.trim())
        .map((line, i) => {
          const heading = /^#{1,3}\s/.test(line);
          const clean = line
            .replace(/^#{1,3}\s/, "")
            .replace(/^[-*]\s/, "\u2022 ");
          return (
            <Txt
              selectable
              key={i}
              style={{
                fontSize: 14,
                lineHeight: 23,
                fontFamily: heading ? fonts.bold : fonts.regular,
              }}
            >
              {clean.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                part.startsWith("**") ? (
                  <Txt key={j} style={{ fontFamily: fonts.bold }}>
                    {part.slice(2, -2)}
                  </Txt>
                ) : (
                  part
                ),
              )}
            </Txt>
          );
        })}
    </View>
  );
}
const prompts = [
  {
    label: "ECG signal",
    question: "How can I improve the signal quality of a portable ECG monitor?",
  },
  {
    label: "Understand SpO2",
    question: "What does SpO2 mean, and what can affect its measurement?",
  },
  {
    label: "Healthy habits",
    question: "Suggest a few simple everyday habits for general wellbeing.",
  },
];
export default function ChatScreen({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [draft, setDraft] = useState(""),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [truncated, setTruncated] = useState(false);
  const controller = useRef<AbortController | null>(null),
    scroll = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );
  const close = () => {
    controller.current?.abort();
    controller.current = null;
    setDraft("");
    setQuestion("");
    setAnswer("");
    setError("");
    setBusy(false);
    setTruncated(false);
    onClose();
  };
  const send = useCallback(
    async (text = draft) => {
      const q = text.trim();
      if (!q || controller.current) return;
      const abort = new AbortController();
      controller.current = abort;
      setQuestion(q);
      setAnswer("");
      setDraft("");
      setBusy(true);
      setError("");
      setTruncated(false);
      try {
        const data = await requestChat(q, abort.signal);
        if (!abort.signal.aborted) {
          setAnswer(data.reply);
          setTruncated(data.truncated);
        }
      } catch (e) {
        if (!abort.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Unable to send. Please retry.",
          );
      } finally {
        if (controller.current === abort) {
          controller.current = null;
          setBusy(false);
        }
      }
    },
    [draft],
  );
  const stop = () => {
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setError("Response stopped. Retry when ready.");
  };
  return (
    <Modal
      visible={visible}
      animationType={reducedMotion ? "none" : "slide"}
      onRequestClose={close}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={{
              flex: 1,
              width: "100%",
              maxWidth: 820,
              alignSelf: "center",
            }}
          >
            <Row
              style={{
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
                justifyContent: "space-between",
              }}
            >
              <Row>
                <View
                  style={{
                    backgroundColor: C.mint,
                    padding: 11,
                    borderRadius: 16,
                  }}
                >
                  <Icon name="sparkles" color={C.green} />
                </View>
                <View>
                  <Txt style={{ fontFamily: fonts.extra, fontSize: 19 }}>
                    PHMS AI
                  </Txt>
                  <Txt style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                    Ask a question
                  </Txt>
                </View>
              </Row>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close chat"
                hitSlop={10}
                onPress={close}
                style={{ padding: 8 }}
              >
                <Icon name="close" />
              </Pressable>
            </Row>
            <ScrollView
              ref={scroll}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                scroll.current?.scrollToEnd({ animated: !reducedMotion })
              }
              contentContainerStyle={{ padding: 20, gap: 22, flexGrow: 1 }}
            >
              {!question ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    paddingVertical: 25,
                    gap: 18,
                  }}
                >
                  <View
                    style={{
                      alignSelf: "flex-start",
                      padding: 18,
                      borderRadius: 24,
                      backgroundColor: C.mint,
                    }}
                  >
                    <Icon
                      name="chatbubble-ellipses-outline"
                      color={C.green}
                      size={32}
                    />
                  </View>
                  <Txt
                    style={{
                      fontFamily: fonts.extra,
                      fontSize: 29,
                      lineHeight: 37,
                    }}
                  >
                    How can I help?
                  </Txt>
                  <Txt style={{ fontSize: 14, lineHeight: 23, color: C.muted }}>
                    Ask about your monitor or everyday wellbeing.
                  </Txt>
                  <View style={{ gap: 10, marginTop: 6 }}>
                    {prompts.map((p) => (
                      <Pressable
                        key={p.label}
                        accessibilityRole="button"
                        accessibilityLabel={p.label}
                        onPress={() => void send(p.question)}
                        style={({ pressed }) => ({
                          backgroundColor: C.card,
                          borderWidth: 1,
                          borderColor: C.line,
                          borderRadius: 16,
                          padding: 16,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Row style={{ justifyContent: "space-between" }}>
                          <Txt
                            style={{ fontSize: 13, fontFamily: fonts.medium }}
                          >
                            {p.label}
                          </Txt>
                          <Icon
                            name="arrow-up-outline"
                            size={16}
                            color={C.green}
                          />
                        </Row>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <>
                  <View
                    style={{
                      alignSelf: "flex-end",
                      maxWidth: "90%",
                      padding: 16,
                      borderRadius: 20,
                      borderBottomRightRadius: 5,
                      backgroundColor: C.mint,
                      borderWidth: 1,
                      borderColor: "#245E51",
                    }}
                  >
                    <Txt selectable style={{ fontSize: 14, lineHeight: 22 }}>
                      {question}
                    </Txt>
                  </View>
                  {busy && (
                    <Row
                      style={{
                        padding: 17,
                        backgroundColor: C.card,
                        borderRadius: 18,
                        alignSelf: "flex-start",
                      }}
                    >
                      <ActivityIndicator size="small" color={C.green} />
                      <Txt
                        accessibilityLiveRegion="polite"
                        style={{ fontSize: 12, color: C.muted }}
                      >
                        Thinking...
                      </Txt>
                    </Row>
                  )}
                  {!!answer && (
                    <Motion>
                      <View style={{ gap: 9 }}>
                        <Row style={{ gap: 6 }}>
                          <Icon name="sparkles" size={13} color={C.green} />
                          <Txt
                            style={{
                              fontSize: 12,
                              color: C.green,
                              fontFamily: fonts.bold,
                            }}
                          >
                            PHMS AI
                          </Txt>
                        </Row>
                        <View
                          style={{
                            padding: 18,
                            borderRadius: 20,
                            borderTopLeftRadius: 5,
                            borderWidth: 1,
                            borderColor: C.line,
                            backgroundColor: C.card,
                          }}
                        >
                          <RichText text={answer} />
                        </View>
                      </View>
                    </Motion>
                  )}
                  {!!error && (
                    <View
                      accessibilityRole="alert"
                      style={{
                        padding: 16,
                        backgroundColor: C.amberBg,
                        borderRadius: 16,
                        gap: 12,
                      }}
                    >
                      <Txt
                        style={{ color: C.amber, fontSize: 12, lineHeight: 20 }}
                      >
                        {error}
                      </Txt>
                      <Button
                        label="Retry"
                        secondary
                        onPress={() => void send(question)}
                      />
                    </View>
                  )}
                  {truncated && (
                    <Txt style={{ fontSize: 12, color: C.muted }}>
                      The answer reached its length limit. Try a more specific
                      question.
                    </Txt>
                  )}
                </>
              )}
            </ScrollView>
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 10,
                borderTopWidth: 1,
                borderTopColor: C.line,
                gap: 9,
              }}
            >
              <Row
                style={{
                  alignItems: "flex-end",
                  backgroundColor: C.card,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 23,
                  padding: 8,
                  gap: 8,
                }}
              >
                <TextInput
                  accessibilityLabel="Message PHMS AI"
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Ask PHMS AI..."
                  placeholderTextColor={C.muted}
                  multiline
                  maxLength={2000}
                  editable={!busy}
                  style={{
                    flex: 1,
                    color: C.ink,
                    fontFamily: fonts.regular,
                    fontSize: 14,
                    lineHeight: 21,
                    minHeight: 42,
                    maxHeight: 125,
                    paddingHorizontal: 9,
                    paddingVertical: 10,
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={busy ? "Stop response" : "Send message"}
                  disabled={!busy && !draft.trim()}
                  onPress={() => (busy ? stop() : void send())}
                  style={({ pressed }) => ({
                    height: 43,
                    width: 43,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: C.green,
                    opacity: !busy && !draft.trim() ? 0.35 : pressed ? 0.7 : 1,
                  })}
                >
                  <Icon
                    name={busy ? "stop" : "arrow-up"}
                    size={21}
                    color={C.bg}
                  />
                </Pressable>
              </Row>
              <Txt
                style={{
                  fontSize: 12,
                  lineHeight: 15,
                  color: C.muted,
                  textAlign: "center",
                }}
              >
                Powered by Groq. Each question is independent. AI can make
                mistakes.
              </Txt>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

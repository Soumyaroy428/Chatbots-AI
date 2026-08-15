import { getToken } from "./api";

export type StreamHandlers = {
  onMeta?: (data: { conversationId: string; title: string }) => void;
  onDelta?: (content: string) => void;
  onDone?: (data: { messageId: string; conversationId: string }) => void;
  onError?: (content: string) => void;
};

export async function streamChat(
  payload: { message: string; conversationId?: string },
  handlers: StreamHandlers,
  signal?: AbortSignal
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Chat request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const line = part
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"));
      if (!line) continue;
      const json = JSON.parse(line.slice(5).trim()) as {
        type: string;
        content?: string;
        conversationId?: string;
        title?: string;
        messageId?: string;
      };

      if (json.type === "meta" && json.conversationId) {
        handlers.onMeta?.({ conversationId: json.conversationId, title: json.title || "New chat" });
      } else if (json.type === "delta" && json.content) {
        handlers.onDelta?.(json.content);
      } else if (json.type === "done" && json.conversationId && json.messageId) {
        handlers.onDone?.({ conversationId: json.conversationId, messageId: json.messageId });
      } else if (json.type === "error") {
        handlers.onError?.(json.content || "Sorry, I couldn't generate a response.");
      }
    }
  }
}

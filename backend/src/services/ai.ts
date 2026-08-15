const SYSTEM_PROMPT = `You are Chatbots AI, a helpful assistant for learning, programming, writing, and general questions.
Be clear, accurate, and concise — similar to ChatGPT.
Format replies with clean Markdown:
- Use headings (##) for sections
- Use bullet lists with "- " (not bare asterisks alone)
- Use **bold** only for short labels/terms, not whole paragraphs
- Use fenced code blocks for code
Do not dump decorative asterisk lines or ASCII underlines.
Refuse harmful, illegal, or dangerous requests.`;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AiConfig = {
  provider: "ollama" | "openai";
  apiKey: string;
  baseUrl: string;
  model: string;
};

function getConfig(): AiConfig {
  const explicit = (process.env.AI_PROVIDER || "").toLowerCase();
  const provider: "ollama" | "openai" =
    explicit === "ollama"
      ? "ollama"
      : explicit === "openai"
        ? "openai"
        : process.env.VERCEL
          ? "openai"
          : "ollama";

  if (provider === "ollama") {
    return {
      provider,
      apiKey: process.env.OLLAMA_API_KEY?.trim() || "ollama",
      baseUrl: (process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1").replace(/\/$/, ""),
      model: process.env.OLLAMA_MODEL || "llama3.2",
    };
  }

  return {
    provider,
    apiKey: process.env.OPENAI_API_KEY?.trim() || "",
    baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}

export function getDefaultModel() {
  return getConfig().model;
}

export function hasAiConfigured() {
  const config = getConfig();
  if (config.provider === "ollama") return true;
  return Boolean(config.apiKey);
}

async function* streamDemoReply(userMessage: string): AsyncGenerator<string> {
  const text =
    `*(Demo mode — start Ollama or set \`AI_PROVIDER=openai\` with an API key.)*\n\n` +
    `You asked:\n> ${userMessage.slice(0, 500)}\n\n` +
    `Install Ollama, pull a model, then set \`OLLAMA_MODEL\` in \`backend/.env\`.`;

  for (const word of text.split(/(\s+)/)) {
    yield word;
    await new Promise((r) => setTimeout(r, 12));
  }
}

export async function* streamChatCompletion(messages: ChatMessage[]): AsyncGenerator<string> {
  const { provider, apiKey, baseUrl, model } = getConfig();

  if (provider === "openai" && !apiKey) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    yield* streamDemoReply(lastUser?.content || "Hello");
    return;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI service error (${response.status}): ${errText.slice(0, 300)}`);
  }

  if (!response.body) {
    throw new Error("AI service returned an empty body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const chunk = json.choices?.[0]?.delta?.content;
        if (chunk) yield chunk;
      } catch {
        // ignore malformed SSE chunks
      }
    }
  }
}

export function titleFromMessage(content: string) {
  const clean = content.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean;
}

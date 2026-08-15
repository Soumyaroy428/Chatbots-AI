import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { streamChat } from "../lib/chatStream";
import { MarkdownMessage } from "../components/MarkdownMessage";
import type { ConversationSummary, Message } from "../types";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ChatAppPage() {
  const { user, logout, updateProfile } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTitle, setActiveTitle] = useState("New chat");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  async function loadConversations() {
    const data = await api<{ conversations: ConversationSummary[] }>("/api/conversations");
    setConversations(data.conversations);
  }

  async function loadConversation(id: string) {
    const data = await api<{ conversation: ConversationSummary & { messages: Message[] } }>(
      `/api/conversations/${id}`
    );
    setMessages(data.conversation.messages);
    setActiveTitle(data.conversation.title);
  }

  useEffect(() => {
    loadConversations().catch(() => setError("Could not load conversations"));
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setActiveTitle("New chat");
      return;
    }
    loadConversation(conversationId).catch(() => setError("Conversation not found"));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function stopGeneration() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  async function onSend(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setError("");
    setInput("");
    const tempUser: Message = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: text,
    };
    const tempAssistant: Message = {
      id: `local-assistant-${Date.now()}`,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, tempUser, tempAssistant]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let currentId = conversationId;

    try {
      await streamChat(
        { message: text, conversationId: currentId },
        {
          onMeta: ({ conversationId: id, title }) => {
            currentId = id;
            setActiveTitle(title);
            if (!conversationId) navigate(`/app/c/${id}`, { replace: true });
          },
          onDelta: (chunk) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, content: last.content + chunk };
              }
              return next;
            });
          },
          onDone: async () => {
            await loadConversations();
          },
          onError: (content) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") next[next.length - 1] = { ...last, content };
              return next;
            });
          },
        },
        controller.signal
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message || "Chat failed");
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && !last.content) {
            next[next.length - 1] = {
              ...last,
              content: "Sorry, I couldn't generate a response. Please try again.",
            };
          }
          return next;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  async function deleteConversation(id: string) {
    await api(`/api/conversations/${id}`, { method: "DELETE" });
    setToast("Chat deleted");
    await loadConversations();
    if (conversationId === id) navigate("/app");
  }

  async function renameConversation(id: string, title: string) {
    const next = title.trim();
    if (!next) return;
    await api(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: next }),
    });
    setToast("Conversation renamed");
    await loadConversations();
    if (conversationId === id) setActiveTitle(next);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setToast("Copied");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-[var(--color-line)] bg-[color-mix(in_oklab,white_88%,transparent)] backdrop-blur-md transition-transform dark:border-[#2a4f49] dark:bg-[#0a1f1c]/95 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-xl text-[var(--color-forest)] dark:text-[var(--color-mint)]">
            Chatbots AI
          </Link>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="px-3">
          <button
            type="button"
            onClick={() => {
              navigate("/app");
              setSidebarOpen(false);
            }}
            className="w-full rounded-xl bg-[var(--color-forest)] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-moss)]"
          >
            + New chat
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="mt-3 w-full rounded-xl border border-[var(--color-line)] bg-white/70 px-3 py-2 text-sm outline-none ring-[var(--color-moss)] focus:ring-2 dark:border-[#2a4f49] dark:bg-[#0c2220]"
          />
        </div>

        <div className="mt-3 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Recent
          </p>
          {filtered.length === 0 && (
            <p className="px-2 text-sm text-[var(--color-muted)]">No conversations yet</p>
          )}
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-xl px-2 py-2 text-sm hover:bg-[var(--color-mint)]/60 dark:hover:bg-[#143532] ${
                conversationId === c.id ? "bg-[var(--color-mint)] dark:bg-[#143532]" : ""
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => {
                  navigate(`/app/c/${c.id}`);
                  setSidebarOpen(false);
                }}
                title={c.title}
              >
                {c.title}
              </button>
              <button
                type="button"
                className="hidden rounded px-1 text-xs text-[var(--color-muted)] group-hover:inline hover:text-[var(--color-ink)] dark:hover:text-white"
                onClick={() => {
                  const next = window.prompt("Rename conversation", c.title);
                  if (next) renameConversation(c.id, next).catch(() => setError("Rename failed"));
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="hidden rounded px-1 text-xs text-[var(--color-ember)] group-hover:inline"
                onClick={() => deleteConversation(c.id).catch(() => setError("Delete failed"))}
              >
                Del
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--color-line)] p-3 dark:border-[#2a4f49]">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--color-mint)]/50 dark:hover:bg-[#143532]"
          >
            <div className="font-semibold">{user?.name}</div>
            <div className="truncate text-xs text-[var(--color-muted)]">{user?.email}</div>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 dark:border-[#2a4f49]">
          <button
            type="button"
            className="rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm md:hidden dark:border-[#2a4f49]"
            onClick={() => setSidebarOpen(true)}
          >
            Menu
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">{activeTitle}</h1>
            <p className="text-xs text-[var(--color-muted)]">Ask · learn · build</p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm dark:border-[#2a4f49]"
          >
            Settings
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.length === 0 && (
              <div className="surface mt-10 rounded-3xl p-8 text-center">
                <p className="font-display text-3xl text-[var(--color-forest)] dark:text-[var(--color-mint)]">
                  What do you want to figure out?
                </p>
                <p className="mt-3 text-[var(--color-muted)]">
                  Homework, debugging, writing, summaries — start typing below.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <article
                key={m.id}
                className={`rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "ml-8 bg-[var(--color-forest)] text-white"
                    : "mr-4 surface"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs opacity-70">
                  <span>{m.role === "user" ? "You" : "Chatbots AI"}</span>
                  {m.createdAt && <span>{formatTime(m.createdAt)}</span>}
                </div>
                {m.role === "assistant" ? (
                  <MarkdownMessage content={m.content || (streaming ? "…" : "")} />
                ) : (
                  <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                    {m.content}
                  </div>
                )}
                {m.role === "assistant" && m.content && (
                  <button
                    type="button"
                    onClick={() => copyText(m.content)}
                    className="mt-2 text-xs font-medium text-[var(--color-moss)] hover:underline dark:text-[var(--color-mint)]"
                  >
                    Copy
                  </button>
                )}
              </article>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-[var(--color-line)] px-4 py-4 dark:border-[#2a4f49]">
          {error && <p className="mx-auto mb-2 max-w-3xl text-sm text-[var(--color-ember)]">{error}</p>}
          <form onSubmit={onSend} className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder="Ask anything…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              className="max-h-40 min-h-[48px] flex-1 resize-y rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 outline-none ring-[var(--color-moss)] focus:ring-2 dark:border-[#2a4f49] dark:bg-[#0c2220]"
            />
            {streaming ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="rounded-2xl border border-[var(--color-ember)] px-4 py-3 text-sm font-semibold text-[var(--color-ember)]"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-2xl bg-[var(--color-ember)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Send
              </button>
            )}
          </form>
        </div>
      </main>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="surface w-full max-w-md rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button type="button" onClick={() => setSettingsOpen(false)} className="text-sm">
                Close
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Display name</span>
                <input
                  defaultValue={user?.name}
                  id="settings-name"
                  className="w-full rounded-xl border border-[var(--color-line)] bg-white/80 px-3 py-2 dark:border-[#2a4f49] dark:bg-[#0c2220]"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Theme</span>
                <select
                  defaultValue={user?.theme || "system"}
                  id="settings-theme"
                  className="w-full rounded-xl border border-[var(--color-line)] bg-white/80 px-3 py-2 dark:border-[#2a4f49] dark:bg-[#0c2220]"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <button
                type="button"
                className="w-full rounded-xl bg-[var(--color-forest)] px-4 py-2.5 text-sm font-semibold text-white"
                onClick={async () => {
                  const name = (document.getElementById("settings-name") as HTMLInputElement).value;
                  const theme = (document.getElementById("settings-theme") as HTMLSelectElement)
                    .value as "light" | "dark" | "system";
                  await updateProfile({ name, theme });
                  setToast("Profile updated");
                  setSettingsOpen(false);
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="w-full rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-sm font-semibold dark:border-[#2a4f49]"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm text-white shadow-lg dark:bg-[var(--color-mint)] dark:text-[var(--color-ink)]">
          {toast}
        </div>
      )}
    </div>
  );
}

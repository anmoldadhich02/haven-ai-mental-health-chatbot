import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  Bot,
  Heart,
  Menu,
  Plus,
  Send,
  Sparkles,
  User,
  Smile,
  Meh,
  Frown,
  Annoyed,
  Angry,
  CircleDot,
  Clock3,
  ChevronRight,
} from "lucide-react";

const styles = `
  :root {
    --bg: #0f1117;
    --sidebar: #13151e;
    --panel: #151923;
    --panel-2: #181d28;
    --border: rgba(141, 160, 150, 0.16);
    --text: #e7efe8;
    --muted: #8b9a93;
    --muted-2: #6f7a74;
    --sage: #5a8a6e;
    --sage-2: #355244;
    --sage-3: rgba(90, 138, 110, 0.18);
    --user: #202734;
    --user-border: rgba(130, 153, 143, 0.15);
    --bot: #141b18;
    --bot-border: rgba(90, 138, 110, 0.35);
    --chip: #161a24;
    --chip-hover: #1c2230;
    --shadow: 0 10px 40px rgba(0,0,0,0.34);
  }

  html, body, #root {
    height: 100%;
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: "DM Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  * { box-sizing: border-box; }

  ::selection { background: rgba(90, 138, 110, 0.3); }

  .app-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at top, rgba(90,138,110,0.08), transparent 28%),
      linear-gradient(180deg, rgba(255,255,255,0.02), transparent 22%),
      var(--bg);
  }

  .glass-panel {
    background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    backdrop-filter: blur(16px);
  }

  .noise {
    position: relative;
    overflow: hidden;
  }
  .noise:before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 22px 22px;
    pointer-events: none;
    opacity: 0.18;
    mask-image: linear-gradient(180deg, rgba(0,0,0,0.6), transparent 80%);
  }

  .hide-scrollbar::-webkit-scrollbar { width: 0; height: 0; }
  .hide-scrollbar { scrollbar-width: none; }

  .mood-selected {
    background: rgba(90,138,110,0.18);
    border-color: rgba(90,138,110,0.5);
    color: var(--text);
    transform: translateY(-1px);
  }

  .hover-lift {
    transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, opacity 180ms ease;
  }
  .hover-lift:hover { transform: translateY(-1px); }

  .fade-in-up {
    animation: fadeInUp 240ms ease both;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes blink {
    0%, 100% { opacity: 0.45; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-2px); }
  }

  .dot-bounce {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--sage);
    animation: blink 1.2s infinite ease-in-out;
  }
`;

const sampleSuggestions = [
  "I need detailed advice",
  "I just want to vent",
  "Help me calm down",
  "I'm not sure how I feel",
];

const sampleHistory = [
  "Feeling overwhelmed today",
  "Work anxiety & burnout",
  "Sleep & intrusive thoughts",
  "Processing a hard week",
  "Relationship worries",
];

const moodOptions = [
  { key: "happy", emoji: "😊", label: "Good" },
  { key: "neutral", emoji: "😐", label: "Okay" },
  { key: "sad", emoji: "😔", label: "Low" },
  { key: "anxious", emoji: "😰", label: "Anxious" },
  { key: "very-sad", emoji: "😢", label: "Rough" },
];

const useChatStore = create((set, get) => ({
  messages: [
    {
      id: "welcome-bot",
      role: "haven",
      content:
        "Hey, I’m Haven. This is a calm space to share what’s on your mind. What’s been feeling heavy lately?",
      timestamp: new Date(),
    },
  ],
  history: sampleHistory,
  selectedMood: null,
  activeSession: sampleHistory[0],
  input: "",
  isTyping: false,
  setInput: (input) => set({ input }),
  setSelectedMood: (selectedMood) => set({ selectedMood }),
  setActiveSession: (activeSession) => set({ activeSession }),
  setHistory: (history) => set({ history }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setTyping: (isTyping) => set({ isTyping }),
  clearConversation: () =>
    set({
      messages: [
        {
          id: "welcome-bot",
          role: "haven",
          content:
            "Hey, I’m Haven. This is a calm space to share what’s on your mind. What’s been feeling heavy lately?",
          timestamp: new Date(),
        },
      ],
      input: "",
      isTyping: false,
    }),
  loadFromLocalStorage: () => {
    try {
      const raw = localStorage.getItem("haven-history");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) set({ history: parsed });
      }
    } catch {}
  },
  persistHistory: () => {
    try {
      localStorage.setItem("haven-history", JSON.stringify(get().history));
    } catch {}
  },
  saveSessionToHistory: (title) => {
    const current = get().history;
    const filtered = current.filter((item) => item !== title);
    const updated = [title, ...filtered].slice(0, 8);
    set({ history: updated, activeSession: title });
    try {
      localStorage.setItem("haven-history", JSON.stringify(updated));
    } catch {}
  },
}));

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
});

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function useAutoResize(textareaRef, value) {
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${next}px`;
  }, [textareaRef, value]);
}

function useAutoScroll(dep) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dep]);
  return ref;
}

function MoodBar() {
  const selectedMood = useChatStore((s) => s.selectedMood);
  const setSelectedMood = useChatStore((s) => s.setSelectedMood);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-[var(--muted)] mr-2">How are you feeling?</span>
      {moodOptions.map((mood) => (
        <button
          key={mood.key}
          onClick={() => setSelectedMood(mood.key)}
          className={`hover-lift inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
            selectedMood === mood.key
              ? "mood-selected"
              : "border-[var(--border)] bg-[var(--chip)] text-[var(--muted)] hover:bg-[var(--chip-hover)]"
          }`}
        >
          <span className="text-base">{mood.emoji}</span>
          <span>{mood.label}</span>
        </button>
      ))}
    </div>
  );
}

function SuggestionChips({ onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sampleSuggestions.map((item) => (
        <button
          key={item}
          onClick={() => onPick(item)}
          className="hover-lift rounded-full border border-[var(--border)] bg-[var(--chip)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--chip-hover)] hover:text-[var(--text)]"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="fade-in-up flex items-center gap-2 rounded-2xl border border-[var(--bot-border)] bg-[var(--bot)] px-4 py-3 text-[var(--muted)]">
      <Bot size={16} className="shrink-0 text-[var(--sage)]" />
      <div className="flex items-center gap-1.5">
        <span className="dot-bounce" style={{ animationDelay: "0ms" }} />
        <span className="dot-bounce" style={{ animationDelay: "160ms" }} />
        <span className="dot-bounce" style={{ animationDelay: "320ms" }} />
      </div>
      <span className="text-sm">Haven is thinking…</span>
    </div>
  );
}

function MessageBubble({ message }) {
  const isHaven = message.role === "haven";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex gap-3 ${isHaven ? "justify-start" : "justify-end"}`}
    >
      {isHaven && (
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--sage-3)] bg-[rgba(90,138,110,0.22)] text-[var(--sage)]">
          <Bot size={16} />
        </div>
      )}
      <div className={`max-w-[78%] ${isHaven ? "items-start" : "items-end"} flex flex-col`}>
        <div
          className={`rounded-2xl border px-4 py-3 leading-relaxed shadow-sm ${
            isHaven
              ? "border-[var(--bot-border)] bg-[var(--bot)] text-[var(--text)]"
              : "border-[var(--user-border)] bg-[var(--user)] text-[var(--text)]"
          }`}
        >
          <p className="whitespace-pre-wrap text-[15px]">{message.content}</p>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--muted-2)]">
          <Clock3 size={11} />
          <span>{isHaven ? "Haven" : "You"}</span>
          <span>·</span>
          <span>{formatTime(message.timestamp)}</span>
        </div>
      </div>
      {!isHaven && (
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--muted)]">
          <User size={16} />
        </div>
      )}
    </motion.div>
  );
}

function ChatWindow({ onPickSuggestion }) {
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const endRef = useAutoScroll(`${messages.length}-${isTyping}`);

  const empty = messages.length <= 1;

  return (
    <div className="flex h-full flex-col">
      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--sage-3)] bg-[rgba(90,138,110,0.15)] text-[var(--sage)]">
            <Heart size={28} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">
            Hey, I’m Haven
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--muted)]">
            A safe space to share what’s on your mind. No judgment, no pressure — just honest support.
          </p>
          <div className="mt-8 w-full max-w-2xl">
            <MoodBar />
            <div className="mt-6">
              <SuggestionChips onPick={onPickSuggestion} />
            </div>
          </div>
        </div>
      ) : (
        <div className="hide-scrollbar flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>
            {isTyping && <TypingIndicator />}
            <div ref={endRef} />
          </div>
        </div>
      )}
    </div>
  );
}

function ChatInput({ onSend, disabled }) {
  const input = useChatStore((s) => s.input);
  const setInput = useChatStore((s) => s.setInput);
  const textareaRef = useRef(null);
  useAutoResize(textareaRef, input);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-[var(--border)] bg-[rgba(15,17,23,0.88)] px-4 py-4 backdrop-blur md:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-3 rounded-3xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-lg">
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share what's on your mind..."
          className="max-h-40 min-h-[26px] flex-1 resize-none bg-transparent py-1 text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--muted-2)]"
        />
        <button
          onClick={onSend}
          disabled={disabled}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[rgba(90,138,110,0.16)] text-[var(--text)] transition hover:bg-[rgba(90,138,110,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
      <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-[var(--muted-2)]">
        Haven remembers your conversation · Not a substitute for professional care
      </p>
    </div>
  );
}

function Sidebar({ onNewSession }) {
  const history = useChatStore((s) => s.history);
  const activeSession = useChatStore((s) => s.activeSession);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-[var(--border)] bg-[var(--sidebar)] px-4 py-4">
      <div className="flex items-center gap-3 px-1 pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(90,138,110,0.24)] text-[var(--text)]">
          <span className="font-semibold">H</span>
        </div>
        <div>
          <div className="text-[17px] font-semibold tracking-wide text-[var(--text)]">Haven</div>
        </div>
      </div>

      <button
        onClick={onNewSession}
        className="hover-lift mb-5 inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[var(--text)]"
      >
        <Plus size={16} /> New session
      </button>

      <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-2)]">Recent</div>
      <div className="hide-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {history.map((item) => {
          const isActive = activeSession === item;
          return (
            <button
              key={item}
              onClick={() => setActiveSession(item)}
              className={`group flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                isActive
                  ? "border-[rgba(90,138,110,0.45)] bg-[rgba(90,138,110,0.16)] text-[var(--text)]"
                  : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[rgba(255,255,255,0.02)] hover:text-[var(--text)]"
              }`}
            >
              <span className="line-clamp-1">{item}</span>
              <ChevronRight size={14} className="opacity-40 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(90,138,110,0.24)] text-[var(--text)]">
            <User size={18} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[var(--text)]">You</div>
            <div className="truncate text-xs text-[var(--muted-2)]">Private session</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--sage)] shadow-[0_0_0_6px_rgba(90,138,110,0.12)]" />
        <span>Haven is here with you</span>
      </div>
      <div className="flex items-center gap-3 text-[var(--muted)]">
        <button className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-2 hover:bg-[rgba(255,255,255,0.04)]">
          <Menu size={18} />
        </button>
        <button className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-2 hover:bg-[rgba(255,255,255,0.04)]">
          <Sparkles size={18} />
        </button>
      </div>
    </div>
  );
}
function fetchHavenReply(message) {
  return api.post("/chat/", { message }).then((res) => res.data);
}

function HavenApp() {
  const messages = useChatStore((s) => s.messages);
  const input = useChatStore((s) => s.input);
  const setInput = useChatStore((s) => s.setInput);
  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const clearConversation = useChatStore((s) => s.clearConversation);
  const history = useChatStore((s) => s.history);
  const saveSessionToHistory = useChatStore((s) => s.saveSessionToHistory);
  const loadFromLocalStorage = useChatStore((s) => s.loadFromLocalStorage);

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const mutation = useMutation({
    mutationFn: ({ message, history }) => fetchHavenReply(message, history),
    onSuccess: (data) => {
      setTyping(false);
      addMessage({
        id: crypto.randomUUID(),
        role: "haven",
        content: data.bot_reply ?? "I’m here with you.",
        timestamp: new Date(),
      });
      const title = (data.bot_reply || "New session").slice(0, 34).trim();
      saveSessionToHistory(title || "New session");
    },
    onError: () => {
      setTyping(false);
      addMessage({
        id: crypto.randomUUID(),
        role: "haven",
        content: "I’m having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      });
    },
  });

  const sendMessage = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;

    const historyPayload = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "haven" ? "assistant" : "user", content: m.content }));

    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    });
    setInput("");
    setTyping(true);
    mutation.mutate({ message: text });
  };

  const handlePickSuggestion = (text) => {
    setInput(text);
  };

  return (
    <div className="app-shell noise min-h-screen">
      <style>{styles}</style>
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden rounded-none md:p-2">
        <div className="glass-panel flex min-h-[calc(100vh-16px)] w-full overflow-hidden rounded-none md:rounded-[28px]">
          <Sidebar onNewSession={clearConversation} />
          <main className="flex min-w-0 flex-1 flex-col bg-[var(--bg)]">
            <TopBar />
            <div className="min-h-0 flex-1">
              <ChatWindow onPickSuggestion={handlePickSuggestion} />
            </div>
            <div className="border-t border-[var(--border)] bg-[rgba(15,17,23,0.95)] px-6 py-5">
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                <MoodBar />
                <SuggestionChips onPick={handlePickSuggestion} />
              </div>
            </div>
            <ChatInput onSend={sendMessage} disabled={mutation.isPending} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="h-full">
      <HavenApp />
    </div>
  );
}
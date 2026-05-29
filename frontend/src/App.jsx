import React, {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import MoodDashboard from "./components/MoodDashboard";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  Bot, Menu, Plus, Send, Sparkles, User, Clock3, ChevronRight,
  Heart, Bookmark, Trash2, Edit3, Wind, Moon, Sun, Sunrise,
  Sunset, BarChart2, Leaf, Settings, Star, X, Check, ChevronDown,
  MessageSquare, Brain, Zap, Coffee, Activity,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   TIME-AWARE THEME
═══════════════════════════════════════════════ */
function getTimeTheme() {
  const h = new Date().getHours();
  if (h >= 5 && h < 9)   return "dawn";
  if (h >= 9 && h < 17)  return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

function getTimeGreeting(name) {
  const h = new Date().getHours();
  const n = name ? `, ${name}` : "";
  if (h >= 5  && h < 9)  return `Good morning${n} 🌅`;
  if (h >= 9  && h < 12) return `Good morning${n} 🌿`;
  if (h >= 12 && h < 17) return `Good afternoon${n} 🌤`;
  if (h >= 17 && h < 20) return `Good evening${n} 🌇`;
  return `Hey${n}, Haven is with you 🌙`;
}

const TIME_THEMES = {
  dawn:  { grad1:"rgba(255,160,90,0.13)", grad2:"rgba(255,100,80,0.06)", accent:"#e8956d", accent2:"#f4c170", bg:"#0f0e14", icon: Sunrise },
  day:   { grad1:"rgba(90,138,110,0.12)", grad2:"rgba(90,160,180,0.07)", accent:"#5a8a6e", accent2:"#7bbda0", bg:"#0d0f14", icon: Sun },
  dusk:  { grad1:"rgba(180,100,120,0.12)", grad2:"rgba(220,130,60,0.07)", accent:"#c47a8a", accent2:"#e8a87c", bg:"#0f0d12", icon: Sunset },
  night: { grad1:"rgba(90,100,160,0.12)", grad2:"rgba(60,90,110,0.09)",  accent:"#7a90c4", accent2:"#a0b4e0", bg:"#0a0c12", icon: Moon },
};

/* mood-based accent overrides */
const MOOD_THEMES = {
  happy:    { accent:"#60b87c", accent2:"#9ed4ae", grad1:"rgba(96,184,124,0.12)" },
  calm:     { accent:"#6a9ecf", accent2:"#9bbfe0", grad1:"rgba(106,158,207,0.12)" },
  anxious:  { accent:"#c4a84a", accent2:"#e0cc7a", grad1:"rgba(196,168,74,0.12)" },
  sad:      { accent:"#7a90c4", accent2:"#a0b4e0", grad1:"rgba(122,144,196,0.12)" },
  neutral:  { accent:"#5a8a6e", accent2:"#7bbda0", grad1:"rgba(90,138,110,0.12)" },
  "very-sad":{ accent:"#9070b0", accent2:"#b898d0", grad1:"rgba(144,112,176,0.12)" },
};

/* ═══════════════════════════════════════════════
   DAILY QUOTES (indexed by day-of-year)
═══════════════════════════════════════════════ */
const DAILY_QUOTES = [
  { text:"The present moment is the only moment available to us.", author:"Thich Nhat Hanh" },
  { text:"You don't have to be positive all the time.", author:"Lori Deschene" },
  { text:"Almost everything will work again if you unplug it for a few minutes, including you.", author:"Anne Lamott" },
  { text:"Rest and self-care are so important. When you take time to replenish your spirit, it allows you to serve others from the overflow.", author:"Eleanor Brown" },
  { text:"Your mind will answer most questions if you learn to relax and wait for the answer.", author:"William S. Burroughs" },
  { text:"Within you there is a stillness and a sanctuary to which you can retreat at any time.", author:"Hermann Hesse" },
  { text:"Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.", author:"Oprah Winfrey" },
  { text:"You are allowed to be both a masterpiece and a work in progress simultaneously.", author:"Sophia Bush" },
  { text:"Caring for myself is not self-indulgence, it is self-preservation.", author:"Audre Lorde" },
  { text:"Even the darkest night will end and the sun will rise.", author:"Victor Hugo" },
  { text:"One small positive thought in the morning can change your whole day.", author:"Dalai Lama" },
  { text:"Be gentle with yourself. You are a child of the universe.", author:"Max Ehrmann" },
];

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

/* ═══════════════════════════════════════════════
   GARDEN STAGES
═══════════════════════════════════════════════ */
const GARDEN_STAGES = [
  { stage:0, label:"Seed",     emoji:"🌱", minCheckins:0,  description:"Your journey begins" },
  { stage:1, label:"Sprout",   emoji:"🌿", minCheckins:3,  description:"You're growing" },
  { stage:2, label:"Sapling",  emoji:"🌳", minCheckins:7,  description:"Finding your roots" },
  { stage:3, label:"Tree",     emoji:"🌲", minCheckins:14, description:"Standing tall" },
  { stage:4, label:"Bloom",    emoji:"🌸", minCheckins:21, description:"Fully flourishing" },
  { stage:5, label:"Orchard",  emoji:"🏡", minCheckins:30, description:"A sanctuary of peace" },
];

function getGardenStage(checkinCount) {
  let current = GARDEN_STAGES[0];
  for (const s of GARDEN_STAGES) {
    if (checkinCount >= s.minCheckins) current = s;
  }
  return current;
}

/* ═══════════════════════════════════════════════
   BREATHING PHASES
═══════════════════════════════════════════════ */
const BREATHING_PATTERNS = [
  { name:"Box Breathing", phases:[{label:"Inhale",dur:4},{label:"Hold",dur:4},{label:"Exhale",dur:4},{label:"Hold",dur:4}] },
  { name:"4-7-8 Calm",    phases:[{label:"Inhale",dur:4},{label:"Hold",dur:7},{label:"Exhale",dur:8}] },
  { name:"Deep Reset",    phases:[{label:"Inhale",dur:5},{label:"Hold",dur:2},{label:"Exhale",dur:6}] },
];

/* ═══════════════════════════════════════════════
   AFFIRMATIONS, MOODS, SUGGESTIONS
═══════════════════════════════════════════════ */
const AFFIRMATIONS = [
  "You showed up today. That matters. 🌿",
  "There's no wrong way to feel.",
  "This space is entirely yours.",
  "Every breath is a fresh start.",
  "You deserve gentleness — especially from yourself.",
  "It's okay to not have it all figured out.",
  "Small steps still move you forward.",
  "Your feelings are valid. Always.",
  "Progress is rarely linear. That's okay.",
];

const INTENTIONS = [
  { icon:"🫂", label:"Be heard",     desc:"I just need to talk" },
  { icon:"💡", label:"Find clarity", desc:"Help me make sense of things" },
  { icon:"🧘", label:"Just breathe", desc:"I need calm right now" },
  { icon:"🗺️", label:"Get guidance", desc:"I'd like practical advice" },
];

const PLACEHOLDERS = [
  "What's been sitting with you lately?",
  "No filter needed here…",
  "Start anywhere.",
  "Share what's on your mind…",
  "Whatever you're carrying, I'm listening.",
];

const MOOD_OPTS = [
  { key:"happy",    emoji:"😊", label:"Good",    color:"rgba(100,200,130,0.4)" },
  { key:"calm",     emoji:"😌", label:"Calm",    color:"rgba(106,158,207,0.4)" },
  { key:"neutral",  emoji:"😐", label:"Okay",    color:"rgba(150,180,200,0.4)" },
  { key:"anxious",  emoji:"😰", label:"Anxious", color:"rgba(220,190,80,0.4)"  },
  { key:"sad",      emoji:"😔", label:"Low",     color:"rgba(100,130,200,0.4)" },
  { key:"very-sad", emoji:"😢", label:"Rough",   color:"rgba(200,100,100,0.4)" },
];
const MOOD_SCORE = { happy:5, calm:4, neutral:3, anxious:2, sad:2, "very-sad":1 };

const SUGGESTIONS = [
  "I need detailed advice",
  "I just want to vent",
  "Help me calm down",
  "I'm not sure how I feel",
];

const CHECK_IN_QUESTIONS = [
  { id:"sleep",  icon:"🌙", label:"How did you sleep?",      options:["Very well","Okay","Poorly","Didn't sleep"] },
  { id:"energy", icon:"⚡", label:"Your energy level?",      options:["High","Moderate","Low","Exhausted"] },
  { id:"stress", icon:"🌊", label:"Stress level today?",     options:["Minimal","Manageable","High","Overwhelming"] },
  { id:"mood",   icon:"💭", label:"Overall mood today?",     options:["Great","Good","Mixed","Difficult"] },
];

const TONE_OPTIONS = [
  { key:"warm",        label:"Warm & Nurturing",   desc:"Gentle, supportive, like a close friend" },
  { key:"analytical",  label:"Clear & Practical",  desc:"Structured, solution-focused" },
  { key:"uplifting",   label:"Uplifting & Energetic", desc:"Motivating, positive, action-oriented" },
  { key:"neutral",     label:"Calm & Neutral",     desc:"Balanced, non-directive" },
];

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const buildStyles = (theme, moodTheme) => {
  const t = { ...TIME_THEMES[theme], ...(moodTheme ? MOOD_THEMES[moodTheme] : {}) };
  return `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Fraunces:ital,wght@0,300;0,400;1,300&display=swap');

:root {
  --bg: ${t.bg || "#0d0f14"};
  --sidebar: #0f1118;
  --panel: #131720;
  --border: rgba(141,160,150,0.13);
  --text: #e8f0ea;
  --muted: #8b9a93;
  --muted-2: #6a7870;
  --sage: ${t.accent};
  --sage-2: ${t.accent2};
  --sage-3: rgba(90,138,110,0.16);
  --user: #1a2030;
  --user-border: rgba(130,153,143,0.13);
  --bot: #101610;
  --bot-border: rgba(90,138,110,0.30);
  --chip: #141820;
  --chip-hover: #1a2030;
  --shadow: 0 12px 48px rgba(0,0,0,0.42);
  --accent: ${t.accent};
  --accent2: ${t.accent2};
  --transition: 350ms cubic-bezier(0.4,0,0.2,1);
}

html,body,#root{height:100%;margin:0;background:var(--bg);color:var(--text);
  font-family:"DM Sans",ui-sans-serif,sans-serif;}
*{box-sizing:border-box;}
::selection{background:rgba(90,138,110,0.28);}

.app-shell{height:100vh;overflow:hidden;position:relative;}
.layout-root{display:flex;height:100vh;overflow:hidden;position:relative;z-index:1;}
.main-col{display:flex;flex-direction:column;flex:1;min-width:0;height:100vh;overflow:hidden;}
.chat-scroll{flex:1;overflow-y:auto;min-height:0;scrollbar-width:thin;scrollbar-color:rgba(90,138,110,0.2) transparent;}
.chat-scroll::-webkit-scrollbar{width:4px;}
.chat-scroll::-webkit-scrollbar-track{background:transparent;}
.chat-scroll::-webkit-scrollbar-thumb{background:rgba(90,138,110,0.2);border-radius:99px;}
.sidebar-scroll{flex:1;overflow-y:auto;scrollbar-width:none;}
.sidebar-scroll::-webkit-scrollbar{display:none;}

@keyframes breathe{0%,100%{opacity:0.55;transform:scale(1);}50%{opacity:0.85;transform:scale(1.05);}}
.breath-orb{position:absolute;border-radius:50%;pointer-events:none;
  animation:breathe 8s ease-in-out infinite;filter:blur(90px);}

@keyframes floatUp{
  0%{transform:translateY(0) translateX(0) scale(1);opacity:0;}
  10%{opacity:0.8;}90%{opacity:0.4;}
  100%{transform:translateY(-110vh) translateX(var(--drift)) scale(0.5);opacity:0;}}
.particle{position:absolute;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(90,138,110,0.65),transparent 70%);
  animation:floatUp var(--dur) ease-in-out infinite;animation-delay:var(--delay);}

@keyframes leafFloat{
  0%{transform:translateY(0) rotate(0deg) translateX(0);opacity:0;}
  10%{opacity:0.7;}
  50%{transform:translateY(-50vh) rotate(180deg) translateX(var(--drift));}
  90%{opacity:0.3;}
  100%{transform:translateY(-110vh) rotate(360deg) translateX(calc(var(--drift)*2));opacity:0;}}
.leaf-particle{position:absolute;pointer-events:none;font-size:var(--size);
  animation:leafFloat var(--dur) ease-in-out infinite;animation-delay:var(--delay);}

@keyframes sparkleUp{
  0%{opacity:1;transform:translate(-50%,-50%) scale(1);}
  100%{opacity:0;transform:translate(calc(-50% + var(--sx)),calc(-50% + var(--sy))) scale(0.3);}}
.sparkle-pt{position:absolute;pointer-events:none;font-size:11px;color:var(--sage);
  animation:sparkleUp 0.65s ease-out forwards;top:50%;left:50%;}

@keyframes ripple{0%{transform:scale(0.5);opacity:0.6;}100%{transform:scale(3.8);opacity:0;}}
.mood-ripple{position:absolute;inset:0;border-radius:999px;
  background:var(--rc);animation:ripple 0.55s ease-out forwards;pointer-events:none;}

@keyframes dotBounce{0%,100%{opacity:0.4;transform:translateY(0);}50%{opacity:1;transform:translateY(-3px);}}
.dot-b{width:7px;height:7px;border-radius:999px;background:var(--sage);
  animation:dotBounce 1.2s ease-in-out infinite;}

@keyframes pulseRing{0%{transform:scale(1);opacity:0.6;}100%{transform:scale(2.4);opacity:0;}}
.pulse-ring{position:absolute;inset:-4px;border-radius:50%;
  border:1px solid var(--sage);animation:pulseRing 2s ease-out infinite;}

@keyframes breatheCircle{
  0%,100%{transform:scale(1);opacity:0.6;}
  33%{transform:scale(1.35);opacity:0.9;}
  66%{transform:scale(1.35);opacity:0.9;}}

@keyframes wordIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.word-in{display:inline-block;animation:wordIn 0.35s ease both;}

@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.fade-slide-up{animation:fadeSlideUp 0.4s ease both;}

@keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
.shimmer{background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent);
  background-size:200% 100%;animation:shimmer 2s infinite;}

.mood-sel{background:rgba(90,138,110,0.18)!important;
  border-color:rgba(90,138,110,0.55)!important;color:var(--text)!important;}

.hover-lift{transition:transform 180ms ease,background 180ms ease,border-color 180ms ease;}
.hover-lift:hover{transform:translateY(-1px);}
.glass{background:linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01));
  border:1px solid var(--border);backdrop-filter:blur(18px);}

.streak{display:inline-flex;align-items:center;gap:5px;font-size:11px;
  color:var(--muted);background:rgba(90,138,110,0.09);border:1px solid rgba(90,138,110,0.20);
  border-radius:999px;padding:3px 10px;white-space:nowrap;}

.sparkline-wrap{padding:10px 12px;background:rgba(255,255,255,0.02);
  border:1px solid var(--border);border-radius:14px;}

.modal-back{position:fixed;inset:0;background:rgba(0,0,0,0.70);
  backdrop-filter:blur(12px);z-index:100;display:flex;align-items:center;justify-content:center;
  padding:16px;}
.modal-box{background:#131720;border:1px solid var(--border);border-radius:24px;
  padding:36px;max-width:460px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.6);
  max-height:90vh;overflow-y:auto;scrollbar-width:none;}
.modal-box::-webkit-scrollbar{display:none;}

.panel-overlay{position:fixed;top:0;right:0;bottom:0;width:360px;
  background:#0f1118;border-left:1px solid var(--border);z-index:90;
  display:flex;flex-direction:column;overflow:hidden;}
.panel-scroll{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(90,138,110,0.2) transparent;}
.panel-scroll::-webkit-scrollbar{width:4px;}
.panel-scroll::-webkit-scrollbar-track{background:transparent;}
.panel-scroll::-webkit-scrollbar-thumb{background:rgba(90,138,110,0.2);border-radius:99px;}

.name-input{background:rgba(255,255,255,0.04);border:1px solid var(--border);
  border-radius:12px;padding:10px 16px;color:var(--text);font-size:15px;
  outline:none;width:100%;transition:border-color 200ms;font-family:inherit;}
.name-input:focus{border-color:rgba(90,138,110,0.5);}
.name-input::placeholder{color:var(--muted-2);}

.input-bar{flex-shrink:0;border-top:1px solid var(--border);
  background:rgba(13,15,20,0.97);backdrop-filter:blur(16px);padding:16px 24px;z-index:10;}

.tag-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
  border-radius:999px;font-size:11px;font-weight:500;}

.garden-tree{font-size:48px;transition:all 0.6s ease;filter:drop-shadow(0 0 12px rgba(90,138,110,0.4));}

.checkin-opt{background:rgba(255,255,255,0.03);border:1px solid var(--border);
  border-radius:10px;padding:8px 14px;font-size:13px;color:var(--muted);
  cursor:pointer;transition:all 160ms;font-family:inherit;}
.checkin-opt:hover,.checkin-opt.selected{background:rgba(90,138,110,0.15);
  border-color:rgba(90,138,110,0.45);color:var(--text);}

.btn-primary{background:rgba(90,138,110,0.22);color:var(--text);border:1px solid rgba(90,138,110,0.4);
  border-radius:12px;padding:10px 20px;font-size:14px;font-weight:500;cursor:pointer;
  font-family:inherit;transition:all 160ms;}
.btn-primary:hover{background:rgba(90,138,110,0.32);}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border);
  border-radius:12px;padding:10px 20px;font-size:14px;cursor:pointer;
  font-family:inherit;transition:all 160ms;}
.btn-ghost:hover{background:rgba(255,255,255,0.03);}

.memory-card{background:rgba(255,255,255,0.02);border:1px solid var(--border);
  border-radius:14px;padding:14px 16px;transition:all 160ms;}
.memory-card:hover{border-color:rgba(90,138,110,0.3);}

.saved-card{background:rgba(255,255,255,0.02);border:1px solid rgba(90,138,110,0.2);
  border-radius:14px;padding:14px 16px;}

.chart-bar{transition:height 0.6s cubic-bezier(0.4,0,0.2,1);}

@media(max-width:768px){
  .sidebar-desktop{display:none!important;}
  .main-col{width:100vw;}
  .panel-overlay{width:100vw;}
}
`;
};

/* ═══════════════════════════════════════════════
   STORE
═══════════════════════════════════════════════ */
const useStore = create((set, get) => ({
  messages: [],
  history: [],          // [{id, title, date, category}]
  sessions: {},         // { [sessionId]: Message[] } — full message arrays keyed by id
  selectedMood: null,
  activeSession: null,  // session id string
  input: "",
  isTyping: false,
  userName: "",
  preferredTone: "warm",
  userGoals: [],
  streak: 1,
  totalCheckins: 0,
  moodLog: [],
  intention: null,
  showIntention: false,
  savedAdvice: [],       // [{id, content, timestamp, tag}]
  memories: [],          // [{id, text, timestamp}]
  checkinData: null,     // today's check-in answers
  sessionReflection: null,
  activePanel: null,     // "memories" | "settings" | "garden" | "analytics" | "breathing"
  gardenStage: 0,
  currentSessionId: null, // id of the session currently being composed

  setInput: (v) => set({ input: v }),
  setSelectedMood: (v) => {
    set({ selectedMood: v });
    const score = MOOD_SCORE[v] ?? 3;
    const today = new Date().toDateString();
    set((s) => {
      const log = s.moodLog.filter(m => m.date !== today);
      return { moodLog: [...log, { date: today, score, mood: v }].slice(-30) };
    });
  },
  // Load a past session's messages into the chat view
  setActiveSession: (sessionId) => {
    const { sessions } = get();
    const msgs = sessions[sessionId];
    if (msgs && msgs.length > 0) {
      set({ activeSession: sessionId, messages: msgs, currentSessionId: sessionId,
            input: "", isTyping: false, sessionReflection: null });
    } else {
      set({ activeSession: sessionId });
    }
  },
  setTyping: (v) => set({ isTyping: v }),
  setIntention: (v) => set({ intention: v, showIntention: false }),
  setShowIntention: (v) => set({ showIntention: v }),
  setUserName: (v) => set({ userName: v }),
  setPreferredTone: (v) => set({ preferredTone: v }),
  setUserGoals: (v) => set({ userGoals: v }),
  setActivePanel: (v) => set({ activePanel: v }),
  setCheckinData: (v) => {
    set({ checkinData: v });
    const c = get().totalCheckins + 1;
    set({ totalCheckins: c, gardenStage: getGardenStage(c).stage });
    try { localStorage.setItem("haven-checkins", String(c)); } catch {}
  },
  setSessionReflection: (v) => set({ sessionReflection: v }),

  addMessage: (m) => {
    set((s) => {
      const messages = [...s.messages, m];
      // Also update the sessions map so the live session stays in sync
      const sid = s.currentSessionId;
      const sessions = sid ? { ...s.sessions, [sid]: messages } : s.sessions;
      return { messages, sessions };
    });
  },
  clearConversation: () => {
    // Generate a fresh session id for the new conversation
    const newId = crypto.randomUUID();
    set({
      messages: [], input: "", isTyping: false,
      intention: null, showIntention: true, sessionReflection: null,
      activeSession: null, currentSessionId: newId,
    });
  },

  saveAdvice: (content, tag = "General") => {
    const item = { id: crypto.randomUUID(), content, timestamp: new Date(), tag };
    set((s) => {
      const updated = [item, ...s.savedAdvice].slice(0, 50);
      try { localStorage.setItem("haven-saved", JSON.stringify(updated)); } catch {}
      return { savedAdvice: updated };
    });
  },
  removeSaved: (id) => set((s) => {
    const updated = s.savedAdvice.filter(x => x.id !== id);
    try { localStorage.setItem("haven-saved", JSON.stringify(updated)); } catch {}
    return { savedAdvice: updated };
  }),

  addMemory: (text) => {
    const item = { id: crypto.randomUUID(), text, timestamp: new Date() };
    set((s) => {
      const updated = [item, ...s.memories].slice(0, 30);
      try { localStorage.setItem("haven-memories", JSON.stringify(updated)); } catch {}
      return { memories: updated };
    });
  },
  editMemory: (id, text) => set((s) => {
    const updated = s.memories.map(m => m.id === id ? { ...m, text } : m);
    try { localStorage.setItem("haven-memories", JSON.stringify(updated)); } catch {}
    return { memories: updated };
  }),
  removeMemory: (id) => set((s) => {
    const updated = s.memories.filter(m => m.id !== id);
    try { localStorage.setItem("haven-memories", JSON.stringify(updated)); } catch {}
    return { memories: updated };
  }),
  deleteSession: (id) => {
  set((s) => {
    const history = s.history.filter(i => i.id !== id);
    const sessions = { ...s.sessions };
    delete sessions[id];
    const messages = s.activeSession === id ? [] : s.messages;
    const activeSession = s.activeSession === id ? null : s.activeSession;
    try {
      localStorage.setItem("haven-history", JSON.stringify(history));
      localStorage.setItem("haven-sessions", JSON.stringify(sessions));
    } catch {}
    return { history, sessions, messages, activeSession };
  });
},
  saveSession: (title) => {
    const today = new Date();
    const dateStr = today.toDateString();
    const isYesterday = new Date(Date.now() - 86400000).toDateString();
    const category = dateStr === isYesterday ? "Yesterday" : "Today";
    const { currentSessionId, messages, sessions } = get();
    const sid = currentSessionId || crypto.randomUUID();
    // Persist full messages for this session keyed by id
    const updatedSessions = { ...sessions, [sid]: messages };
    try { localStorage.setItem("haven-sessions", JSON.stringify(updatedSessions)); } catch {}
    const entry = { id: sid, title, date: today.toISOString(), category };
    const cur = get().history.filter(i => i.id !== sid);
    const updated = [entry, ...cur].slice(0, 30);
    set({ history: updated, activeSession: sid, currentSessionId: sid, sessions: updatedSessions });
    try { localStorage.setItem("haven-history", JSON.stringify(updated)); } catch {}
  },

  hydrate: () => {
    try {
      const h = localStorage.getItem("haven-history");
      if (h) { const p = JSON.parse(h); if (Array.isArray(p)) set({ history: p }); }
      // Restore full session message maps
      const sv = localStorage.getItem("haven-sessions");
      if (sv) {
        const parsed = JSON.parse(sv);
        // Re-hydrate timestamps as Date objects
        const fixed = {};
        Object.entries(parsed).forEach(([sid, msgs]) => {
          fixed[sid] = msgs.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        });
        set({ sessions: fixed });
      }
      const name = localStorage.getItem("haven-name");
      if (name) set({ userName: name });
      const streak = localStorage.getItem("haven-streak");
      if (streak) set({ streak: parseInt(streak, 10) || 1 });
      const ml = localStorage.getItem("haven-moodlog");
      if (ml) set({ moodLog: JSON.parse(ml) });
      const saved = localStorage.getItem("haven-saved");
      if (saved) set({ savedAdvice: JSON.parse(saved) });
      const mems = localStorage.getItem("haven-memories");
      if (mems) set({ memories: JSON.parse(mems) });
      const tone = localStorage.getItem("haven-tone");
      if (tone) set({ preferredTone: tone });
      const checkins = localStorage.getItem("haven-checkins");
      if (checkins) {
        const c = parseInt(checkins, 10) || 0;
        set({ totalCheckins: c, gardenStage: getGardenStage(c).stage });
      }
      // Generate a fresh session id for any new conversation
      set({ currentSessionId: crypto.randomUUID() });
    } catch {}
  },

  persistName: (name) => {
    set({ userName: name });
    try { localStorage.setItem("haven-name", name); } catch {}
  },
  persistTone: (tone) => {
    set({ preferredTone: tone });
    try { localStorage.setItem("haven-tone", tone); } catch {}
  },
  persistStreak: () => {
    const s = get().streak + 1;
    set({ streak: s });
    try { localStorage.setItem("haven-streak", String(s)); } catch {}
  },
  persistMoodLog: () => {
    try { localStorage.setItem("haven-moodlog", JSON.stringify(get().moodLog)); } catch {}
  },
}));

/* ═══════════════════════════════════════════════
   API
═══════════════════════════════════════════════ */
const api = axios.create({
  baseURL: "https://haven-w427.onrender.com",
  headers: { "Content-Type": "application/json" },
});
const fetchReply = (msg) => api.post("/chat/", { message: msg }).then(r => r.data);

/* ═══════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════ */
function formatTime(d) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })
    .format(d instanceof Date ? d : new Date(d));
}
function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function useAutoResize(ref, val) {
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "0px";
    ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + "px";
  }, [ref, val]);
}
function useAutoScroll(dep) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [dep]);
  return ref;
}

/* ═══════════════════════════════════════════════
   LOGO
═══════════════════════════════════════════════ */
function HavenLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3C22 3 29 9 29 16C29 22 24 28 16 29C8 28 3 22 3 16C3 9 10 3 16 3Z"
        fill="rgba(90,138,110,0.20)" stroke="rgba(90,138,110,0.55)" strokeWidth="1.2" />
      <path d="M16 22C16 22 9 17 9 13C9 10.8 10.8 9 13 9C14.3 9 15.4 9.7 16 10.7C16.6 9.7 17.7 9 19 9C21.2 9 23 10.8 23 13C23 17 16 22 16 22Z"
        fill="var(--sage)" opacity="0.88" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   AMBIENT BACKGROUND
═══════════════════════════════════════════════ */
function AmbientBackground({ theme }) {
  const t = TIME_THEMES[theme];
  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, left: `${5 + Math.random() * 90}%`,
    size: 3 + Math.random() * 5,
    dur: `${14 + Math.random() * 20}s`,
    delay: `${Math.random() * 18}s`,
    drift: `${(Math.random() - 0.5) * 80}px`,
  })), []);

  const leaves = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`,
    size: `${12 + Math.random() * 10}px`,
    dur: `${20 + Math.random() * 25}s`,
    delay: `${Math.random() * 25}s`,
    drift: `${(Math.random() - 0.5) * 120}px`,
    emoji: ["🍃", "🌿", "✨", "🌱"][Math.floor(Math.random() * 4)],
  })), []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div className="breath-orb" style={{
        width: 600, height: 600, top: -80, left: "50%", marginLeft: -300,
        background: `radial-gradient(circle, ${t.grad1}, transparent 70%)`,
        animationDuration: "8s",
      }} />
      <div className="breath-orb" style={{
        width: 400, height: 400, bottom: 0, right: "-8%",
        background: `radial-gradient(circle, ${t.grad2}, transparent 70%)`,
        animationDuration: "11s", animationDelay: "3s",
      }} />
      <div className="breath-orb" style={{
        width: 280, height: 280, bottom: "25%", left: "4%",
        background: "radial-gradient(circle, rgba(90,138,110,0.06), transparent 70%)",
        animationDuration: "9s", animationDelay: "1.5s",
      }} />
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, bottom: "-10px", width: p.size, height: p.size,
          "--dur": p.dur, "--delay": p.delay, "--drift": p.drift,
        }} />
      ))}
      {leaves.map(l => (
        <div key={l.id} className="leaf-particle" style={{
          left: l.left, bottom: "-10px",
          "--size": l.size, "--dur": l.dur, "--delay": l.delay, "--drift": l.drift,
        }}>{l.emoji}</div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NAME SETUP MODAL
═══════════════════════════════════════════════ */
function NameSetup({ onDone }) {
  const [val, setVal] = useState("");
  return (
    <div className="modal-back">
      <motion.div className="modal-box" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <HavenLogo size={54} />
          <h2 style={{ fontFamily: "Fraunces,serif", fontSize: 24, fontWeight: 400, marginTop: 14, marginBottom: 8, color: "var(--text)" }}>
            Welcome to Haven
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            A gentle space for your mind. <br />
            What should I call you?
          </p>
        </div>
        <input className="name-input" placeholder="Your name… (optional)" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onDone(val.trim())}
          autoFocus />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => onDone("")} className="btn-ghost" style={{ flex: 1 }}>Skip</button>
          <button onClick={() => onDone(val.trim())} className="btn-primary" style={{ flex: 2 }}>
            Let's go →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   INTENTION MODAL
═══════════════════════════════════════════════ */
function IntentionModal({ onDone }) {
  return (
    <div className="modal-back">
      <motion.div className="modal-box" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ fontFamily: "Fraunces,serif", fontSize: 22, fontWeight: 400, color: "var(--text)", marginBottom: 6, textAlign: "center", marginTop: 0 }}>
          What do you need today?
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
          Haven will tailor its support for you
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {INTENTIONS.map(it => (
            <button key={it.label} onClick={() => onDone(it)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", transition: "all 160ms", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(90,138,110,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
              <span style={{ fontSize: 22 }}>{it.icon}</span>
              <div>
                <div style={{ color: "var(--text)", fontWeight: 500, fontSize: 14 }}>{it.label}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{it.desc}</div>
              </div>
              <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.4 }} />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DAILY CHECK-IN MODAL
═══════════════════════════════════════════════ */
function CheckInModal({ onDone, onSkip }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = CHECK_IN_QUESTIONS[step];
  const isLast = step === CHECK_IN_QUESTIONS.length - 1;

  const pick = (opt) => {
    const newAnswers = { ...answers, [q.id]: opt };
    setAnswers(newAnswers);
    if (isLast) { onDone(newAnswers); }
    else setStep(s => s + 1);
  };

  return (
    <div className="modal-back">
      <motion.div className="modal-box" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Daily Check-in · {step + 1} of {CHECK_IN_QUESTIONS.length}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {CHECK_IN_QUESTIONS.map((_, i) => (
                <div key={i} style={{ height: 3, borderRadius: 99, flex: 1, background: i <= step ? "var(--sage)" : "var(--border)", transition: "background 0.3s" }} />
              ))}
            </div>
          </div>
          <button onClick={onSkip} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{q.icon}</div>
          <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 400, color: "var(--text)", margin: 0 }}>
            {q.label}
          </h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {q.options.map(opt => (
            <button key={opt} className="checkin-opt" onClick={() => pick(opt)}
              style={{ textAlign: "center" }}>
              {opt}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BREATHING MODAL
═══════════════════════════════════════════════ */
function BreathingModal({ onClose }) {
  const [patternIdx, setPatternIdx] = useState(0);
  const [active, setActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef(null);
  const pattern = BREATHING_PATTERNS[patternIdx];
  const phase = pattern.phases[phaseIdx];

  const stop = useCallback(() => {
    setActive(false);
    clearInterval(timerRef.current);
    setPhaseIdx(0);
    setCountdown(0);
  }, []);

  const start = useCallback(() => {
    setActive(true);
    setPhaseIdx(0);
    setCountdown(pattern.phases[0].dur);
  }, [pattern]);

  useEffect(() => {
    if (!active) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setPhaseIdx(pi => {
            const next = (pi + 1) % pattern.phases.length;
            if (next === 0) setCycles(cy => cy + 1);
            setCountdown(pattern.phases[next].dur);
            return next;
          });
          return pattern.phases[phaseIdx].dur;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active, phaseIdx, pattern]);

  const circleScale = phase?.label === "Inhale" ? 1.35 : phase?.label === "Hold" ? 1.35 : 1;

  return (
    <div className="modal-back">
      <motion.div className="modal-box" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: "center", maxWidth: 380 }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
          <X size={20} />
        </button>

        <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 400, color: "var(--text)", marginBottom: 6, marginTop: 0 }}>
          Guided Breathing
        </h3>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
          {BREATHING_PATTERNS.map((p, i) => (
            <button key={i} onClick={() => { setPatternIdx(i); stop(); }}
              style={{ padding: "5px 12px", borderRadius: 999, border: "1px solid var(--border)", background: i === patternIdx ? "rgba(90,138,110,0.2)" : "transparent", color: i === patternIdx ? "var(--text)" : "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {active && (
            <>
              <motion.div animate={{ scale: circleScale }} transition={{ duration: phase?.dur || 4, ease: "linear" }}
                style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(90,138,110,0.15), transparent 70%)", border: "1px solid rgba(90,138,110,0.2)" }} />
              <motion.div animate={{ scale: circleScale }} transition={{ duration: phase?.dur || 4, ease: "linear" }}
                style={{ position: "absolute", inset: 12, borderRadius: "50%", background: "rgba(90,138,110,0.08)", border: "1px solid rgba(90,138,110,0.25)" }} />
            </>
          )}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            {active ? (
              <>
                <div style={{ fontSize: 13, color: "var(--sage)", fontWeight: 500, marginBottom: 4 }}>{phase?.label}</div>
                <div style={{ fontSize: 42, fontWeight: 300, color: "var(--text)", fontFamily: "Fraunces,serif" }}>{countdown}</div>
              </>
            ) : (
              <div style={{ fontSize: 32 }}>🫁</div>
            )}
          </div>
          {!active && (
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(90,138,110,0.25)" }} />
          )}
        </div>

        {active && (
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", gap: 8 }}>
            {pattern.phases.map((p, i) => (
              <span key={i} style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, background: i === phaseIdx ? "rgba(90,138,110,0.2)" : "transparent", color: i === phaseIdx ? "var(--sage)" : "var(--muted)", border: "1px solid", borderColor: i === phaseIdx ? "rgba(90,138,110,0.4)" : "var(--border)" }}>
                {p.label}
              </span>
            ))}
          </div>
        )}

        {cycles > 0 && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>🌿 {cycles} cycle{cycles > 1 ? "s" : ""} complete</div>}

        <div style={{ display: "flex", gap: 10 }}>
          {active ? (
            <button onClick={stop} className="btn-ghost" style={{ flex: 1 }}>Stop</button>
          ) : (
            <button onClick={start} className="btn-primary" style={{ flex: 1 }}>
              {cycles > 0 ? "Restart" : "Begin"} · {pattern.phases.map(p => p.dur).join("-")}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SESSION REFLECTION MODAL
═══════════════════════════════════════════════ */
function ReflectionModal({ reflection, onClose }) {
  return (
    <div className="modal-back">
      <motion.div className="modal-box" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 400, color: "var(--text)", margin: 0 }}>
            Session Reflection
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ background: "rgba(90,138,110,0.06)", borderRadius: 14, padding: "16px", marginBottom: 16, border: "1px solid rgba(90,138,110,0.15)" }}>
          <div style={{ fontSize: 11, color: "var(--sage)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>✨ Your Strengths This Session</div>
          <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.7, margin: 0, fontFamily: "Lora,serif", fontStyle: "italic" }}>
            {reflection?.strengths || "You showed up and opened up. That takes courage."}
          </p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "16px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Summary</div>
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            {reflection?.summary || "This was a meaningful conversation. The themes explored today may continue to unfold."}
          </p>
        </div>
        {reflection?.themes?.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {reflection.themes.map(t => (
              <span key={t} className="tag-pill" style={{ background: "rgba(90,138,110,0.12)", color: "var(--sage)", border: "1px solid rgba(90,138,110,0.25)" }}>{t}</span>
            ))}
          </div>
        )}
        <button onClick={onClose} className="btn-primary" style={{ width: "100%", marginTop: 20 }}>Close</button>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MOOD SPARKLINE
═══════════════════════════════════════════════ */
function MoodSparkline({ log }) {
  if (!log || log.length < 2) return null;
  const W = 140, H = 38, pad = 4;
  const pts = log.slice(-10);
  const xs = pts.map((_, i) => pad + (i / Math.max(pts.length - 1, 1)) * (W - pad * 2));
  const ys = pts.map(p => H - pad - ((p.score - 1) / 4) * (H - pad * 2));
  const path = pts.map((_, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const fill = `${path} L${xs[xs.length - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;

  return (
    <div className="sparkline-wrap" style={{ marginTop: 12 }}>
      <div style={{ fontSize: 10, color: "var(--muted-2)", marginBottom: 6, letterSpacing: "0.12em", textTransform: "uppercase" }}>Mood trend</div>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sage)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--sage)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#sg)" />
        <path d={path} fill="none" stroke="var(--sage)" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={xs[i]} cy={ys[i]}
            r={i === pts.length - 1 ? 3.5 : 2}
            fill={i === pts.length - 1 ? "var(--sage)" : "rgba(90,138,110,0.5)"} />
        ))}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MOOD BAR (with ripple effect)
═══════════════════════════════════════════════ */
function MoodBar() {
  const selected = useStore(s => s.selectedMood);
  const setMood = useStore(s => s.setSelectedMood);
  const [ripple, setRipple] = useState(null);

  const pick = async (mood) => {
    setMood(mood.key);
    setRipple(mood.key);
    setTimeout(() => setRipple(null), 600);

    try {
      await api.post("/mood/", {
        mood: mood.key,
      });
    } catch (error) {
      console.error("Mood save failed:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      <span style={{ color: "var(--muted)", fontSize: 13, marginRight: 4 }}>
        How are you feeling?
      </span>

      {MOOD_OPTS.map(m => (
        <button
          key={m.key}
          onClick={() => pick(m)}
          className={`hover-lift ${selected === m.key ? "mood-sel" : ""}`}
          style={{
            position: "relative",
            overflow: "hidden",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: selected === m.key ? "rgba(90,138,110,0.16)" : "var(--chip)",
            padding: "7px 14px",
            fontSize: 13,
            color: "var(--muted)",
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          {ripple === m.key && (
            <span className="mood-ripple" style={{ "--rc": m.color }} />
          )}
          <span style={{ fontSize: 16 }}>{m.emoji}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DAILY QUOTE CARD
═══════════════════════════════════════════════ */
function DailyQuoteCard() {
  const quote = useMemo(getDailyQuote, []);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      style={{ background: "linear-gradient(135deg, rgba(90,138,110,0.08), rgba(90,138,110,0.03))", border: "1px solid rgba(90,138,110,0.18)", borderRadius: 18, padding: "20px 24px", maxWidth: 520, width: "100%" }}>
      <div style={{ fontSize: 10, color: "var(--sage)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
        ✦ Today's Reflection
      </div>
      <p style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontStyle: "italic", color: "var(--text)", lineHeight: 1.75, margin: "0 0 10px", fontWeight: 300 }}>
        "{quote.text}"
      </p>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>— {quote.author}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   ROTATING AFFIRMATION
═══════════════════════════════════════════════ */
function Affirmation() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * AFFIRMATIONS.length));
  const [key, setKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(i => (i + 1) % AFFIRMATIONS.length);
      setKey(k => k + 1);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.p key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.45 }}
        style={{ color: "var(--muted)", fontSize: 14, fontStyle: "italic", fontFamily: "Lora,serif", textAlign: "center", margin: 0, lineHeight: 1.7 }}>
        {AFFIRMATIONS[idx]}
      </motion.p>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════
   SUGGESTION CHIPS
═══════════════════════════════════════════════ */
function SuggestionChips({ onPick }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {SUGGESTIONS.map(s => (
        <button key={s} onClick={() => onPick(s)} className="hover-lift"
          style={{ borderRadius: 999, border: "1px solid var(--border)", background: "var(--chip)", padding: "8px 16px", fontSize: 13, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>
          {s}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TYPING INDICATOR
═══════════════════════════════════════════════ */
function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 16, border: "1px solid var(--bot-border)", background: "var(--bot)", padding: "10px 16px", color: "var(--muted)", width: "fit-content" }}>
      <Bot size={15} style={{ color: "var(--sage)", flexShrink: 0 }} />
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 160, 320].map(d => <span key={d} className="dot-b" style={{ animationDelay: `${d}ms` }} />)}
      </div>
      <span style={{ fontSize: 13 }}>Haven is thinking…</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MESSAGE BUBBLE
═══════════════════════════════════════════════ */
function MessageBubble({ msg, onSave }) {
  const isHaven = msg.role === "haven";
  const [saved, setSaved] = useState(msg.saved || false);
  const [showSaveBtn, setShowSaveBtn] = useState(false);

  const handleSave = () => {
    if (!saved) { onSave(msg.content); setSaved(true); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      style={{ display: "flex", gap: 12, justifyContent: isHaven ? "flex-start" : "flex-end" }}
      onMouseEnter={() => setShowSaveBtn(true)}
      onMouseLeave={() => setShowSaveBtn(false)}>
      {isHaven && (
        <div style={{ marginTop: 4, width: 32, height: 32, borderRadius: "50%", flexShrink: 0, border: "1px solid rgba(90,138,110,0.3)", background: "rgba(90,138,110,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sage)" }}>
          <Bot size={15} />
        </div>
      )}
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isHaven ? "flex-start" : "flex-end" }}>
        <div style={{ position: "relative", borderRadius: 18, padding: "12px 16px", lineHeight: 1.65, border: `1px solid ${isHaven ? "var(--bot-border)" : "var(--user-border)"}`, background: isHaven ? "var(--bot)" : "var(--user)" }}>
          <p style={{ whiteSpace: "pre-wrap", fontSize: 15, margin: 0 }}>{msg.content}</p>
          {isHaven && (
            <AnimatePresence>
              {showSaveBtn && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleSave}
                  style={{ position: "absolute", top: 8, right: 8, background: saved ? "rgba(90,138,110,0.25)" : "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px", cursor: saved ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, color: saved ? "var(--sage)" : "var(--muted)", fontSize: 11 }}>
                  {saved ? <Check size={11} /> : <Bookmark size={11} />}
                  {saved ? "Saved" : "Save"}
                </motion.button>
              )}
            </AnimatePresence>
          )}
        </div>
        <div style={{ marginTop: 4, display: "flex", gap: 4, alignItems: "center", fontSize: 11, color: "var(--muted-2)" }}>
          <Clock3 size={10} />
          <span>{isHaven ? "Haven" : "You"}</span>
          <span>·</span>
          <span>{formatTime(msg.timestamp)}</span>
        </div>
      </div>
      {!isHaven && (
        <div style={{ marginTop: 4, width: 32, height: 32, borderRadius: "50%", flexShrink: 0, border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
          <User size={15} />
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   ANIMATED HEADING
═══════════════════════════════════════════════ */
function AnimatedHeading({ text }) {
  const words = text.split(" ");
  return (
    <h1 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 400, fontFamily: "Fraunces,serif", color: "var(--text)", margin: "14px 0 0", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
      {words.map((w, i) => (
        <span key={i} className="word-in" style={{ animationDelay: `${i * 70}ms`, display: "inline-block", marginRight: i < words.length - 1 ? "0.28em" : 0 }}>
          {w}
        </span>
      ))}
    </h1>
  );
}

/* ═══════════════════════════════════════════════
   MOTIVATIONAL MESSAGE
═══════════════════════════════════════════════ */
function MotivationalMessage({ mood, checkinData }) {
  const msg = useMemo(() => {
    if (!mood && !checkinData) return null;
    if (mood === "sad" || mood === "very-sad") return "It takes strength to sit with difficult feelings. Haven is here. 💙";
    if (mood === "anxious") return "Let's slow down together. You're safe here. 🌿";
    if (mood === "happy" || mood === "calm") return "What a wonderful energy to bring to today. Let's make it count. ✨";
    if (checkinData?.sleep === "Didn't sleep") return "Rest is healing. Be gentle with yourself today. 🌙";
    if (checkinData?.stress === "Overwhelming") return "When everything feels too much, let Haven help you carry some of it. 🫂";
    return "Whatever today holds, Haven is with you every step of the way. 🌱";
  }, [mood, checkinData]);

  if (!msg) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      style={{ background: "rgba(90,138,110,0.07)", borderRadius: 14, padding: "12px 16px", maxWidth: 520, width: "100%", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 18 }}>🌸</span>
      <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, fontStyle: "italic", fontFamily: "Lora,serif" }}>{msg}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   EMOTIONAL GARDEN (sidebar widget)
═══════════════════════════════════════════════ */
function GardenWidget({ totalCheckins, onClick }) {
  const stage = getGardenStage(totalCheckins);
  const nextStage = GARDEN_STAGES[Math.min(stage.stage + 1, GARDEN_STAGES.length - 1)];
  const progress = nextStage.stage > stage.stage
    ? Math.min(((totalCheckins - stage.minCheckins) / (nextStage.minCheckins - stage.minCheckins)) * 100, 100)
    : 100;

  return (
    <button onClick={onClick} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 16, padding: "12px 14px", textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%", marginTop: 12, transition: "all 160ms" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(90,138,110,0.08)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--muted-2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Your Garden</div>
        <span style={{ fontSize: 22 }}>{stage.emoji}</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, marginBottom: 2 }}>{stage.label}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{stage.description}</div>
      <div style={{ height: 3, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: "var(--sage)", borderRadius: 99 }} />
      </div>
      <div style={{ fontSize: 10, color: "var(--muted-2)", marginTop: 4 }}>
        {totalCheckins} check-ins · Next: {nextStage.emoji} {nextStage.label}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════
   GARDEN PANEL
═══════════════════════════════════════════════ */
function GardenPanel({ totalCheckins, onClose }) {
  const stage = getGardenStage(totalCheckins);
  return (
    <motion.div className="panel-overlay" initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }} transition={{ type: "spring", damping: 24 }}>
      <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontFamily: "Fraunces,serif", fontWeight: 400, color: "var(--text)" }}>Your Emotional Garden</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={18} /></button>
      </div>
      <div className="panel-scroll" style={{ padding: 20 }}>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }}
            style={{ fontSize: 80, marginBottom: 16, display: "block", filter: "drop-shadow(0 0 20px rgba(90,138,110,0.5))" }}>
            {stage.emoji}
          </motion.div>
          <h2 style={{ fontFamily: "Fraunces,serif", fontSize: 26, fontWeight: 300, color: "var(--text)", margin: "0 0 6px" }}>{stage.label}</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, fontStyle: "italic", fontFamily: "Lora,serif" }}>{stage.description}</p>
          <div style={{ background: "rgba(90,138,110,0.08)", borderRadius: 14, padding: "16px", marginTop: 20, border: "1px solid rgba(90,138,110,0.15)" }}>
            <div style={{ fontSize: 28, fontWeight: 300, fontFamily: "Fraunces,serif", color: "var(--text)" }}>{totalCheckins}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>total check-ins</div>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          {GARDEN_STAGES.map((s, i) => {
            const unlocked = totalCheckins >= s.minCheckins;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, marginBottom: 6, background: s.stage === stage.stage ? "rgba(90,138,110,0.1)" : "transparent", border: s.stage === stage.stage ? "1px solid rgba(90,138,110,0.2)" : "1px solid transparent" }}>
                <span style={{ fontSize: 20, opacity: unlocked ? 1 : 0.3 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: unlocked ? "var(--text)" : "var(--muted-2)", fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{s.minCheckins} check-ins to unlock</div>
                </div>
                {unlocked && <Check size={14} style={{ color: "var(--sage)" }} />}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   ANALYTICS PANEL
═══════════════════════════════════════════════ */
function AnalyticsPanel({ moodLog, streak, onClose }) {
  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toDateString();
      const entry = moodLog.find(m => m.date === dateStr);
      days.push({ date: d, score: entry?.score, mood: entry?.mood, label: d.toLocaleDateString(undefined, { weekday: "short" }) });
    }
    return days;
  }, [moodLog]);

  const avgScore = moodLog.length > 0 ? (moodLog.reduce((a, b) => a + b.score, 0) / moodLog.length).toFixed(1) : "—";
  const bestDay = moodLog.length > 0 ? moodLog.reduce((a, b) => a.score > b.score ? a : b) : null;
  const moodEmoji = { happy: "😊", calm: "😌", neutral: "😐", anxious: "😰", sad: "😔", "very-sad": "😢" };

  return (
    <motion.div className="panel-overlay" initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }} transition={{ type: "spring", damping: 24 }}>
      <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontFamily: "Fraunces,serif", fontWeight: 400, color: "var(--text)" }}>Mood Analytics</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={18} /></button>
      </div>
      <div className="panel-scroll" style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Day Streak", value: `🔥 ${streak}`, sub: "consecutive days" },
            { label: "Avg Mood", value: avgScore, sub: "out of 5" },
            { label: "Check-ins", value: moodLog.length, sub: "total logged" },
            { label: "Best Mood", value: bestDay ? moodEmoji[bestDay.mood] || "🌟" : "—", sub: bestDay ? formatDate(new Date(bestDay.date)) : "log some moods" },
          ].map(c => (
            <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "14px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 300, fontFamily: "Fraunces,serif", color: "var(--text)" }}>{c.value}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "16px", border: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Last 7 Days</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
            {last7.map((d, i) => {
              const h = d.score ? (d.score / 5) * 64 : 4;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: h }} transition={{ delay: i * 0.07, duration: 0.5, ease: "easeOut" }}
                    style={{ width: "100%", borderRadius: 4, background: d.score ? "var(--sage)" : "var(--border)", opacity: d.score ? 0.8 : 0.3, minHeight: 4 }} />
                  <div style={{ fontSize: 10, color: "var(--muted-2)" }}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "16px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Mood Distribution</div>
          {MOOD_OPTS.map(m => {
            const count = moodLog.filter(l => l.mood === m.key).length;
            const pct = moodLog.length ? Math.round((count / moodLog.length) * 100) : 0;
            return (
              <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14, width: 20 }}>{m.emoji}</span>
                <span style={{ fontSize: 12, color: "var(--muted)", width: 52 }}>{m.label}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2, duration: 0.6 }}
                    style={{ height: "100%", background: "var(--sage)", borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--muted-2)", width: 28, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MEMORY PANEL
═══════════════════════════════════════════════ */
function MemoryPanel({ memories, savedAdvice, onClose, onEditMemory, onDeleteMemory, onDeleteSaved }) {
  const [tab, setTab] = useState("memories");
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");

  return (
    <motion.div className="panel-overlay" initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }} transition={{ type: "spring", damping: 24 }}>
      <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontFamily: "Fraunces,serif", fontWeight: 400, color: "var(--text)" }}>Saved & Memories</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["memories", "saved"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid var(--border)", background: tab === t ? "rgba(90,138,110,0.15)" : "transparent", color: tab === t ? "var(--text)" : "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {t === "memories" ? `Memories (${memories.length})` : `Saved Advice (${savedAdvice.length})`}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-scroll" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {tab === "memories" && (
          memories.length === 0
            ? <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>No memories saved yet.<br /><span style={{ fontSize: 11, opacity: 0.7 }}>Haven will remember key insights from your conversations.</span></div>
            : memories.map(m => (
              <div key={m.id} className="memory-card">
                {editId === m.id ? (
                  <div>
                    <textarea value={editVal} onChange={e => setEditVal(e.target.value)}
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13, lineHeight: 1.6, resize: "none", fontFamily: "inherit", minHeight: 60 }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => { onEditMemory(m.id, editVal); setEditId(null); }}
                        style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(90,138,110,0.2)", border: "none", color: "var(--text)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        Save
                      </button>
                      <button onClick={() => setEditId(null)} style={{ padding: "4px 12px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, margin: "0 0 8px" }}>{m.text}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "var(--muted-2)" }}>{formatDate(m.timestamp)}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditId(m.id); setEditVal(m.text); }}
                          style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 3 }}>
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => onDeleteMemory(m.id)}
                          style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 3 }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
        )}
        {tab === "saved" && (
          savedAdvice.length === 0
            ? <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>No saved advice yet.<br /><span style={{ fontSize: 11, opacity: 0.7 }}>Hover over any Haven response to save it.</span></div>
            : savedAdvice.map(s => (
              <div key={s.id} className="saved-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span className="tag-pill" style={{ background: "rgba(90,138,110,0.12)", color: "var(--sage)", border: "1px solid rgba(90,138,110,0.2)", fontSize: 10 }}>
                    {s.tag}
                  </span>
                  <button onClick={() => onDeleteSaved(s.id)} style={{ background: "none", border: "none", color: "var(--muted-2)", cursor: "pointer", padding: 0 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, margin: "0 0 6px" }}>{s.content.slice(0, 180)}{s.content.length > 180 ? "…" : ""}</p>
                <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{formatDate(s.timestamp)}</div>
              </div>
            ))
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   SETTINGS PANEL
═══════════════════════════════════════════════ */
function SettingsPanel({ userName, preferredTone, onClose, onSaveName, onSaveTone }) {
  const [name, setName] = useState(userName);
  const [tone, setTone] = useState(preferredTone);
  const [saved, setSaved] = useState(false);

  const save = () => {
    onSaveName(name);
    onSaveTone(tone);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div className="panel-overlay" initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }} transition={{ type: "spring", damping: 24 }}>
      <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontFamily: "Fraunces,serif", fontWeight: 400, color: "var(--text)" }}>Personalize Haven</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={18} /></button>
      </div>
      <div className="panel-scroll" style={{ padding: 20 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Your Name</div>
          <input className="name-input" value={name} onChange={e => setName(e.target.value)} placeholder="What should Haven call you?" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Preferred Tone</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TONE_OPTIONS.map(t => (
              <button key={t.key} onClick={() => setTone(t.key)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${tone === t.key ? "rgba(90,138,110,0.45)" : "var(--border)"}`, background: tone === t.key ? "rgba(90,138,110,0.12)" : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 140ms" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid", borderColor: tone === t.key ? "var(--sage)" : "var(--border)", background: tone === t.key ? "var(--sage)" : "transparent", flexShrink: 0, transition: "all 140ms" }} />
                <div>
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} className="btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {saved ? <><Check size={14} /> Saved!</> : "Save Preferences"}
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   CHAT WINDOW
═══════════════════════════════════════════════ */
function ChatWindow({ onPickSuggestion, onSave }) {
  const messages = useStore(s => s.messages);
  const isTyping = useStore(s => s.isTyping);
  const userName = useStore(s => s.userName);
  const selectedMood = useStore(s => s.selectedMood);
  const checkinData = useStore(s => s.checkinData);
  const endRef = useAutoScroll(`${messages.length}-${isTyping}`);
  const empty = messages.length === 0;
  const greeting = useMemo(() => getTimeGreeting(userName), [userName]);

  return (
    <div className="chat-scroll">
      {empty ? (
        <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", textAlign: "center" }}>
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.55, ease: "easeOut" }}>
            <HavenLogo size={54} />
          </motion.div>
          <AnimatedHeading text={greeting} />
          <div style={{ marginTop: 12, marginBottom: 24, minHeight: 28 }}>
            <Affirmation />
          </div>

          <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <MotivationalMessage mood={selectedMood} checkinData={checkinData} />
            <DailyQuoteCard />
            <MoodBar />
            <SuggestionChips onPick={onPickSuggestion} />
          </div>
        </div>
      ) : (
        <div style={{ padding: "24px 32px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            <AnimatePresence initial={false}>
              {messages.map(m => <MessageBubble key={m.id} msg={m} onSave={(content) => onSave(content)} />)}
            </AnimatePresence>
            {isTyping && <TypingIndicator />}
            <div ref={endRef} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHAT INPUT
═══════════════════════════════════════════════ */
function ChatInput({ onSend, disabled }) {
  const input = useStore(s => s.input);
  const setInput = useStore(s => s.setInput);
  const taRef = useRef(null);
  const [sparkles, setSparkles] = useState([]);
  const [phIdx, setPhIdx] = useState(0);
  useAutoResize(taRef, input);

  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const fireSpark = () => {
    const base = Date.now();
    const items = Array.from({ length: 7 }, (_, i) => ({
      id: base + i,
      sx: `${(Math.random() - 0.5) * 48}px`,
      sy: `${-(20 + Math.random() * 28)}px`,
    }));
    setSparkles(s => [...s, ...items]);
    setTimeout(() => setSparkles(s => s.filter(x => x.id < base || x.id >= base + 7)), 750);
  };

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    fireSpark();
    onSend();
  };

  return (
    <div className="input-bar">
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: 12, borderRadius: 24, border: "1px solid var(--border)", background: "var(--panel)", padding: "12px 16px", boxShadow: "0 4px 28px rgba(0,0,0,0.32)" }}>
        <textarea ref={taRef} value={input} rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={PLACEHOLDERS[phIdx]}
          style={{ flex: 1, resize: "none", background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, lineHeight: 1.55, minHeight: 26, maxHeight: 160, padding: "2px 0", fontFamily: "inherit" }} />
        <button onClick={handleSend} disabled={disabled}
          style={{ position: "relative", width: 42, height: 42, borderRadius: 14, flexShrink: 0, border: "1px solid var(--border)", background: "rgba(90,138,110,0.18)", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 180ms", opacity: disabled ? 0.45 : 1 }}>
          {sparkles.map(sp => (
            <span key={sp.id} className="sparkle-pt" style={{ "--sx": sp.sx, "--sy": sp.sy }}>✦</span>
          ))}
          <Send size={17} />
        </button>
      </div>
      <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted-2)", margin: "8px auto 0", maxWidth: 720 }}>
        Haven is here for you · Not a substitute for professional care
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════════ */
function TopBar({ intention, messages, onBreathing, onReflect, isPending }) {
  const setActivePanel = useStore(s => s.setActivePanel);

  const sessionReflection = useStore(s => s.sessionReflection);
  const hasMessages = messages.length > 0;

  return (
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "12px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--muted)" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--sage)", boxShadow: "0 0 0 5px rgba(90,138,110,0.12)", display: "inline-block", flexShrink: 0 }} />
        <span>Haven is here with you</span>
        {intention && (
          <span style={{ marginLeft: 4, padding: "2px 10px", borderRadius: 999, fontSize: 11, background: "rgba(90,138,110,0.11)", border: "1px solid rgba(90,138,110,0.24)", color: "var(--sage)" }}>
            {intention.icon} {intention.label}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {hasMessages && (
          <button onClick={onReflect} title="Session Reflection"
            style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "inherit" }}>
            <Star size={13} /> Reflect
          </button>
        )}
        <button onClick={onBreathing} title="Breathing Exercise"
          style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wind size={15} />
        </button>
        <button onClick={() => setActivePanel("analytics")} title="Mood Analytics"
          style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart2 size={15} />
        </button>
        <button onClick={() => setActivePanel("memories")} title="Memories & Saved"
          style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bookmark size={15} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
function Sidebar({ onNew }) {
  const history = useStore(s => s.history);
  const active = useStore(s => s.activeSession);
  const setActive = useStore(s => s.setActiveSession);
  const streak = useStore(s => s.streak);
  const moodLog = useStore(s => s.moodLog);
  const userName = useStore(s => s.userName);
  const totalCheckins = useStore(s => s.totalCheckins);
  const setActivePanel = useStore(s => s.setActivePanel);
  const deleteSession = useStore(s => s.deleteSession);
  // Group history by category
  const grouped = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    history.forEach(item => {
      const cat = item.category || "Earlier";
      if (groups[cat]) groups[cat].push(item);
    });
    return groups;
  }, [history]);

  return (
    <aside className="sidebar-desktop" style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", height: "100vh", borderRight: "1px solid var(--border)", background: "var(--sidebar)", padding: "16px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16 }}>
        <HavenLogo size={34} />
        <span style={{ fontSize: 18, fontWeight: 400, fontFamily: "Fraunces,serif", color: "var(--text)" }}>Haven</span>
      </div>

      <div className="streak">🌱 Day {streak} of checking in</div>

      <MoodSparkline log={moodLog} />

      <GardenWidget totalCheckins={totalCheckins} onClick={() => setActivePanel("garden")} />

      <button onClick={onNew} className="hover-lift"
        style={{ margin: "14px 0 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", padding: "11px", fontSize: 13, color: "var(--text)", cursor: "pointer", fontFamily: "inherit" }}>
        <Plus size={15} /> New session
      </button>

      <div className="sidebar-scroll" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, paddingRight: 2 }}>
        {Object.entries(grouped).map(([cat, items]) => items.length === 0 ? null : (
          <div key={cat}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted-2)", padding: "8px 0 4px 2px" }}>
              {cat}
            </div>
            {items.map(item => {
              const isAct = active === item.id;
              return (
                <div key={item.id}
  style={{ display: "flex", alignItems: "center", borderRadius: 10, border: `1px solid ${isAct ? "rgba(90,138,110,0.38)" : "transparent"}`, background: isAct ? "rgba(90,138,110,0.13)" : "transparent", transition: "all 140ms", width: "100%", overflow: "hidden" }}
  onMouseEnter={e => { const btn = e.currentTarget.querySelector(".del-btn"); if(btn) btn.style.opacity = "1"; }}
  onMouseLeave={e => { const btn = e.currentTarget.querySelector(".del-btn"); if(btn) btn.style.opacity = "0"; }}>
  <button onClick={() => setActive(item.id)}
    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", textAlign: "left", fontSize: 12, cursor: "pointer", color: isAct ? "var(--text)" : "var(--muted)", fontFamily: "inherit", background: "none", border: "none", minWidth: 0 }}>
    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
  </button>
  <button className="del-btn" onClick={(e) => { e.stopPropagation(); deleteSession(item.id); }}
    style={{ opacity: 0, flexShrink: 0, background: "none", border: "none", color: "var(--muted-2)", cursor: "pointer", padding: "8px 6px", display: "flex", alignItems: "center", transition: "opacity 140ms" }}>
    <Trash2 size={12} />
  </button>
</div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", gap: 6 }}>
        <button onClick={() => setActivePanel("settings")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", padding: "9px", color: "var(--muted)", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
          <Settings size={13} /> Settings
        </button>
        <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 8, borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", padding: "8px 10px" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: "rgba(90,138,110,0.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}>
            <User size={12} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName || "You"}</div>
            <div style={{ fontSize: 10, color: "var(--muted-2)" }}>Private</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════ */
export default function App() {
  const theme = useMemo(getTimeTheme, []);
  const {
    messages, input, setInput, addMessage, setTyping,
    clearConversation, saveSession, hydrate,
    persistName, persistStreak, persistMoodLog, persistTone,
    userName, preferredTone, intention, showIntention, setIntention, setShowIntention,
    saveAdvice, removeSaved, savedAdvice, memories, addMemory, editMemory, removeMemory,
    selectedMood, setCheckinData, checkinData, setSessionReflection, sessionReflection,
    streak, moodLog, totalCheckins, activePanel, setActivePanel,
  } = useStore();

  const [showNameSetup, setShowNameSetup] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => {
    hydrate();
    const seen = localStorage.getItem("haven-seen");
    if (!seen) { setShowNameSetup(true); localStorage.setItem("haven-seen", "1"); }
    else { setShowIntention(true); }
    persistStreak();

    // Show daily check-in
    const lastCheckin = localStorage.getItem("haven-last-checkin");
    const today = new Date().toDateString();
    if (lastCheckin !== today) {
      setTimeout(() => setShowCheckin(true), 2000);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: ({ msg }) => fetchReply(msg),
    onSuccess: (data) => {
      setTyping(false);
      const reply = data.bot_reply ?? "I'm here with you.";
      addMessage({ id: crypto.randomUUID(), role: "haven", content: reply, timestamp: new Date() });
      const title = reply.slice(0, 34).trim();
      saveSession(title || "New session");
      persistMoodLog();
      // Auto-save memory if notable
      if (reply.length > 80 && Math.random() < 0.15) {
        const snippet = reply.split(".")[0].trim();
        if (snippet.length > 20) addMemory(snippet);
      }
    },
    onError: () => {
      setTyping(false);
      addMessage({ id: crypto.randomUUID(), role: "haven", content: "I'm having trouble connecting right now. Please try again in a moment.", timestamp: new Date() });
    },
  });

  const sendMessage = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;
    addMessage({ id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() });
    setInput("");
    setTyping(true);
    mutation.mutate({ msg: text });
  };

  const handleNameDone = (name) => {
    persistName(name);
    setShowNameSetup(false);
    setShowIntention(true);
  };

  const handleCheckinDone = (answers) => {
    setCheckinData(answers);
    setShowCheckin(false);
    localStorage.setItem("haven-last-checkin", new Date().toDateString());
  };

  const handleReflect = () => {
    const userMsgs = messages.filter(m => m.role === "user");
    const havenMsgs = messages.filter(m => m.role === "haven");
    const reflection = {
      summary: `You explored ${userMsgs.length} thoughts in this session. Haven offered ${havenMsgs.length} responses.`,
      strengths: "You showed willingness to reflect and engage. That openness is a form of courage.",
      themes: messages.length > 0 ? ["Self-reflection", "Emotional awareness", "Growth"] : [],
    };
    setSessionReflection(reflection);
    setShowReflection(true);
  };

  return (
    <div className="app-shell">
      <style>{buildStyles(theme, selectedMood)}</style>
      <AmbientBackground theme={theme} />

      <AnimatePresence>
        {showNameSetup && <NameSetup key="name" onDone={handleNameDone} />}
        {!showNameSetup && showIntention && <IntentionModal key="intent" onDone={setIntention} />}
        {showCheckin && !showNameSetup && !showIntention && (
          <CheckInModal key="checkin" onDone={handleCheckinDone} onSkip={() => setShowCheckin(false)} />
        )}
        {showBreathing && <BreathingModal key="breathing" onClose={() => setShowBreathing(false)} />}
        {showReflection && sessionReflection && (
          <ReflectionModal key="reflect" reflection={sessionReflection} onClose={() => setShowReflection(false)} />
        )}
      </AnimatePresence>

      {/* Side panels */}
      <AnimatePresence>
        {activePanel === "garden" && (
          <GardenPanel key="garden" totalCheckins={totalCheckins} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "analytics" && (
          <AnalyticsPanel key="analytics" moodLog={moodLog} streak={streak} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "memories" && (
          <MemoryPanel key="memories" memories={memories} savedAdvice={savedAdvice}
            onClose={() => setActivePanel(null)}
            onEditMemory={editMemory} onDeleteMemory={removeMemory} onDeleteSaved={removeSaved} />
        )}
        {activePanel === "settings" && (
          <SettingsPanel key="settings" userName={userName} preferredTone={preferredTone}
            onClose={() => setActivePanel(null)}
            onSaveName={persistName} onSaveTone={persistTone} />
        )}
      </AnimatePresence>

      <div className="layout-root" style={{ background: "transparent" }}>
        <Sidebar onNew={clearConversation} />
        <main className="main-col" style={{ background: "transparent" }}>
          <TopBar intention={intention} messages={messages}
            onBreathing={() => setShowBreathing(true)}
            onReflect={handleReflect}
            isPending={mutation.isPending} />
          <ChatWindow onPickSuggestion={(t) => setInput(t)} onSave={(content) => saveAdvice(content)} />
          <ChatInput onSend={sendMessage} disabled={mutation.isPending} />
        </main>
      </div>
    </div>
  );
}
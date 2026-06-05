"use client";

/**
 * sound.ts — tiny synthesized sound-effects engine (Web Audio API).
 * No audio files: every effect is generated from oscillators, so it's instant
 * and zero-weight. Honors a persisted mute toggle and the browser autoplay
 * policy (the context resumes on the first user gesture).
 */

type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number };
export type SoundName =
  | "click"
  | "build"
  | "research"
  | "bill"
  | "trees"
  | "error"
  | "story"
  | "civic"
  | "win"
  | "lose"
  | "reveal";

const MUTE_KEY = "carbon-cleaner-muted";

let ctx: AudioContext | null = null;
let muted = false;
const listeners = new Set<(m: boolean) => void>();

if (typeof window !== "undefined") {
  muted = localStorage.getItem(MUTE_KEY) === "1";
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function playNote(ac: AudioContext, master: GainNode, n: Note) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = n.type ?? "sine";
  osc.frequency.value = n.f;
  const start = ac.currentTime + n.t;
  const peak = n.g ?? 0.18;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + n.d + 0.02);
}

// Each effect is a small score. Times/durations in seconds.
const SCORES: Record<SoundName, Note[]> = {
  click: [{ f: 660, t: 0, d: 0.06, type: "triangle", g: 0.12 }],
  build: [
    { f: 523, t: 0, d: 0.12, type: "sine" },
    { f: 784, t: 0.08, d: 0.16, type: "sine" },
  ],
  research: [
    { f: 523, t: 0, d: 0.12, type: "triangle" },
    { f: 659, t: 0.09, d: 0.12, type: "triangle" },
    { f: 988, t: 0.18, d: 0.2, type: "triangle" },
  ],
  bill: [
    { f: 392, t: 0, d: 0.14, type: "square", g: 0.1 },
    { f: 523, t: 0.1, d: 0.2, type: "sine" },
  ],
  trees: [
    { f: 587, t: 0, d: 0.1, type: "sine" },
    { f: 880, t: 0.07, d: 0.18, type: "sine", g: 0.14 },
  ],
  error: [
    { f: 220, t: 0, d: 0.16, type: "sawtooth", g: 0.12 },
    { f: 150, t: 0.1, d: 0.2, type: "sawtooth", g: 0.12 },
  ],
  story: [
    { f: 660, t: 0, d: 0.18, type: "sine", g: 0.1 },
    { f: 880, t: 0.12, d: 0.25, type: "sine", g: 0.1 },
  ],
  civic: [
    { f: 659, t: 0, d: 0.12, type: "triangle" },
    { f: 880, t: 0.1, d: 0.12, type: "triangle" },
    { f: 1175, t: 0.2, d: 0.22, type: "triangle" },
  ],
  win: [
    { f: 523, t: 0, d: 0.16, type: "sine" },
    { f: 659, t: 0.12, d: 0.16, type: "sine" },
    { f: 784, t: 0.24, d: 0.16, type: "sine" },
    { f: 1047, t: 0.36, d: 0.4, type: "sine", g: 0.2 },
  ],
  lose: [
    { f: 440, t: 0, d: 0.2, type: "sine" },
    { f: 349, t: 0.18, d: 0.22, type: "sine" },
    { f: 262, t: 0.38, d: 0.5, type: "sine", g: 0.16 },
  ],
  reveal: [
    { f: 392, t: 0, d: 0.2, type: "sine" },
    { f: 587, t: 0.16, d: 0.2, type: "sine" },
    { f: 784, t: 0.32, d: 0.22, type: "sine" },
    { f: 1175, t: 0.5, d: 0.5, type: "sine", g: 0.2 },
  ],
};

export function playSound(name: SoundName) {
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  const master = ac.createGain();
  master.gain.value = 0.5;
  master.connect(ac.destination);
  for (const n of SCORES[name]) playNote(ac, master, n);
}

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  if (typeof window !== "undefined") localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  listeners.forEach((l) => l(m));
}

export function toggleMuted() {
  setMuted(!muted);
  if (!muted) playSound("click");
}

export function subscribeMuted(fn: (m: boolean) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

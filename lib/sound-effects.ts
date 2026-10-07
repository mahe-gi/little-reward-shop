// Clean Web Audio API sound effects for Ludo (zero external assets, zero latency, offline-ready)

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem("pairly_ludo_sound");
  if (saved !== null) {
    soundEnabled = saved === "true";
  }
  return soundEnabled;
}

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("pairly_ludo_sound", String(soundEnabled));
  }
  if (soundEnabled) {
    playStepSound();
  }
  return soundEnabled;
}

/**
 * Dice shaking & clatter rattle sound
 */
export function playDiceRollSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Create rapid clicks/rattles simulating tumbling dice
  const rattleCount = 6;
  for (let i = 0; i < rattleCount; i++) {
    const t = now + i * 0.045 + Math.random() * 0.015;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(180 + Math.random() * 260, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Final solid dice thud landing
  const finalTime = now + 0.32;
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();

  thudOsc.type = "sine";
  thudOsc.frequency.setValueAtTime(140, finalTime);
  thudOsc.frequency.exponentialRampToValueAtTime(45, finalTime + 0.08);

  thudGain.gain.setValueAtTime(0.25, finalTime);
  thudGain.gain.exponentialRampToValueAtTime(0.001, finalTime + 0.08);

  thudOsc.connect(thudGain);
  thudGain.connect(ctx.destination);

  thudOsc.start(finalTime);
  thudOsc.stop(finalTime + 0.08);
}

/**
 * Crisp woodblock / marimba hop sound for each tile step
 */
export function playStepSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.06);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}

/**
 * Dramatic strike / capture sound when a token is knocked out
 */
export function playCaptureSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Impact strike
  const strikeOsc = ctx.createOscillator();
  const strikeGain = ctx.createGain();

  strikeOsc.type = "sawtooth";
  strikeOsc.frequency.setValueAtTime(320, now);
  strikeOsc.frequency.exponentialRampToValueAtTime(60, now + 0.22);

  strikeGain.gain.setValueAtTime(0.3, now);
  strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  strikeOsc.connect(strikeGain);
  strikeGain.connect(ctx.destination);

  strikeOsc.start(now);
  strikeOsc.stop(now + 0.22);

  // Secondary resonance
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();

  subOsc.type = "triangle";
  subOsc.frequency.setValueAtTime(180, now + 0.05);
  subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

  subGain.gain.setValueAtTime(0.25, now + 0.05);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);

  subOsc.start(now + 0.05);
  subOsc.stop(now + 0.25);
}

/**
 * Uplifting chime when a token reaches the Home Triangle
 */
export function playHomeSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, idx) => {
    const t = now + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  });
}

/**
 * Triumphant fanfare when a player wins the match
 */
export function playVictorySound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const melody = [
    { freq: 440.0, time: 0, dur: 0.12 },     // A4
    { freq: 554.37, time: 0.14, dur: 0.12 }, // C#5
    { freq: 659.25, time: 0.28, dur: 0.15 }, // E5
    { freq: 880.0, time: 0.46, dur: 0.45 },  // A5
  ];

  melody.forEach((note) => {
    const t = now + note.time;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(note.freq, t);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + note.dur);
  });
}

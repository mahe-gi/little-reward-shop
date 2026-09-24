/**
 * Tactile Haptic Feedback Engine for Pairly
 *
 * Utilizes the Web Vibration API (navigator.vibrate) to deliver micro-tactile
 * feedback on mobile devices for tab switches, task completions, and Daily Spark unlocks.
 * Fails gracefully and silently on unsupported platforms (e.g. desktop).
 */

export type HapticStyle =
  | "selection"
  | "light"
  | "medium"
  | "success"
  | "sparkUnlock"
  | "heartbeat"
  | "warning"
  | "error";

const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  /** Crisp 8ms micro-tick for tab changes & switches */
  selection: 8,

  /** 15ms light tap for secondary actions (e.g., question shuffle) */
  light: 15,

  /** 25ms solid tactile confirmation for input lock-in */
  medium: 25,

  /** Double-tap pulse [20ms, 50ms pause, 30ms] for habit/task completion */
  success: [20, 50, 30],

  /** Celebratory rhythmic burst [35ms, 60ms pause, 45ms, 60ms pause, 90ms] for Daily Spark Blind Reveal */
  sparkUnlock: [35, 60, 45, 60, 90],

  /** Synchronized lub-dub cardiac rhythm [60ms, 70ms pause, 100ms] for ThumbKiss */
  heartbeat: [60, 70, 100],

  /** Dual vibration for cautions */
  warning: [30, 40, 30],

  /** Triple rejection buzz for errors */
  error: [40, 40, 40, 40, 60],
};

/**
 * Triggers a device vibration according to the requested tactile pattern.
 * Safe to call in any environment (SSR, desktop, iOS Safari without vibration support).
 */
export function triggerHaptic(style: HapticStyle = "selection"): boolean {
  if (typeof window === "undefined") return false;

  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      const pattern = HAPTIC_PATTERNS[style];
      return navigator.vibrate(pattern);
    }
  } catch {
    // Suppress browser permission / hardware denial errors gracefully
  }

  return false;
}

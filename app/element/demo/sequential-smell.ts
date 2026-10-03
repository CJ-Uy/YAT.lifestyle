/** Persisted cursor and wall-clock deadline for one-at-a-time scent tests. */
export type SmellSequence = { index: number; deadline?: number };

export const INTENSITY_PAUSE_SECONDS = 5;
export const BASE_PAUSE_SECONDS = 15;

export function normaliseSequence(value: unknown, count: number): SmellSequence {
  const candidate = value as Partial<SmellSequence> | null;
  const index = typeof candidate?.index === "number" && Number.isInteger(candidate.index)
    ? Math.max(0, Math.min(count - 1, candidate.index)) : 0;
  const deadline = typeof candidate?.deadline === "number" && Number.isFinite(candidate.deadline) && candidate.deadline >= 0
    ? candidate.deadline : undefined;
  return { index, ...(index > 0 && index < count && deadline !== undefined ? { deadline } : {}) };
}

export function gapSeconds(sequence: SmellSequence, now: number): number {
  return sequence.deadline === undefined ? 0 : Math.max(0, Math.ceil((sequence.deadline - now) / 1000));
}

export function canAdvanceSequence(sequence: SmellSequence, answered: boolean[], now: number): boolean {
  const last = Math.min(sequence.index, answered.length - 1);
  return answered.length > 0 && gapSeconds(sequence, now) === 0 && answered.slice(0, last + 1).every(Boolean);
}

/** A gap begins only after a deliberate Next; there is no gap after the final vial. */
export function advanceSequence(sequence: SmellSequence, answered: boolean[], pauseSeconds: number, now: number): SmellSequence {
  if (!canAdvanceSequence(sequence, answered, now)) return sequence;
  const index = Math.min(answered.length, sequence.index + 1);
  return index < answered.length ? { index, deadline: now + pauseSeconds * 1000 } : { index };
}

/** Revisiting a vial preserves answers, clears that gap, and makes the next departure start a fresh gap. */
export function previousInSequence(sequence: SmellSequence): SmellSequence {
  return { index: Math.max(0, sequence.index - 1) };
}

export function skipDemoGap(sequence: SmellSequence, mode: "sample" | "kit", now: number): SmellSequence {
  return mode === "sample" ? { ...sequence, deadline: now } : sequence;
}

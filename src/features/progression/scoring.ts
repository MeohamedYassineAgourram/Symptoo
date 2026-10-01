import progression from '../../config/progression.json';

const C = progression.consultation;
const G = progression.gardeRapide;

/** Streak/combo multiplier: +step per consecutive correct answer before this one, capped. */
export function streakMultiplier(previousCorrect: number, step = C.streakStep, cap = C.streakCap): number {
  return Math.min(cap, 1 + Math.max(0, previousCorrect) * step);
}

export interface PatientScoreInput {
  syndromeCorrect: boolean;
  etiologyCorrect: boolean;
  /** Exam/history actions that were key findings. */
  keyActions: number;
  /** All exam/history actions taken. */
  totalActions: number;
  /** Consecutive correct patients before this one. */
  streak: number;
}

/**
 * Score for one Consultation patient (README §5.2):
 * (base × accuracy + efficiency bonus) × streak multiplier.
 * A wrong diagnosis gives a small flat score and no multipliers.
 */
export function scorePatient(input: PatientScoreInput): number {
  if (!input.syndromeCorrect) return C.wrongDiagnosisScore;
  const accuracy = 1 + (input.etiologyCorrect ? C.etiologyBonus : 0);
  const efficiency = input.totalActions > 0 ? Math.min(1, input.keyActions / input.totalActions) : 0;
  const bonus = Math.round(C.efficiencyBonusMax * efficiency);
  return Math.round((C.base * accuracy + bonus) * streakMultiplier(input.streak));
}

/** Points for one Garde rapide answer given the current combo (correct answers in a row before it). */
export function scoreSpeedAnswer(correct: boolean, combo: number): number {
  if (!correct) return 0;
  return Math.round(G.pointsPerCorrect * streakMultiplier(combo, G.comboStep, G.comboCap));
}

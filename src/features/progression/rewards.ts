import progression from '../../config/progression.json';
import type { ClinicalCase } from '../../content/schemas';
import { ZONES } from '../../content/zones';
import type { RunnerState } from '../consultation/caseRunner';
import type { Stats } from './achievements';

const R = progression.rewards;

export interface Gain {
  xp: number;
  dh: number;
}

export interface PatientOutcomeLite {
  score: number;
  syndrome: 'correct' | 'partial' | 'wrong';
}

export function consultationGain(outcomes: readonly PatientOutcomeLite[]): Gain {
  const score = outcomes.reduce((a, o) => a + o.score, 0);
  const dh = outcomes.reduce((a, o) => a + (o.syndrome === 'correct' ? R.consultation.dhCorrect : o.syndrome === 'partial' ? R.consultation.dhPartial : 0), 0);
  return { xp: Math.round(score * R.consultation.xpPerScorePoint), dh };
}

export function gardeRapideGain(correct: number): Gain {
  return { xp: correct * progression.gardeRapide.xpPerCorrect, dh: Math.floor(correct * R.gardeRapide.dhPerCorrect) };
}

export function quiSuisJeGain(points: number, found: number): Gain {
  return { xp: Math.round(points * R.quiSuisJe.xpPerPoint), dh: found * R.quiSuisJe.dhPerFound };
}

export function memoGain(pairs: number, perfect: boolean): Gain {
  return { xp: pairs * R.memo.xpPerPair + (perfect ? R.memo.perfectBonusXp : 0), dh: R.memo.dhPerBoard };
}

export const VISITE_BONUS: Gain = { xp: R.visite.bonusXp, dh: R.visite.bonusDh };

/** Stats earned by one diagnosed patient (feeds achievements such as « Œil de lynx »). */
export function consultationStats(c: ClinicalCase, r: RunnerState, at: Date): Partial<Stats> {
  const res = r.result;
  if (!res) return {};
  const correct = res.synthesis.syndrome === 'correct';
  const keyExam = (i: number) => c.exam[i]!.key;
  const ictere = c.patient.appearance.visibleSigns.includes('ictere');
  const ictereZone = (z: string) => z === 'general' || z === 'peau' || z.startsWith('tete-');
  return {
    patients: 1,
    correctDiagnoses: correct ? 1 : 0,
    ictereInspections: ictere ? r.actions.filter((a) => a.tool === 'inspection' && ictereZone(a.zone)).length : 0,
    abdominalKeyFindings: r.actions.filter((a) => ZONES.get(a.zone)?.root === 'abdomen' && a.findings.some(keyExam)).length,
    auscultationKeyFindings: r.actions.filter((a) => a.tool === 'auscultation' && a.findings.some(keyExam)).length,
    noNetDiagnoses: correct && res.totalActions > 0 && res.keyActions === res.totalActions ? 1 : 0,
    nightGardes: at.getHours() >= 22 || at.getHours() < 5 ? 1 : 0,
  };
}

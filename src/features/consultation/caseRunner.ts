import type { ClinicalCase } from '../../content/schemas';
import { isDescendant, toolsForZone, ZONES, zoneMatches, type Tool } from '../../content/zones';
import progression from '../../config/progression.json';
import type { Quality } from '../srs/engine';
import { scorePatient } from '../progression/scoring';
import { gradeSynthesis, type SynthesisAnswer, type SynthesisGrade } from './synthesis';

/**
 * Consultation state machine (README §10.2): arrival → interrogatoire ⇄ examen ⇄ synthèse → feedback.
 * Pure: the 3D layer and the UI only render this state and dispatch events.
 */
export type Phase = 'arrival' | 'interrogatoire' | 'examen' | 'synthese' | 'feedback';
export type WorkPhase = 'interrogatoire' | 'examen' | 'synthese';

const C = progression.consultation;

export interface ExamAction {
  zone: string;
  tool: Tool;
  /** Indices into case.exam revealed by this action (empty = normal examination). */
  findings: number[];
  minutes: number;
}

export interface KeyReview {
  kind: 'history' | 'exam';
  index: number;
  found: boolean;
}

export interface CaseResult {
  answer: SynthesisAnswer;
  synthesis: SynthesisGrade;
  keys: KeyReview[];
  keyActions: number;
  totalActions: number;
  minutes: number;
  score: number;
  quality: Quality;
}

export interface RunnerState {
  caseId: string;
  phase: Phase;
  /** In-game clock, minutes since midnight. */
  clock: number;
  startClock: number;
  /** History indices in the order asked. */
  asked: number[];
  actions: ExamAction[];
  /** Exam finding indices revealed so far (unique, in order). */
  revealed: number[];
  /** Last exam action, incl. repeats, for the UI card and the doctor animation. */
  lastExam: (ExamAction & { seq: number; repeat: boolean }) | null;
  result: CaseResult | null;
}

export type RunnerEvent =
  | { type: 'BEGIN' }
  | { type: 'GO'; phase: WorkPhase }
  | { type: 'ASK'; index: number }
  | { type: 'EXAMINE'; zone: string; tool: Tool }
  | { type: 'SUBMIT'; answer: SynthesisAnswer; streak: number };

export function createRunner(c: ClinicalCase, clock: number = C.clockStart): RunnerState {
  return { caseId: c.id, phase: 'arrival', clock, startClock: clock, asked: [], actions: [], revealed: [], lastExam: null, result: null };
}

/** Does a finding written for `pattern` apply to the zone the player examined? */
export function findingApplies(pattern: string, zoneId: string): boolean {
  return zoneMatches(pattern, zoneId) || isDescendant(zoneId, pattern);
}

export function findingsFor(c: ClinicalCase, zone: string, tool: Tool): number[] {
  return c.exam.flatMap((f, i) => (f.tool === tool && findingApplies(f.zone, zone) ? [i] : []));
}

const working = (p: Phase) => p === 'interrogatoire' || p === 'examen' || p === 'synthese';

export function runnerReducer(state: RunnerState, event: RunnerEvent, c: ClinicalCase): RunnerState {
  switch (event.type) {
    case 'BEGIN':
      return state.phase === 'arrival' ? { ...state, phase: 'interrogatoire' } : state;

    case 'GO':
      return working(state.phase) ? { ...state, phase: event.phase } : state;

    case 'ASK': {
      const item = c.history[event.index];
      if (!working(state.phase) || !item || state.asked.includes(event.index)) return state;
      const minutes = item.irrelevant ? C.irrelevantMinutes : C.questionMinutes;
      return { ...state, asked: [...state.asked, event.index], clock: state.clock + minutes };
    }

    case 'EXAMINE': {
      if (!working(state.phase) || !ZONES.has(event.zone) || !toolsForZone(event.zone).includes(event.tool)) return state;
      const seq = (state.lastExam?.seq ?? 0) + 1;
      const previous = state.actions.find((a) => a.zone === event.zone && a.tool === event.tool);
      if (previous) return { ...state, lastExam: { ...previous, seq, repeat: true } };
      const findings = findingsFor(c, event.zone, event.tool);
      const irrelevant = findings.some((i) => c.exam[i]!.irrelevant);
      const minutes = irrelevant ? C.irrelevantMinutes : C.examMinutes;
      const action: ExamAction = { zone: event.zone, tool: event.tool, findings, minutes };
      const revealed = [...state.revealed, ...findings.filter((i) => !state.revealed.includes(i))];
      return {
        ...state,
        actions: [...state.actions, action],
        revealed,
        clock: state.clock + minutes,
        lastExam: { ...action, seq, repeat: false },
      };
    }

    case 'SUBMIT': {
      if (!working(state.phase)) return state;
      const result = evaluate(state, c, event.answer, event.streak);
      return { ...state, phase: 'feedback', result };
    }
  }
}

/** Grades a submitted diagnosis: key signs found/missed, score (README §5.2) and SM-2 quality (§7.1). */
export function evaluate(state: RunnerState, c: ClinicalCase, answer: SynthesisAnswer, streak: number): CaseResult {
  const synthesis = gradeSynthesis(c, answer);
  const keys: KeyReview[] = [
    ...c.history.flatMap((h, i) => (h.key ? [{ kind: 'history' as const, index: i, found: state.asked.includes(i) }] : [])),
    ...c.exam.flatMap((f, i) => (f.key ? [{ kind: 'exam' as const, index: i, found: state.revealed.includes(i) }] : [])),
  ];
  const keyActions =
    state.asked.filter((i) => c.history[i]!.key).length + state.actions.filter((a) => a.findings.some((i) => c.exam[i]!.key)).length;
  const totalActions = state.asked.length + state.actions.length;
  const minutes = state.clock - state.startClock;
  const syndromeCorrect = synthesis.syndrome === 'correct';
  const score = answer.gaveUp
    ? 0
    : scorePatient({ syndromeCorrect, etiologyCorrect: synthesis.etiology === 'correct', keyActions, totalActions, streak });
  return { answer, synthesis, keys, keyActions, totalActions, minutes, score, quality: qualityFor(synthesis, answer, keyActions, totalActions, minutes) };
}

export function qualityFor(s: SynthesisGrade, answer: SynthesisAnswer, keyActions: number, totalActions: number, minutes: number): Quality {
  if (answer.gaveUp) return 0;
  if (s.syndrome === 'wrong') return 1;
  if (s.syndrome === 'partial') return 2;
  if (s.etiology === 'wrong') return 3;
  const efficient = totalActions > 0 && keyActions / totalActions >= C.efficientRatio;
  return efficient && minutes <= C.fastMinutes ? 5 : 4;
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

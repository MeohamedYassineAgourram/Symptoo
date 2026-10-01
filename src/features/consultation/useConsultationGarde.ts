import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { allCases, practiceCases } from '../../content';
import type { ClinicalCase } from '../../content/schemas';
import type { WingId } from '../../content/wings';
import { rootOf } from '../../content/zones';
import progression from '../../config/progression.json';
import srsConfig from '../../config/srs.json';
import { applyReviews, clearGarde, loadGarde, loadSrsStates, saveGarde } from '../../db/repositories';
import { useProgress } from '../../stores/progressStore';
import { useFinishSession } from '../progression/useFinishSession';
import { consultationGain, consultationStats, VISITE_BONUS } from '../progression/rewards';
import { mergeStats, EMPTY_STATS, type Stats } from '../progression/achievements';
import { unlockedWings } from '../progression/unlocks';
import type { RewardSummary } from '../progression/applyEvent';
import type { ReviewEntry } from '../../db/db';
import { useSettings } from '../../stores/settingsStore';
import { useSceneStore, type ZoneHighlight } from '../../stores/sceneStore';
import { toDayString } from '../../utils/dates';
import { buildSession, type SessionSlot } from '../srs/session';
import { createRunner, runnerReducer, type RunnerEvent, type RunnerState } from './caseRunner';
import type { SynthesisAnswer } from './synthesis';

const casesById = new Map(allCases.map((c) => [c.id, c]));
const C = progression.consultation;
/** Minutes between two patients on the garde clock. */
const HANDOVER_MINUTES = 5;

export interface PatientOutcome {
  caseId: string;
  score: number;
  correct: boolean;
  syndrome: 'correct' | 'partial' | 'wrong';
  quality: number;
  /** First time this patient was seen (for the report's « nouveaux items »). */
  isNew: boolean;
  missed: string[];
  given: string;
}

export type ConsultMode = 'consultation' | 'visite';

/** Everything needed to resume a garde on the same patient (README §9 UX rules). */
export interface ConsultGarde {
  version: 2;
  slots: SessionSlot[];
  index: number;
  runner: RunnerState;
  outcomes: PatientOutcome[];
  streak: number;
  notes: Record<string, string>;
  stats: Partial<Stats>;
  startedAt: number;
  finished: boolean;
}

export type SaveState = 'idle' | 'saved' | 'error';

/** Per-root feedback highlight: any missed key sign in a zone makes it orange. */
export function highlightsFor(c: ClinicalCase, runner: RunnerState): Record<string, ZoneHighlight> | null {
  if (!runner.result) return null;
  const out: Record<string, ZoneHighlight> = {};
  for (const k of runner.result.keys) {
    if (k.kind !== 'exam') continue;
    const root = rootOf(c.exam[k.index]!.zone);
    if (!root) continue;
    if (!k.found) out[root] = 'missed';
    else if (out[root] !== 'missed') out[root] = 'found';
  }
  return out;
}

export interface GardeOptions {
  mode?: ConsultMode;
  /** Patients per garde (the Visite du matin has 5). */
  size?: number;
}

export function useConsultationGarde(wing: WingId | 'toutes', includeDrafts: boolean, opts: GardeOptions = {}) {
  const mode = opts.mode ?? 'consultation';
  const size = opts.size ?? C.gardeSize;
  const xp = useProgress((s) => s.progress.xp);
  const unlockAll = useSettings((s) => s.settings.unlockAll);
  const open = useMemo(() => new Set(unlockedWings(xp, unlockAll)), [xp, unlockAll]);
  const storageKey = mode === 'visite' ? `visite:${toDayString(new Date())}` : `consultation:${wing}`;
  // « Toutes les ailes » and the Visite du matin only use unlocked wings.
  const pool = useMemo(
    () => practiceCases(wing, includeDrafts).filter((c) => wing !== 'toutes' || open.has(c.wing as WingId)),
    [wing, includeDrafts, open],
  );
  const [garde, setGarde] = useState<ConsultGarde | null>(null);
  const [saved, setSaved] = useState<ConsultGarde | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<'room' | 'close'>('room');
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const setConsult = useSceneStore((s) => s.setConsult);
  const finishSession = useFinishSession();
  const [reward, setReward] = useState<RewardSummary | null>(null);
  const recorded = useRef(false);

  // Offer to resume an unfinished garde.
  useEffect(() => {
    let alive = true;
    loadGarde<ConsultGarde>(storageKey)
      .then((g) => alive && setSaved(g && g.version === 2 && !g.finished && g.slots.every((s) => casesById.has(s.itemId)) ? g : null))
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [storageKey]);

  const currentCase = garde ? casesById.get(garde.slots[garde.index]!.itemId)! : null;

  const start = useCallback(async () => {
    const today = toDayString(new Date());
    const ids = pool.map((c) => c.id);
    let states = new Map();
    try {
      states = await loadSrsStates(ids);
    } catch (e) {
      console.warn('[consultation] progress unavailable', e);
    }
    const introduced = [...states.values()].filter((s) => s.introducedOn === today).length;
    const slots = buildSession({
      itemIds: ids,
      states,
      today,
      size: Math.min(size, ids.length),
      newRemaining: srsConfig.maxNewCasesPerDay - introduced,
      mix: srsConfig.sessionMix,
      rng: Math.random,
    });
    if (!slots.length) return;
    recorded.current = false;
    setReward(null);
    setView('room');
    setGarde({
      version: 2,
      slots,
      index: 0,
      runner: createRunner(casesById.get(slots[0]!.itemId)!),
      outcomes: [],
      streak: 0,
      notes: {},
      stats: {},
      startedAt: Date.now(),
      finished: false,
    });
  }, [pool, size]);

  const resume = useCallback(() => {
    if (!saved) return;
    recorded.current = false;
    setView('room');
    setGarde(saved);
  }, [saved]);

  const dispatch = useCallback((event: RunnerEvent) => {
    setGarde((g) => {
      if (!g) return g;
      const c = casesById.get(g.slots[g.index]!.itemId)!;
      const runner = runnerReducer(g.runner, event.type === 'SUBMIT' ? { ...event, streak: g.streak } : event, c);
      if (runner === g.runner) return g;
      if (event.type === 'SUBMIT' && runner.result) {
        const res = runner.result;
        const correct = res.synthesis.syndrome === 'correct';
        const missed = res.keys
          .filter((k) => !k.found)
          .map((k) => (k.kind === 'history' ? c.history[k.index]!.a : c.exam[k.index]!.finding));
        const given = res.answer.gaveUp ? '' : [res.answer.syndromes.join(' + '), res.answer.etiology].filter(Boolean).join(' — ');
        return {
          ...g,
          runner,
          streak: correct ? g.streak + 1 : 0,
          stats: mergeStats({ ...EMPTY_STATS, ...g.stats } as Stats, consultationStats(c, runner, new Date())),
          outcomes: [
            ...g.outcomes,
            { caseId: c.id, score: res.score, correct, syndrome: res.synthesis.syndrome, quality: res.quality, isNew: g.slots[g.index]!.kind === 'new', missed, given },
          ],
        };
      }
      return { ...g, runner };
    });
  }, []);

  /** Submits the synthesis; the streak comes from the garde state inside the update. */
  const submit = useCallback((answer: SynthesisAnswer) => dispatch({ type: 'SUBMIT', answer, streak: 0 }), [dispatch]);

  const next = useCallback(() => {
    setActiveRoot(null);
    setView('room');
    setGarde((g) => {
      if (!g || g.runner.phase !== 'feedback') return g;
      if (g.index + 1 >= g.slots.length) return { ...g, finished: true };
      const c = casesById.get(g.slots[g.index + 1]!.itemId)!;
      return { ...g, index: g.index + 1, runner: createRunner(c, g.runner.clock + HANDOVER_MINUTES) };
    });
  }, []);

  const setNote = useCallback((caseId: string, text: string) => {
    setGarde((g) => (g ? { ...g, notes: { ...g.notes, [caseId]: text } } : g));
  }, []);

  const quit = useCallback(() => setGarde(null), []);

  // Persist after every change so leaving mid-garde resumes on the same patient.
  useEffect(() => {
    if (!garde) return;
    const save = garde.finished ? clearGarde(storageKey) : saveGarde(storageKey, garde);
    save.catch((e) => console.warn('[consultation] could not save garde', e));
  }, [garde, storageKey]);

  // SM-2 review as soon as a patient is diagnosed.
  const reviewedSeq = useRef<string | null>(null);
  useEffect(() => {
    if (!garde || !currentCase || !garde.runner.result) return;
    const key = `${garde.startedAt}-${garde.index}`;
    if (reviewedSeq.current === key) return;
    reviewedSeq.current = key;
    applyReviews({ [currentCase.id]: garde.runner.result.quality as 0 | 1 | 2 | 3 | 4 | 5 }, toDayString(new Date())).catch((e) =>
      console.warn('[consultation] could not save review', e),
    );
  }, [garde, currentCase]);

  // Session log, rewards and celebration at the end of the garde.
  const [saveState, setSaveState] = useState<SaveState>('idle');
  useEffect(() => {
    if (!garde?.finished || recorded.current) return;
    recorded.current = true;
    const o = garde.outcomes;
    const gain = consultationGain(o);
    const total = o.reduce((a, x) => a + x.score, 0);
    const durationSec = Math.round((Date.now() - garde.startedAt) / 1000);
    const review: ReviewEntry[] = o.map((x) => ({ itemId: x.caseId, quality: x.quality, missed: x.missed, given: x.given }));
    finishSession(
      { mode, wing, startedAt: garde.startedAt, durationSec, answered: o.length, correct: o.filter((x) => x.correct).length, score: total, bestCombo: 0, xpEarned: gain.xp, review },
      {
        xp: gain.xp,
        dh: gain.dh,
        patients: o.length,
        stats: {
          ...garde.stats,
          studySeconds: durationSec,
          bestGardeScore: total,
          ...(mode === 'visite' ? { visites: 1 } : { gardes: 1 }),
        },
        completesDay: mode === 'visite',
        bonus: mode === 'visite' ? VISITE_BONUS : undefined,
      },
    )
      .then((summary) => {
        setReward(summary);
        setSaveState('saved');
      })
      .catch((e) => {
        console.error('[consultation] could not save the garde', e);
        setSaveState('error');
      });
  }, [garde, wing, mode, finishSession]);

  // Mirror the current patient into the 3D room.
  useEffect(() => {
    if (!garde || !currentCase || garde.finished) {
      setConsult(null);
      return;
    }
    const r = garde.runner;
    const working = r.phase === 'interrogatoire' || r.phase === 'examen' || r.phase === 'synthese';
    setConsult({
      caseId: `${currentCase.id}-${garde.index}`,
      look: { ...currentCase.patient.appearance, sex: currentCase.patient.sex, age: currentCase.patient.age },
      view,
      hotspots: working,
      activeRoot: working ? activeRoot : null,
      action: r.lastExam ? { tool: r.lastExam.tool, root: rootOf(r.lastExam.zone) ?? 'general', seq: r.lastExam.seq } : null,
      highlights: highlightsFor(currentCase, r),
    });
  }, [garde, currentCase, view, activeRoot, setConsult]);

  useEffect(() => () => setConsult(null), [setConsult]);

  return {
    pool,
    loaded,
    saved,
    garde,
    currentCase,
    slot: garde ? garde.slots[garde.index]! : null,
    view,
    setView,
    activeRoot,
    setActiveRoot,
    saveState,
    reward,
    mode,
    start,
    resume,
    dispatch,
    submit,
    next,
    setNote,
    quit,
  };
}

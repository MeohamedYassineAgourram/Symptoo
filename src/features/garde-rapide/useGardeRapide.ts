import { useCallback, useEffect, useRef, useState } from 'react';
import { allCards, practiceCards } from '../../content';
import type { WingId } from '../../content/wings';
import progression from '../../config/progression.json';
import srsConfig from '../../config/srs.json';
import { applyReviews, countIntroducedToday, loadSrsStates, recordSession } from '../../db/repositories';
import { useProgress } from '../../stores/progressStore';
import { useSceneStore } from '../../stores/sceneStore';
import { toDayString } from '../../utils/dates';
import { buildSession, type SessionSlot } from '../srs/session';
import { createGarde, gardeReducer, summarize, type GardeDeps, type GardeEvent, type GardeState } from './gardeRapideMachine';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Game {
  slots: SessionSlot[];
  deps: GardeDeps;
  endsAt: number;
  durationSec: number;
  startedAt: number;
}

const cardsById = new Map(allCards.map((c) => [c.id, c]));

/** Orchestrates one Garde rapide round: session building, timer, pause and persistence. */
export function useGardeRapide(wing: WingId | 'toutes', includeDrafts: boolean) {
  const [game, setGame] = useState<Game | null>(null);
  const [state, setState] = useState<GardeState | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const pausedRemaining = useRef(0);
  const setGarde = useSceneStore((s) => s.setGarde);
  const setProgress = useProgress((s) => s.set);

  const pool = practiceCards({ wing, mode: 'garde-rapide', includeDrafts });

  const dispatch = useCallback(
    (event: GardeEvent) => {
      if (!game) return;
      setState((prev) => (prev ? gardeReducer(prev, event, game.slots, game.deps) : prev));
    },
    [game],
  );

  const start = useCallback(
    async (durationSec: number) => {
      const today = toDayString(new Date());
      const ids = pool.map((c) => c.id);
      let states = new Map();
      let introduced = 0;
      try {
        states = await loadSrsStates(ids);
        introduced = await countIntroducedToday(today);
      } catch (e) {
        console.warn('[garde] progress unavailable, playing without history', e);
      }
      const slots = buildSession({
        itemIds: ids,
        states,
        today,
        size: srsConfig.gardeRapideSessionSize,
        newRemaining: srsConfig.maxNewPerDay - introduced,
        mix: srsConfig.sessionMix,
        rng: Math.random,
      });
      const deps: GardeDeps = { cardsById, pool, rng: Math.random, fastAnswerMs: progression.gardeRapide.fastAnswerMs };
      const now = performance.now();
      setGame({ slots, deps, endsAt: now + durationSec * 1000, durationSec, startedAt: Date.now() });
      setState(createGarde(slots, deps, now));
      setRemainingMs(durationSec * 1000);
      setPaused(false);
      setSaveStatus('idle');
      setGarde(0, 0);
    },
    [pool, setGarde],
  );

  // Countdown.
  useEffect(() => {
    if (!game || paused || !state || state.phase === 'finished') return;
    const id = setInterval(() => {
      const left = Math.max(0, game.endsAt - performance.now());
      setRemainingMs(left);
      if (left <= 0) dispatch({ type: 'TIME_UP' });
    }, 100);
    return () => clearInterval(id);
  }, [game, paused, state, dispatch]);

  // Auto-advance after the feedback flash (longer when wrong, to read the right answer).
  useEffect(() => {
    if (state?.phase !== 'feedback' || paused) return;
    const id = setTimeout(() => dispatch({ type: 'NEXT', now: performance.now() }), state.last?.correct ? 650 : 1500);
    return () => clearTimeout(id);
  }, [state?.phase, state?.last, paused, dispatch]);

  // Mirror progress into the 3D waiting room.
  useEffect(() => {
    if (state) setGarde(state.answers.length, state.combo);
  }, [state, setGarde]);

  // Persist once the round ends.
  const finished = state?.phase === 'finished';
  useEffect(() => {
    if (!finished || !state || !game || saveStatus !== 'idle') return;
    const summary = summarize(state);
    setSaveStatus('saving');
    const today = toDayString(new Date());
    (async () => {
      try {
        await applyReviews(state.grades, today);
        const progress = await recordSession({
          mode: 'garde-rapide',
          wing,
          startedAt: game.startedAt,
          durationSec: game.durationSec,
          answered: summary.answered,
          correct: summary.correct,
          score: summary.score,
          bestCombo: summary.bestCombo,
          xpEarned: summary.correct * progression.gardeRapide.xpPerCorrect,
        });
        setProgress(progress);
        setSaveStatus('saved');
      } catch (e) {
        console.error('[garde] save failed', e);
        setSaveStatus('error');
      }
    })();
  }, [finished, state, game, wing, saveStatus, setProgress]);

  const pause = useCallback(() => {
    if (!game || !state || state.phase === 'finished') return;
    pausedRemaining.current = Math.max(0, game.endsAt - performance.now());
    setPaused(true);
  }, [game, state]);

  const resume = useCallback(() => {
    if (!game) return;
    const now = performance.now();
    // Shift the deadline and the current question's start so paused time doesn't count.
    setGame({ ...game, endsAt: now + pausedRemaining.current });
    setState((prev) =>
      prev?.current ? { ...prev, current: { ...prev.current, startedAt: now } } : prev,
    );
    setPaused(false);
  }, [game]);

  const reset = useCallback(() => {
    setGame(null);
    setState(null);
    setGarde(0, 0);
  }, [setGarde]);

  return { poolSize: pool.length, state, game, remainingMs, paused, saveStatus, start, dispatch, pause, resume, reset };
}

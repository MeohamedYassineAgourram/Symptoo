import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import { Puzzle, RotateCcw } from 'lucide-react';
import { practiceCards } from '../../content';
import { isWingId, type WingId } from '../../content/wings';
import { t, tDynamic } from '../../i18n/t';
import { useSettings } from '../../stores/settingsStore';
import { useProgress } from '../../stores/progressStore';
import { Button } from '../../ui/Button';
import { GlassCard } from '../../ui/GlassCard';
import { ScreenHeader } from '../../app/screens/ScreenHeader';
import { toDayString } from '../../utils/dates';
import { applyReviews } from '../../db/repositories';
import { useFinishSession } from '../progression/useFinishSession';
import { memoGain } from '../progression/rewards';
import { unlockedWings } from '../progression/unlocks';
import { playSfx } from '../../audio/sfx';
import type { Quality } from '../srs/engine';
import { buildBoard, closeMismatch, createMemo, flip, isMemoCard, isPerfect, memoQuality, type MemoState } from './memo';

const PAIRS = 6;

export function MemoScreen() {
  const { wingId } = useParams();
  const wing: WingId | 'toutes' = isWingId(wingId) ? wingId : 'toutes';
  const includeDrafts = useSettings((s) => s.settings.includeDrafts);
  const unlockAll = useSettings((s) => s.settings.unlockAll);
  const xp = useProgress((s) => s.progress.xp);
  const finish = useFinishSession();
  const backTo = wing === 'toutes' ? '/' : `/aile/${wing}`;

  const cards = useMemo(() => {
    const open = new Set(unlockedWings(xp, unlockAll));
    return practiceCards({ wing, mode: 'memo', includeDrafts }).filter((c) => isMemoCard(c) && (wing !== 'toutes' || open.has(c.wing)));
  }, [wing, includeDrafts, unlockAll, xp]);

  const [game, setGame] = useState<MemoState | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const saved = useRef(false);

  const start = () => {
    saved.current = false;
    setGame(createMemo(buildBoard(cards, PAIRS, Math.random)));
    setStartedAt(Date.now());
    setNow(Date.now());
  };

  // Timer.
  useEffect(() => {
    if (!game || game.done) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [game]);

  // Close a mismatched pair after a moment.
  useEffect(() => {
    if (!game || game.open.length !== 2) return;
    const id = setTimeout(() => setGame((g) => (g ? closeMismatch(g) : g)), 900);
    return () => clearTimeout(id);
  }, [game]);

  // Rewards when the board is complete.
  useEffect(() => {
    if (!game?.done || saved.current) return;
    saved.current = true;
    const pairs = game.matched.length;
    const perfect = isPerfect(game);
    const gain = memoGain(pairs, perfect);
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    const grades = Object.fromEntries(game.matched.map((p) => [p, memoQuality(game, p)])) as Record<string, Quality>;
    void applyReviews(grades, toDayString(new Date()))
      .then(() =>
        finish(
          { mode: 'memo', wing, startedAt, durationSec, answered: pairs, correct: pairs, score: game.moves, bestCombo: 0, xpEarned: gain.xp },
          { ...gain, patients: pairs, stats: { memoBoards: 1, perfectMemos: perfect ? 1 : 0, studySeconds: durationSec } },
        ),
      )
      .catch((e) => console.error('[memo] save failed', e));
  }, [game, startedAt, wing, finish]);

  const onFlip = (id: number) => {
    if (!game) return;
    const next = flip(game, id);
    if (next === game) return;
    playSfx(next.matched.length > game.matched.length ? 'match' : 'flip');
    setGame(next);
  };

  const seconds = Math.round(((game?.done ? now : now) - startedAt) / 1000);
  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <>
      <ScreenHeader to={backTo} label={t('nav.back')} />
      <h1 className="diorama-title mt-2 px-4 text-center text-3xl sm:text-5xl">{t('memo.title')}</h1>
      {!game ? (
        <>
          <p className="diorama-title px-4 text-center text-lg opacity-80">{tDynamic(`wings.${wing}.title`)}</p>
          <div className="flex-1" />
          <div className="pointer-events-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <GlassCard className="mx-auto max-w-xl p-5">
              {cards.length < 3 ? (
                <p className="font-semibold">{t('memo.empty')}</p>
              ) : (
                <>
                  <p className="text-ink-soft">{t('memo.intro')}</p>
                  <Button size="lg" className="mt-4 w-full" icon={<Puzzle size={20} aria-hidden />} onClick={start} data-testid="memo-start">
                    {t('garde.go')}
                  </Button>
                </>
              )}
            </GlassCard>
          </div>
        </>
      ) : (
        <div className="pointer-events-auto mt-2 flex min-h-0 flex-1 flex-col px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="mb-2 flex justify-center gap-2">
            {[
              { l: t('memo.moves'), v: game.moves },
              { l: t('memo.time'), v: mmss },
              { l: t('memo.pairs'), v: `${game.matched.length}/${game.tiles.length / 2}` },
            ].map((s) => (
              <span key={s.l} className="glass rounded-full px-3 py-1 text-sm font-extrabold tabular-nums">
                {s.l} : <span data-testid={`memo-${s.l}`}>{s.v}</span>
              </span>
            ))}
          </div>
          <div className="mx-auto grid w-full max-w-3xl flex-1 auto-rows-fr grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4" data-testid="memo-board">
            {game.tiles.map((tile) => {
              const up = game.open.includes(tile.id) || game.matched.includes(tile.pairId);
              const matched = game.matched.includes(tile.pairId);
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => onFlip(tile.id)}
                  data-testid={`tile-${tile.id}`}
                  data-pair={import.meta.env.DEV ? tile.pairId : undefined}
                  aria-label={up ? tile.text : `${t('memo.tile', { n: tile.id + 1 })}, ${t('memo.hidden')}`}
                  className="relative min-h-20 [perspective:600px]"
                >
                  <motion.div
                    className="absolute inset-0 [transform-style:preserve-3d]"
                    animate={{ rotateY: up ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  >
                    <div className="toy-btn absolute inset-0 flex items-center justify-center rounded-2xl text-2xl [backface-visibility:hidden]">🩺</div>
                    <div
                      className={`absolute inset-0 flex items-center justify-center rounded-2xl p-1.5 text-center text-[11px] leading-tight font-bold [backface-visibility:hidden] [transform:rotateY(180deg)] sm:text-xs ${
                        matched ? 'bg-[color-mix(in_oklab,var(--success)_30%,white)] text-ink' : tile.side === 'term' ? 'bg-white text-ink' : 'bg-[color-mix(in_oklab,var(--gold)_22%,white)] text-ink'
                      }`}
                    >
                      {tile.text}
                    </div>
                  </motion.div>
                </button>
              );
            })}
          </div>
          {game.done && (
            <GlassCard className="mx-auto mt-2 w-full max-w-xl p-4 text-center" data-testid="memo-done">
              <p className="font-extrabold">{isPerfect(game) ? `🧠 ${t('memo.perfect')}` : t('memo.done')}</p>
              <div className="mt-2 flex gap-2">
                <Link to={backTo} className="toy-btn soft flex min-h-12 flex-1 items-center justify-center rounded-2xl font-extrabold">
                  {t('nav.back')}
                </Link>
                <Button className="flex-1" icon={<RotateCcw size={18} aria-hidden />} onClick={start}>
                  {t('memo.replay')}
                </Button>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </>
  );
}

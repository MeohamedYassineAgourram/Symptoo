import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Brain, Check, CircleHelp, Lightbulb, X } from 'lucide-react';
import { practiceCards } from '../../content';
import { isWingId, type WingId } from '../../content/wings';
import { t, tDynamic } from '../../i18n/t';
import { useSettings } from '../../stores/settingsStore';
import { useProgress } from '../../stores/progressStore';
import { Button } from '../../ui/Button';
import { GlassCard } from '../../ui/GlassCard';
import { Badge } from '../../ui/Badge';
import { ScreenHeader } from '../../app/screens/ScreenHeader';
import { shuffle } from '../../utils/random';
import { toDayString } from '../../utils/dates';
import { applyReviews } from '../../db/repositories';
import { useFinishSession } from '../progression/useFinishSession';
import { quiSuisJeGain } from '../progression/rewards';
import { unlockedWings } from '../progression/unlocks';
import { playSfx } from '../../audio/sfx';
import type { Quality } from '../srs/engine';
import { buildRound, gradeRound, isPlayable, type QsjRound, type RoundOutcome } from './quiSuisJe';

const ROUNDS = 8;

interface Played {
  round: QsjRound;
  outcome: RoundOutcome;
  pick: number | null;
}

export function QuiSuisJeScreen() {
  const { wingId } = useParams();
  const wing: WingId | 'toutes' = isWingId(wingId) ? wingId : 'toutes';
  const includeDrafts = useSettings((s) => s.settings.includeDrafts);
  const unlockAll = useSettings((s) => s.settings.unlockAll);
  const xp = useProgress((s) => s.progress.xp);
  const finish = useFinishSession();
  const backTo = wing === 'toutes' ? '/' : `/aile/${wing}`;

  const pool = useMemo(() => {
    const open = new Set(unlockedWings(xp, unlockAll));
    const all = practiceCards({ wing: 'toutes', mode: 'qui-suis-je', includeDrafts }).filter((c) => isPlayable(c) && open.has(c.wing));
    return { all, mine: wing === 'toutes' ? all : all.filter((c) => c.wing === wing) };
  }, [wing, includeDrafts, unlockAll, xp]);

  const [rounds, setRounds] = useState<QsjRound[] | null>(null);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(1);
  const [answer, setAnswer] = useState<{ pick: number | null; outcome: RoundOutcome } | null>(null);
  const [played, setPlayed] = useState<Played[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [over, setOver] = useState(false);

  const start = () => {
    const picks = shuffle(pool.mine, Math.random).slice(0, ROUNDS);
    setRounds(picks.map((c) => buildRound(c, pool.all, t('qsj.system', { wing: tDynamic(`wings.${c.wing}.name`) }), Math.random)));
    setIndex(0);
    setShown(1);
    setAnswer(null);
    setPlayed([]);
    setOver(false);
    setStartedAt(Date.now());
  };

  const round = rounds?.[index];
  const respond = (pick: number | null) => {
    if (!round || answer) return;
    const outcome = gradeRound(shown, pick === null ? null : pick === round.correctIndex);
    // A wrong pick reveals the next clue instead of ending the round, until all clues are out.
    if (pick !== null && !outcome.found && shown < round.clues.length) {
      playSfx('wrong');
      setShown(shown + 1);
      return;
    }
    playSfx(outcome.found ? 'correct' : 'wrong');
    setAnswer({ pick, outcome });
    setShown(round.clues.length);
  };

  const next = () => {
    if (!round || !answer) return;
    const all = [...played, { round, outcome: answer.outcome, pick: answer.pick }];
    setPlayed(all);
    setAnswer(null);
    setShown(1);
    if (index + 1 < (rounds?.length ?? 0)) {
      setIndex(index + 1);
      return;
    }
    setOver(true);
    const points = all.reduce((a, p) => a + p.outcome.points, 0);
    const found = all.filter((p) => p.outcome.found).length;
    const gain = quiSuisJeGain(points, found);
    const grades = Object.fromEntries(all.map((p) => [p.round.itemId, p.outcome.quality])) as Record<string, Quality>;
    void applyReviews(grades, toDayString(new Date()))
      .then(() =>
        finish(
          {
            mode: 'qui-suis-je',
            wing,
            startedAt,
            durationSec: Math.round((Date.now() - startedAt) / 1000),
            answered: all.length,
            correct: found,
            score: points,
            bestCombo: 0,
            xpEarned: gain.xp,
            review: all.filter((p) => p.outcome.quality < 4).map((p) => ({ itemId: p.round.itemId, quality: p.outcome.quality, given: p.pick === null ? '' : p.round.options[p.pick] })),
          },
          {
            ...gain,
            patients: all.length,
            stats: { firstClueGuesses: all.filter((p) => p.outcome.quality === 5).length, studySeconds: Math.round((Date.now() - startedAt) / 1000) },
          },
        ),
      )
      .catch((e) => console.error('[qui-suis-je] save failed', e));
  };

  if (!rounds || over) {
    const points = played.reduce((a, p) => a + p.outcome.points, 0);
    return (
      <>
        <ScreenHeader to={backTo} label={t('nav.back')} />
        <h1 className="diorama-title mt-3 px-4 text-center text-4xl sm:text-6xl">{t('qsj.title')}</h1>
        <p className="diorama-title px-4 text-center text-lg opacity-80">{tDynamic(`wings.${wing}.title`)}</p>
        <div className="flex-1" />
        <div className="pointer-events-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <GlassCard className="mx-auto max-w-xl p-5" data-testid="qsj-setup">
            {over ? (
              <div className="text-center">
                <p className="text-sm font-bold text-ink-soft uppercase">{t('qsj.score')}</p>
                <p className="text-5xl font-extrabold text-accent tabular-nums">{points}</p>
                <p className="mt-1 font-bold">
                  {t('qsj.found')} : {played.filter((p) => p.outcome.found).length}/{played.length}
                </p>
              </div>
            ) : pool.mine.length < 2 ? (
              <p className="font-semibold">{t('qsj.empty')}</p>
            ) : (
              <>
                <p className="text-ink-soft">{t('qsj.intro')}</p>
                <div className="mt-2">
                  <Badge>{t('qsj.rounds', { n: Math.min(ROUNDS, pool.mine.length) })}</Badge>
                </div>
              </>
            )}
            {pool.mine.length >= 2 && (
              <Button size="lg" className="mt-4 w-full" icon={<Brain size={20} aria-hidden />} onClick={start} data-testid="qsj-start">
                {over ? t('memo.replay') : t('garde.go')}
              </Button>
            )}
            {over && (
              <Link to={backTo} className="toy-btn soft mt-2 flex min-h-12 items-center justify-center rounded-2xl font-extrabold">
                {t('nav.back')}
              </Link>
            )}
          </GlassCard>
        </div>
      </>
    );
  }

  return (
    <>
      <ScreenHeader to={backTo} label={t('nav.back')} />
      <div className="mt-2 flex justify-center gap-2 px-4">
        <span className="glass rounded-full px-3 py-1 text-sm font-extrabold tabular-nums">
          {index + 1}/{rounds.length}
        </span>
        <span className="glass rounded-full px-3 py-1 text-sm font-extrabold tabular-nums">
          {t('qsj.score')} : {played.reduce((a, p) => a + p.outcome.points, 0) + (answer?.outcome.points ?? 0)}
        </span>
      </div>
      <div className="flex-1" />
      <div className="pointer-events-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <GlassCard className="mx-auto max-w-xl p-4" data-testid="qsj-round">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <h2 className="mr-auto text-xl font-extrabold">🕵️ {t('qsj.guess')}</h2>
            {round!.isDraft && <Badge tone="draft">{t('garde.draft')}</Badge>}
          </div>
          <ol className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {round!.clues.slice(0, shown).map((clue, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 rounded-2xl bg-surface-strong px-3 py-2 text-sm"
                >
                  <Lightbulb size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                  <span>
                    <b className="text-xs text-ink-soft">{t('qsj.clue', { n: i + 1 })} · </b>
                    {clue}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
          {!answer && shown < round!.clues.length && (
            <button type="button" onClick={() => setShown(shown + 1)} data-testid="qsj-next-clue" className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-accent">
              <Lightbulb size={16} aria-hidden />
              {t('qsj.nextClue')} ({shown}/{round!.clues.length})
            </button>
          )}
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {round!.options.map((o, i) => {
              const ok = answer && i === round!.correctIndex;
              const bad = answer && answer.pick === i && !answer.outcome.found;
              return (
                <button
                  key={o}
                  type="button"
                  disabled={!!answer}
                  onClick={() => respond(i)}
                  data-testid={`qsj-opt-${i}`}
                  className={`toy-btn flex min-h-12 items-center gap-2 rounded-2xl px-3 text-left text-sm font-bold disabled:!opacity-100 disabled:!filter-none ${ok || bad ? '' : 'soft'}`}
                  style={ok ? ({ '--btn-bg': 'var(--success)', '--btn-edge': '#3d8a5b' } as React.CSSProperties) : bad ? ({ '--btn-bg': 'var(--danger)', '--btn-edge': '#b5574a' } as React.CSSProperties) : undefined}
                >
                  {ok && <Check size={16} aria-hidden />}
                  {bad && <X size={16} aria-hidden />}
                  {o}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex min-h-11 items-center justify-between gap-2">
            {answer ? (
              <>
                <p className={`text-sm font-bold ${answer.outcome.found ? 'text-success' : 'text-danger'}`} aria-live="polite">
                  {answer.outcome.found ? `${t('qsj.right')} ${t('qsj.points', { n: answer.outcome.points })}` : t('qsj.wrong', { answer: round!.options[round!.correctIndex]! })}
                </p>
                <Button onClick={next} data-testid="qsj-continue">
                  {index + 1 < rounds.length ? t('qsj.next') : t('qsj.finish')}
                </Button>
              </>
            ) : (
              <button type="button" onClick={() => respond(null)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-ink-soft">
                <CircleHelp size={16} aria-hidden />
                {t('qsj.dontKnow')}
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

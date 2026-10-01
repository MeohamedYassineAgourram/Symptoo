import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Check, CircleHelp, Flame, Pause, Play, RotateCcw, X, Zap } from 'lucide-react';
import { isWingId, type WingId } from '../../content/wings';
import { itemsById } from '../../content';
import { t, tDynamic, tList } from '../../i18n/t';
import { useSettings } from '../../stores/settingsStore';
import { Button } from '../../ui/Button';
import { GlassCard } from '../../ui/GlassCard';
import { Badge } from '../../ui/Badge';
import { Segmented } from '../../ui/Segmented';
import { ScreenHeader } from '../../app/screens/ScreenHeader';
import { summarize, type GardeState } from './gardeRapideMachine';
import { useGardeRapide, type SaveStatus } from './useGardeRapide';

const pick = (list: string[], seed: number) => list[seed % list.length] ?? '';

export function GardeRapideScreen() {
  const { wingId } = useParams();
  const wing: WingId | 'toutes' = isWingId(wingId) ? wingId : 'toutes';
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const garde = useGardeRapide(wing, settings.includeDrafts);
  const backTo = wing === 'toutes' ? '/' : `/aile/${wing}`;

  if (!garde.state) {
    return (
      <Setup
        wing={wing}
        backTo={backTo}
        poolSize={garde.poolSize}
        duration={settings.gardeRapideSeconds}
        onDuration={(v) => update({ gardeRapideSeconds: v })}
        onStart={() => void garde.start(settings.gardeRapideSeconds)}
      />
    );
  }
  if (garde.state.phase === 'finished') {
    return <Results state={garde.state} saveStatus={garde.saveStatus} backTo={backTo} onReplay={garde.reset} />;
  }
  return <Playing garde={garde} state={garde.state} backTo={backTo} />;
}

function Setup(props: {
  wing: WingId | 'toutes';
  backTo: string;
  poolSize: number;
  duration: 60 | 90;
  onDuration: (v: 60 | 90) => void;
  onStart: () => void;
}) {
  return (
    <>
      <ScreenHeader to={props.backTo} label={t('nav.back')} />
      <h1 className="diorama-title mt-3 px-4 text-center text-4xl sm:text-6xl">{t('garde.title')}</h1>
      <p className="diorama-title px-4 text-center text-lg opacity-80">{tDynamic(`wings.${props.wing}.title`)}</p>
      <div className="flex-1" />
      <motion.div
        className="pointer-events-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <GlassCard className="mx-auto max-w-xl p-5">
          {props.poolSize === 0 ? (
            <p className="font-semibold">{t('garde.empty')}</p>
          ) : (
            <>
              <p className="text-ink-soft">{t('garde.intro')}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge>{t('wing.cards', { count: props.poolSize })}</Badge>
              </div>
              <Segmented
                label={t('garde.duration')}
                value={props.duration}
                options={([60, 90] as const).map((n) => ({ value: n, label: t('garde.seconds', { n }) }))}
                onChange={props.onDuration}
              />
              <Button size="lg" className="mt-3 w-full" icon={<Zap size={22} aria-hidden />} onClick={props.onStart}>
                {t('garde.go')}
              </Button>
            </>
          )}
        </GlassCard>
      </motion.div>
    </>
  );
}

function Playing({ garde, state, backTo }: { garde: ReturnType<typeof useGardeRapide>; state: GardeState; backTo: string }) {
  const navigate = useNavigate();
  const current = state.current;
  const seconds = Math.ceil(garde.remainingMs / 1000);
  const ratio = garde.game ? garde.remainingMs / (garde.game.durationSec * 1000) : 0;
  const feedback = state.phase === 'feedback' ? state.last : null;
  const praise = useMemo(() => tList('garde.praise'), []);
  const comfort = useMemo(() => tList('garde.comfort'), []);
  if (!current) return null;
  const q = current.question;

  return (
    <>
      {/* HUD */}
      <div className="pointer-events-auto flex items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={garde.pause}
          className="glass flex h-11 w-11 items-center justify-center rounded-2xl"
          aria-label="Pause"
        >
          <Pause size={20} aria-hidden />
        </button>
        <div className="glass flex flex-1 items-center gap-3 rounded-2xl px-3 py-2">
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--ink)_12%,transparent)]"
            role="timer"
            aria-label={t('garde.timeLeft')}
          >
            <div
              className="h-full rounded-full transition-[width] duration-100"
              style={{ width: `${ratio * 100}%`, background: ratio < 0.2 ? 'var(--danger)' : 'var(--accent)' }}
            />
          </div>
          <span className="w-9 text-right font-extrabold tabular-nums">{seconds}s</span>
        </div>
        <div className="glass rounded-2xl px-3 py-2 text-right">
          <div className="text-[10px] font-bold text-ink-soft uppercase">{t('garde.score')}</div>
          <div className="leading-none font-extrabold tabular-nums">{state.score}</div>
        </div>
      </div>
      <div className="mt-2 flex h-8 justify-center">
        <AnimatePresence>
          {state.combo >= 2 && (
            <motion.span
              key={state.combo}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="toy-btn gold inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-extrabold"
            >
              <Flame size={16} aria-hidden />
              {t('garde.combo', { n: state.combo })}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex-1" />

      {/* Question card */}
      <div className="pointer-events-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${q.itemId}-${state.answers.length - (feedback ? 1 : 0)}`}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <GlassCard className="mx-auto max-w-xl p-4">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {current.kind === 'due' && !current.retry && <Badge tone="followUp">{t('garde.followUp')}</Badge>}
                {q.isDraft && <Badge tone="draft">{t('garde.draft')}</Badge>}
                <Badge>{tDynamic(`wings.${itemsById.get(q.itemId)?.wing ?? 'toutes'}.name`)}</Badge>
              </div>
              {q.direction === 'reverse' && <p className="text-sm font-bold text-accent">{t('garde.whichSign')}</p>}
              <p className="text-lg leading-snug font-extrabold">{q.prompt}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((option, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isChosen = feedback?.selectedIndex === i;
                  let tone = 'soft';
                  if (feedback && isCorrect) tone = 'ok';
                  else if (feedback && isChosen) tone = 'bad';
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!!feedback}
                      onClick={() => garde.dispatch({ type: 'ANSWER', index: i, now: performance.now() })}
                      aria-label={`${t('a11y.option', { n: i + 1 })} : ${option}`}
                      className={`toy-btn flex min-h-12 items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm leading-snug font-bold disabled:!opacity-100 disabled:!filter-none ${
                        tone === 'soft' ? 'soft' : ''
                      }`}
                      style={
                        tone === 'ok'
                          ? ({ '--btn-bg': 'var(--success)', '--btn-edge': '#3d8a5b' } as React.CSSProperties)
                          : tone === 'bad'
                            ? ({ '--btn-bg': 'var(--danger)', '--btn-edge': '#b5574a' } as React.CSSProperties)
                            : undefined
                      }
                    >
                      {tone === 'ok' && <Check size={18} className="shrink-0" aria-hidden />}
                      {tone === 'bad' && <X size={18} className="shrink-0" aria-hidden />}
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex min-h-11 items-center justify-between gap-2">
                <p className="text-sm font-bold" aria-live="polite">
                  {feedback &&
                    (feedback.correct ? (
                      <span className="text-success">✓ {pick(praise, state.answers.length)}</span>
                    ) : (
                      <span className="text-danger">{pick(comfort, state.answers.length)}</span>
                    ))}
                </p>
                {!feedback && (
                  <button
                    type="button"
                    onClick={() => garde.dispatch({ type: 'SKIP', now: performance.now() })}
                    className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-ink-soft hover:text-ink"
                  >
                    <CircleHelp size={16} aria-hidden />
                    {t('garde.dontKnow')}
                  </button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>

      {garde.paused && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-xs p-5 text-center">
            <h2 className="diorama-title mb-4 text-3xl">Pause</h2>
            <div className="flex flex-col gap-3">
              <Button icon={<Play size={20} aria-hidden />} onClick={garde.resume}>
                Reprendre
              </Button>
              <Button variant="soft" onClick={() => navigate(backTo)}>
                {t('garde.quit')}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
}

function Results({ state, saveStatus, backTo, onReplay }: { state: GardeState; saveStatus: SaveStatus; backTo: string; onReplay: () => void }) {
  const s = summarize(state);
  const [open, setOpen] = useState(true);
  const stats = [
    { label: t('result.answered'), value: s.answered },
    { label: t('result.accuracy'), value: `${Math.round(s.accuracy * 100)} %` },
    { label: t('result.bestCombo'), value: s.bestCombo },
    { label: t('result.xp'), value: `+${s.correct * 10}` },
  ];
  return (
    <>
      <h1 className="diorama-title mt-[max(20px,env(safe-area-inset-top))] px-4 text-center text-4xl sm:text-6xl">{t('result.title')}</h1>
      <div className="pointer-events-auto mt-3 flex-1 overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <motion.div
          className="mx-auto flex max-w-xl flex-col gap-3"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        >
          <GlassCard className="p-5 text-center">
            <div className="text-sm font-bold text-ink-soft uppercase">{t('garde.score')}</div>
            <div className="text-5xl font-extrabold text-accent tabular-nums">{s.score}</div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((st) => (
                <div key={st.label} className="rounded-2xl bg-surface-strong p-2">
                  <div className="text-xs text-ink-soft">{st.label}</div>
                  <div className="text-xl font-extrabold tabular-nums">{st.value}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-bold text-ink-soft" aria-live="polite">
              {saveStatus === 'saved' && `✓ ${t('result.saved')}`}
              {saveStatus === 'error' && <span className="text-danger">{t('result.saveError')}</span>}
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <button type="button" className="flex min-h-11 w-full items-center justify-between font-extrabold" onClick={() => setOpen(!open)} aria-expanded={open}>
              {t('result.reviewTitle')}
              <Badge>{s.mistakes.length}</Badge>
            </button>
            {open && (
              <ul className="mt-2 flex flex-col gap-2">
                {s.mistakes.length === 0 && <li className="text-ink-soft">{t('result.noMistakes')}</li>}
                {s.mistakes.map((m) => {
                  const item = itemsById.get(m.itemId);
                  const explanation = item?.type === 'card' && m.question.direction === 'forward' ? item.explanation : undefined;
                  return (
                    <li key={m.itemId} className="rounded-2xl bg-surface-strong p-3 text-sm">
                      <div className="mb-1 flex flex-wrap gap-1.5">
                        {m.question.isDraft && <Badge tone="draft">{t('garde.draft')}</Badge>}
                      </div>
                      <p className="font-bold">{m.question.prompt}</p>
                      <p className="mt-1 text-danger">
                        <X size={14} className="mr-1 inline" aria-hidden />
                        {m.selectedIndex === null
                          ? t('result.skipped')
                          : t('result.yourAnswer', { answer: m.question.options[m.selectedIndex] ?? '' })}
                      </p>
                      <p className="text-success">
                        <Check size={14} className="mr-1 inline" aria-hidden />
                        {t('result.correctAnswer', { answer: m.question.options[m.question.correctIndex] ?? '' })}
                      </p>
                      {explanation && <p className="mt-1 text-ink-soft">{explanation}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>

          <div className="flex gap-3">
            <Link to={backTo} className="toy-btn soft flex min-h-12 flex-1 items-center justify-center rounded-2xl font-extrabold">
              {t('nav.back')}
            </Link>
            <Button className="flex-1" icon={<RotateCcw size={20} aria-hidden />} onClick={onReplay}>
              {t('result.replay')}
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

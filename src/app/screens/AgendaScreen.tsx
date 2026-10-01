import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ClipboardList, Flame } from 'lucide-react';
import progression from '../../config/progression.json';
import { db } from '../../db/db';
import { purchaseTea } from '../../db/repositories';
import { t } from '../../i18n/t';
import { useProgress } from '../../stores/progressStore';
import { dueByDay } from '../../features/progression/stats';
import { displayStreak } from '../../features/progression/streak';
import { addDays, parseDay, toDayString } from '../../utils/dates';
import type { SrsState } from '../../features/srs/engine';
import { GlassCard } from '../../ui/GlassCard';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import { BottomNav } from '../../ui/BottomNav';
import { playSfx } from '../../audio/sfx';

const DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

export function AgendaScreen() {
  const progress = useProgress((s) => s.progress);
  const setProgress = useProgress((s) => s.set);
  const states = useLiveQuery(() => db.srs.toArray(), [], [] as SrsState[]);
  const today = toDayString(new Date());
  const due = dueByDay(states, today, 14);
  const max = Math.max(1, ...due.map((d) => d.count));
  const [msg, setMsg] = useState<string | null>(null);
  const streak = displayStreak(progress.streak, today);
  const history = new Set(progress.streak.history);

  // 5 weeks ending this week, Monday first.
  const monday = addDays(today, -((parseDay(today).getDay() + 6) % 7));
  const cells = Array.from({ length: 35 }, (_, i) => addDays(monday, i - 28));

  const buy = async () => {
    const p = await purchaseTea().catch(() => null);
    if (p) {
      setProgress(p);
      playSfx('coin');
      setMsg(t('agenda.bought'));
    } else setMsg(t('agenda.cannotBuy'));
  };

  return (
    <>
      <TopBar />
      <div className="pointer-events-auto mt-3 flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <h1 className="diorama-title text-center text-4xl">{t('agenda.title')}</h1>

          <GlassCard className="p-4" data-testid="agenda-due">
            <h2 className="font-extrabold">{t('agenda.due')}</h2>
            <p className="mb-2 text-sm text-ink-soft">{t('agenda.dueHint')}</p>
            <ul className="flex flex-col gap-1">
              {due.map((d) => (
                <li key={d.day} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-2 text-sm" title={`${d.count}`}>
                  <span className={d.day === today ? 'font-extrabold' : 'text-ink-soft'}>{d.day === today ? t('agenda.today') : DAY.format(parseDay(d.day))}</span>
                  <span className="h-2.5 rounded-full bg-[color-mix(in_oklab,var(--ink)_8%,transparent)]">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${(d.count / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-bold tabular-nums">{d.count}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-4" data-testid="agenda-streak">
            <h2 className="mb-2 font-extrabold">{t('agenda.streak')}</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-surface-strong p-2">
                <Flame className={`mx-auto ${streak ? 'text-gold' : 'text-ink-soft'}`} size={22} aria-hidden />
                <div className="text-xl font-extrabold">{t('agenda.days', { n: streak })}</div>
                <div className="text-xs text-ink-soft">{t('agenda.current')}</div>
              </div>
              <div className="rounded-2xl bg-surface-strong p-2">
                <div className="text-xl">🏆</div>
                <div className="text-xl font-extrabold">{t('agenda.days', { n: progress.streak.best })}</div>
                <div className="text-xs text-ink-soft">{t('agenda.best')}</div>
              </div>
              <div className="rounded-2xl bg-surface-strong p-2">
                <div className="text-xl">🍵</div>
                <div className="text-xl font-extrabold">
                  {progress.streak.teas}/{progression.streak.maxTeas}
                </div>
                <div className="text-xs text-ink-soft">{t('agenda.teas')}</div>
              </div>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{t('agenda.teaHint')}</p>
            <Button variant="gold" className="mt-2 w-full" onClick={buy} disabled={progress.streak.teas >= progression.streak.maxTeas} data-testid="buy-tea">
              {t('agenda.buy', { cost: progression.streak.teaCost })}
            </Button>
            {msg && (
              <p className="mt-1 text-center text-sm font-bold" aria-live="polite">
                {msg}
              </p>
            )}
            <h3 className="mt-3 mb-1 text-sm font-bold text-ink-soft">{t('agenda.history')}</h3>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const done = history.has(d);
                const count = progress.daily[d] ?? 0;
                return (
                  <div
                    key={d}
                    title={`${DAY.format(parseDay(d))}${done ? ` · ${t('agenda.visiteDay')}` : ''} · ${count}`}
                    className={`flex aspect-square items-center justify-center rounded-lg text-[11px] font-bold ${
                      done ? 'bg-gold text-[#3b2a05]' : count ? 'bg-[color-mix(in_oklab,var(--accent)_25%,transparent)]' : 'bg-[color-mix(in_oklab,var(--ink)_6%,transparent)] text-ink-soft'
                    } ${d === today ? 'ring-2 ring-accent' : ''} ${d > today ? 'opacity-40' : ''}`}
                  >
                    {done ? '🔥' : parseDay(d).getDate()}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <Link to="/staff" className="toy-btn soft flex min-h-12 items-center justify-center gap-2 rounded-2xl font-extrabold">
            <ClipboardList size={18} aria-hidden />
            {t('agenda.staffLink')}
          </Link>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

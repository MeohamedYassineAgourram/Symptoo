import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { wingItemIds } from '../../content';
import { WING_IDS } from '../../content/wings';
import { db } from '../../db/db';
import { t, tDynamic } from '../../i18n/t';
import { useProgress } from '../../stores/progressStore';
import { useSettings } from '../../stores/settingsStore';
import { rankFor } from '../../features/progression/ranks';
import { displayStreak } from '../../features/progression/streak';
import { ACHIEVEMENTS } from '../../features/progression/achievements';
import { accuracyOf, formatDuration } from '../../features/progression/stats';
import { masteryRatio } from '../../features/progression/mastery';
import { toDayString } from '../../utils/dates';
import type { SrsState } from '../../features/srs/engine';
import { GlassCard } from '../../ui/GlassCard';
import { TopBar } from '../../ui/TopBar';
import { BottomNav } from '../../ui/BottomNav';

export function ProfilScreen() {
  const p = useProgress((s) => s.progress);
  const includeDrafts = useSettings((s) => s.settings.includeDrafts);
  const states = useLiveQuery(() => db.srs.toArray(), [], [] as SrsState[]);
  const byId = useMemo(() => new Map(states.map((s) => [s.itemId, s])), [states]);
  const rank = rankFor(p.xp);
  const accuracy = WING_IDS.map((w) => ({ wing: w, ...accuracyOf(wingItemIds(w, includeDrafts), byId) }));
  const ctx = { stats: p.stats, bestStreak: p.streak.best, rankId: rank.id, masteryByWing: { pneumo: masteryRatio(wingItemIds('pneumo', includeDrafts), byId) } };
  const owned = Object.keys(p.achievements);

  const tiles = [
    { label: t('profil.xp'), value: p.xp },
    { label: t('profil.dh'), value: p.dirhams },
    { label: t('profil.streak'), value: displayStreak(p.streak, toDayString(new Date())) },
    { label: t('profil.best'), value: p.streak.best },
    { label: t('profil.patients'), value: p.stats.patients },
    { label: t('profil.diagnoses'), value: p.stats.correctDiagnoses },
    { label: t('profil.time'), value: formatDuration(p.stats.studySeconds) },
    { label: t('profil.teas'), value: `🍵 ${p.streak.teas}` },
  ];

  return (
    <>
      <TopBar />
      <div className="pointer-events-auto mt-3 flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <h1 className="diorama-title text-center text-4xl">{t('profil.title')}</h1>

          <GlassCard className="p-4 text-center">
            <p className="text-xs font-bold text-ink-soft uppercase">{t('profil.rank')}</p>
            <p className="text-2xl font-extrabold" data-testid="profil-rank">
              {tDynamic(`ranks.${rank.id}`)}
            </p>
            <div className="mx-auto mt-2 h-3 max-w-sm overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--ink)_12%,transparent)]">
              <div className="h-full rounded-full bg-accent" style={{ width: `${rank.ratio * 100}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {tiles.map((x) => (
                <div key={x.label} className="rounded-2xl bg-surface-strong p-2">
                  <div className="text-xs text-ink-soft">{x.label}</div>
                  <div className="text-lg font-extrabold tabular-nums">{x.value}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Accuracy per wing: a magnitude comparison, so one-hue horizontal bars */}
          <GlassCard className="p-4" data-testid="profil-accuracy">
            <h2 className="font-extrabold">{t('profil.accuracy')}</h2>
            <p className="mb-2 text-sm text-ink-soft">{t('profil.accuracyHint')}</p>
            <ul className="flex flex-col gap-1.5" role="table" aria-label={t('profil.accuracy')}>
              {accuracy.map((a) => (
                <li
                  key={a.wing}
                  role="row"
                  className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-2 text-sm"
                  title={a.accuracy === null ? t('profil.notPlayed') : `${Math.round(a.accuracy * 100)} % · ${t('profil.reviews', { n: a.reviews })}`}
                >
                  <span role="cell" className="truncate text-ink-soft">
                    {tDynamic(`wings.${a.wing}.name`)}
                  </span>
                  <span role="cell" className="h-2.5 rounded-full bg-[color-mix(in_oklab,var(--ink)_8%,transparent)]">
                    {a.accuracy !== null && <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(4, a.accuracy * 100)}%` }} />}
                  </span>
                  <span role="cell" className="text-right font-bold tabular-nums">
                    {a.accuracy === null ? t('profil.notPlayed') : `${Math.round(a.accuracy * 100)} %`}
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-4" data-testid="profil-achievements">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-extrabold">{t('profil.achievements')}</h2>
              <span className="text-sm font-bold text-ink-soft">{t('profil.achieved', { n: owned.length, total: ACHIEVEMENTS.length })}</span>
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ACHIEVEMENTS.map((a) => {
                const have = owned.includes(a.id);
                const [n, target] = a.progress(ctx);
                return (
                  <li key={a.id} className={`flex items-center gap-3 rounded-2xl p-2.5 ${have ? 'bg-[color-mix(in_oklab,var(--gold)_20%,transparent)]' : 'bg-surface-strong opacity-80'}`}>
                    <span className={`text-2xl ${have ? '' : 'grayscale'}`} aria-hidden>
                      {a.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold">{tDynamic(`achievements.${a.id}.name`)}</span>
                      <span className="block text-xs text-ink-soft">{tDynamic(`achievements.${a.id}.desc`)}</span>
                      {!have && target > 1 && (
                        <span className="mt-1 block h-1.5 rounded-full bg-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
                          <span className="block h-full rounded-full bg-gold" style={{ width: `${(n / target) * 100}%` }} />
                        </span>
                      )}
                    </span>
                    {have && <span className="text-success">✓</span>}
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

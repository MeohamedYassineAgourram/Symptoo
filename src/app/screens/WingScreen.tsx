import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import { Brain, Crown, Ear, Puzzle, Stethoscope, Zap } from 'lucide-react';
import { isWingId } from '../../content/wings';
import { practiceCards } from '../../content';
import { t, tDynamic, type I18nKey } from '../../i18n/t';
import { useSettings } from '../../stores/settingsStore';
import { loadSrsStates } from '../../db/repositories';
import { isDue, isMastered } from '../../features/srs/engine';
import { toDayString } from '../../utils/dates';
import { GlassCard } from '../../ui/GlassCard';
import { Badge } from '../../ui/Badge';
import { ScreenHeader } from './ScreenHeader';

const MODES: { key: I18nKey; Icon: typeof Zap; path?: string }[] = [
  { key: 'modes.garde-rapide', Icon: Zap, path: 'garde' },
  { key: 'modes.consultation', Icon: Stethoscope },
  { key: 'modes.qui-suis-je', Icon: Brain },
  { key: 'modes.memo', Icon: Puzzle },
  { key: 'modes.auscultation', Icon: Ear },
  { key: 'modes.boss', Icon: Crown },
];

export function WingScreen() {
  const { wingId } = useParams();
  const includeDrafts = useSettings((s) => s.settings.includeDrafts);
  const wing = isWingId(wingId) ? wingId : null;

  const cards = useMemo(
    () => (wing ? practiceCards({ wing, mode: 'garde-rapide', includeDrafts: true }) : []),
    [wing],
  );
  const playable = includeDrafts ? cards : cards.filter((c) => c.status === 'validated');
  const drafts = cards.filter((c) => c.status === 'draft').length;

  const stats = useLiveQuery(async () => {
    const states = await loadSrsStates(cards.map((c) => c.id));
    const today = toDayString(new Date());
    const all = [...states.values()];
    return { due: all.filter((s) => isDue(s, today)).length, mastered: all.filter(isMastered).length };
  }, [cards]);

  if (!wing) {
    return (
      <>
        <ScreenHeader />
        <p className="glass pointer-events-auto m-4 rounded-2xl p-4">{t('wing.notFound')}</p>
      </>
    );
  }

  const mastery = cards.length ? Math.round(((stats?.mastered ?? 0) / cards.length) * 100) : 0;

  return (
    <>
      <ScreenHeader />
      <h1 className="diorama-title mt-3 px-4 text-center text-4xl sm:text-6xl">
        {tDynamic(`wings.${wing}.title`)}
      </h1>
      <div className="flex-1" />
      <motion.div
        className="pointer-events-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <GlassCard className="mx-auto max-w-xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-lg font-extrabold">{tDynamic(`wings.${wing}.name`)}</h2>
            <Badge>{t('wing.cards', { count: playable.length })}</Badge>
            {drafts > 0 && <Badge tone="draft">{t('wing.drafts', { count: drafts })}</Badge>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-surface-strong p-3">
              <div className="text-ink-soft">{t('wing.mastery')}</div>
              <div className="text-2xl font-extrabold">{mastery} %</div>
            </div>
            <div className="rounded-2xl bg-surface-strong p-3">
              <div className="text-ink-soft">{t('wing.due')}</div>
              <div className="text-2xl font-extrabold">{stats?.due ?? 0}</div>
            </div>
          </div>
          <h3 className="mt-4 mb-2 text-sm font-bold text-ink-soft">{t('wing.modes')}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MODES.map(({ key, Icon, path }) =>
              path ? (
                <Link
                  key={key}
                  to={`/${path}/${wing}`}
                  className="toy-btn flex min-h-14 items-center justify-center gap-2 rounded-2xl px-3 font-extrabold"
                >
                  <Icon size={20} aria-hidden />
                  {t(key)}
                </Link>
              ) : (
                <button
                  key={key}
                  type="button"
                  disabled
                  className="toy-btn soft flex min-h-14 flex-col items-center justify-center rounded-2xl px-3 text-sm font-extrabold"
                >
                  <span className="flex items-center gap-1.5">
                    <Icon size={18} aria-hidden />
                    {t(key)}
                  </span>
                  <span className="text-xs font-bold text-ink-soft">{t('wing.comingSoon')}</span>
                </button>
              ),
            )}
          </div>
        </GlassCard>
      </motion.div>
    </>
  );
}

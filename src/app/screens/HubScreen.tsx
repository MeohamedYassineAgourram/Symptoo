import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle2, Stethoscope, Sun, Target, Zap } from 'lucide-react';
import { t } from '../../i18n/t';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import { BottomNav } from '../../ui/BottomNav';
import { useProgress } from '../../stores/progressStore';
import { useSettings } from '../../stores/settingsStore';
import { useSceneStore } from '../../stores/sceneStore';
import { useWingStatus } from '../../features/progression/useWingStatus';
import { markWingsSeen } from '../../db/repositories';
import { WING_IDS } from '../../content/wings';
import { toDayString } from '../../utils/dates';
import { playSfx } from '../../audio/sfx';
import { VISITE_SIZE } from '../constants';


export function HubScreen() {
  const navigate = useNavigate();
  const progress = useProgress((s) => s.progress);
  const loaded = useProgress((s) => s.loaded);
  const setProgress = useProgress((s) => s.set);
  const dailyGoal = useSettings((s) => s.settings.dailyGoal);
  const status = useWingStatus();
  const setHub = useSceneStore((s) => s.setHub);
  const today = toDayString(new Date());
  const visiteDone = progress.lastVisiteDay === today;
  const dailyCount = progress.daily[today] ?? 0;

  // Wings opened by XP whose unlock animation hasn't been shown yet.
  const celebrate = useMemo(
    () => (loaded ? WING_IDS.filter((w) => status[w].unlockXp > 0 && progress.xp >= status[w].unlockXp && !progress.seenWings.includes(w)) : []),
    [loaded, status, progress.xp, progress.seenWings],
  );

  useEffect(() => {
    setHub({
      locked: WING_IDS.filter((w) => !status[w].unlocked),
      tiers: Object.fromEntries(WING_IDS.map((w) => [w, status[w].tier])),
      celebrate,
    });
  }, [status, celebrate, setHub]);

  useEffect(() => {
    if (!celebrate.length) return;
    playSfx('unlock');
    const id = setTimeout(() => {
      markWingsSeen(celebrate).then(setProgress).catch(() => undefined);
    }, 2800);
    return () => clearTimeout(id);
  }, [celebrate, setProgress]);

  return (
    <>
      <TopBar />
      <div className="mt-4 px-4 text-center sm:mt-6">
        <h1 className="diorama-title text-5xl sm:text-7xl">{t('app.hospital')}</h1>
        <p className="mt-1 text-sm font-bold text-ink-soft">{t('hub.tapWing')}</p>
      </div>
      <div className="flex-1" />
      <motion.div
        className="pointer-events-auto mb-3 flex flex-col items-center gap-2 px-4"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {visiteDone ? (
          <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold text-success">
            <CheckCircle2 size={14} aria-hidden />
            {t('hub.visiteDone')}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/visite')}
            data-testid="visite-button"
            className="toy-btn soft flex min-h-11 items-center gap-2 rounded-2xl px-4 py-1.5 text-left"
          >
            <Sun size={20} className="text-gold" aria-hidden />
            <span>
              <span className="block text-sm font-extrabold">{t('hub.visite')}</span>
              <span className="block text-xs font-bold text-ink-soft">{t('hub.visiteHint', { n: VISITE_SIZE })}</span>
            </span>
          </button>
        )}
        <Button variant="gold" size="lg" icon={<Stethoscope size={22} aria-hidden />} onClick={() => navigate('/consultation/toutes')}>
          {t('hub.start')}
        </Button>
        <div className="flex items-center gap-2">
          <span className="glass inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-extrabold" aria-label={t('hub.goal')} data-testid="daily-goal">
            <Target size={14} className={dailyCount >= dailyGoal ? 'text-success' : 'text-accent'} aria-hidden />
            {Math.min(dailyCount, dailyGoal)}/{dailyGoal}
          </span>
          <button
            type="button"
            onClick={() => navigate('/garde/toutes')}
            className="glass inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-extrabold text-accent"
          >
            <Zap size={14} aria-hidden />
            {t('hub.quick')}
          </button>
        </div>
      </motion.div>
      <BottomNav />
    </>
  );
}

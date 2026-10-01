import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion } from 'motion/react';
import { Coins, Crown, Flame, Sparkles, Target, Unlock } from 'lucide-react';
import { t, tDynamic } from '../i18n/t';
import { useRewards } from '../stores/rewardStore';
import { rankFor } from '../features/progression/ranks';
import { newlyUnlockedModes } from '../features/progression/unlocks';
import { ACHIEVEMENTS } from '../features/progression/achievements';
import { playSfx } from '../audio/sfx';
import { Button } from './Button';
import { Confetti } from './Confetti';

function useCountUp(to: number, delay = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 0.9, delay, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to, delay]);
  return v;
}

const pop = (i: number) => ({
  initial: { opacity: 0, y: 14, scale: 0.92 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 24, delay: 0.25 + i * 0.12 },
});

/** Celebrates a finished session: XP, Dirhams, streak, rank-up, unlocks, achievements (README §6). */
export function RewardOverlay() {
  const r = useRewards((s) => s.queue[0]);
  const shift = useRewards((s) => s.shift);
  const xp = useCountUp(r?.xp ?? 0, 0.2);
  const dh = useCountUp(r?.dh ?? 0, 0.45);

  useEffect(() => {
    if (!r) return;
    playSfx('xp');
    const timers = [
      setTimeout(() => r.dh && playSfx('coin'), 450),
      setTimeout(() => r.streak && playSfx('streak'), 700),
      setTimeout(() => r.rankUps.length && playSfx('rank-up'), 900),
      setTimeout(() => (r.achievements.length || r.wings.length) && playSfx('achievement'), 1100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [r]);

  const before = r ? rankFor(r.xpBefore) : null;
  const after = r ? rankFor(r.xpAfter) : null;
  const modes = r ? newlyUnlockedModes(r.xpBefore, r.xpAfter) : [];
  const celebrate = !!r && (r.rankUps.length > 0 || r.achievements.length > 0 || r.wings.length > 0 || r.record);
  let i = 0;

  return (
    <AnimatePresence>
      {r && before && after && (
        <motion.div
          key={`${r.xpBefore}-${r.xpAfter}`}
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={t('reward.title')}
          data-testid="reward-overlay"
        >
          {celebrate && <Confetti />}
          <motion.div
            className="glass max-h-full w-full max-w-md overflow-y-auto rounded-3xl p-5"
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <h2 className="diorama-title text-center text-3xl">{t('reward.title')}</h2>
            {r.record && (
              <motion.p {...pop(i++)} className="mt-1 text-center text-sm font-extrabold text-gold">
                🏆 {t('reward.record')}
              </motion.p>
            )}

            {r.rankUps.length > 0 && (
              <motion.div {...pop(i++)} className="mt-3 rounded-2xl bg-gold p-3 text-center text-[#3b2a05]" data-testid="reward-rankup">
                <Crown className="mx-auto" size={30} aria-hidden />
                <p className="text-xl font-extrabold">{t('reward.rankUp')}</p>
                <p className="font-bold">{t('reward.rankUpBody', { rank: tDynamic(`ranks.${after.id}`) })}</p>
              </motion.div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <motion.div {...pop(i++)} className="rounded-2xl bg-surface-strong p-3 text-center">
                <Sparkles className="mx-auto text-accent" size={22} aria-hidden />
                <div className="text-3xl font-extrabold text-accent tabular-nums" data-testid="reward-xp">+{xp}</div>
                <div className="text-xs font-bold text-ink-soft">{t('reward.xp')}</div>
              </motion.div>
              <motion.div {...pop(i++)} className="rounded-2xl bg-surface-strong p-3 text-center">
                <motion.span className="inline-block" animate={{ rotateY: [0, 360] }} transition={{ duration: 0.8, delay: 0.5 }}>
                  <Coins className="mx-auto text-gold" size={22} aria-hidden />
                </motion.span>
                <div className="text-3xl font-extrabold text-gold tabular-nums">+{dh}</div>
                <div className="text-xs font-bold text-ink-soft">{t('reward.dh')}</div>
              </motion.div>
            </div>

            {/* Progress toward the next rank */}
            <motion.div {...pop(i++)} className="mt-3">
              <div className="flex justify-between text-xs font-bold text-ink-soft">
                <span>{tDynamic(`ranks.${after.id}`)}</span>
                <span>{r.xpAfter} XP</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--ink)_12%,transparent)]">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: `${(r.rankUps.length ? 0 : before.ratio) * 100}%` }}
                  animate={{ width: `${after.ratio * 100}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                />
              </div>
              {after.next !== null && (
                <p className="mt-1 text-xs text-ink-soft">
                  {t('reward.toNext', { n: after.next - r.xpAfter, rank: tDynamic(`ranks.${rankFor(after.next).id}`) })}
                </p>
              )}
            </motion.div>

            {r.streak && (
              <motion.div {...pop(i++)} className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-strong p-3">
                <motion.span animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 0.6, delay: 0.8 }}>
                  <Flame className="text-gold" size={28} aria-hidden />
                </motion.span>
                <div>
                  <p className="font-extrabold">{t('reward.streakUp')}</p>
                  <p className="text-sm text-ink-soft">{t('reward.streak', { n: r.streak.after })}</p>
                  {r.streak.usedTeas > 0 && <p className="text-xs text-ink-soft">🍵 {t('reward.teaUsed', { n: r.streak.usedTeas })}</p>}
                </div>
              </motion.div>
            )}

            {r.wings.map((w) => (
              <motion.div key={w} {...pop(i++)} className="mt-3 flex items-center gap-3 rounded-2xl bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] p-3">
                <Unlock className="text-accent" size={24} aria-hidden />
                <div>
                  <p className="text-xs font-bold text-ink-soft">{t('reward.newWing')}</p>
                  <p className="font-extrabold">{tDynamic(`wings.${w}.name`)}</p>
                </div>
              </motion.div>
            ))}
            {modes.map((m) => (
              <motion.div key={m} {...pop(i++)} className="mt-3 flex items-center gap-3 rounded-2xl bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] p-3">
                <Unlock className="text-accent" size={22} aria-hidden />
                <div>
                  <p className="text-xs font-bold text-ink-soft">{t('reward.newMode')}</p>
                  <p className="font-extrabold">{tDynamic(`modes.${m}`)}</p>
                </div>
              </motion.div>
            ))}

            {r.achievements.map((id) => (
              <motion.div key={id} {...pop(i++)} className="mt-3 flex items-center gap-3 rounded-2xl bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] p-3" data-testid="reward-achievement">
                <span className="text-2xl" aria-hidden>
                  {ACHIEVEMENTS.find((a) => a.id === id)?.icon}
                </span>
                <div>
                  <p className="text-xs font-bold text-ink-soft">{t('reward.achievement')}</p>
                  <p className="font-extrabold">{tDynamic(`achievements.${id}.name`)}</p>
                </div>
              </motion.div>
            ))}
            {r.achievementDh > 0 && <p className="mt-1 text-right text-xs font-bold text-gold">{t('reward.achievementDh', { n: r.achievementDh })}</p>}

            <motion.div {...pop(i++)} className="mt-3 flex items-center gap-2 text-sm">
              <Target size={18} className="text-accent" aria-hidden />
              <span className="font-bold">{r.daily.count >= r.daily.goal ? t('reward.dailyDone') : t('reward.daily')}</span>
              <span className="ml-auto font-extrabold tabular-nums">
                {Math.min(r.daily.count, r.daily.goal)}/{r.daily.goal}
              </span>
            </motion.div>

            <Button size="lg" className="mt-4 w-full" onClick={shift} data-testid="reward-continue">
              {t('reward.continue')}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

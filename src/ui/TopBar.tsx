import { Link } from 'react-router';
import { Coins, Flame, Settings } from 'lucide-react';
import { t, tDynamic } from '../i18n/t';
import { useProgress } from '../stores/progressStore';
import { rankFor } from '../features/progression/ranks';

export function TopBar() {
  const { xp, dirhams, streak } = useProgress((s) => s.progress);
  const rank = rankFor(xp);

  return (
    <header className="pointer-events-auto flex items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="glass flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold">{tDynamic(`ranks.${rank.id}`)}</div>
          <div
            className="mt-1 h-2 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--ink)_12%,transparent)]"
            role="progressbar"
            aria-label={t('topbar.xp')}
            aria-valuemin={rank.floor}
            aria-valuemax={rank.next ?? rank.floor}
            aria-valuenow={xp}
          >
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${rank.ratio * 100}%` }} />
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-ink-soft">
          {xp} {t('topbar.xp')}
        </span>
      </div>
      <div className="glass flex items-center gap-1 rounded-2xl px-3 py-2 font-extrabold" aria-label={t('topbar.dirhams')}>
        <Coins size={18} className="text-gold" aria-hidden />
        {dirhams}
      </div>
      <div className="glass flex items-center gap-1 rounded-2xl px-3 py-2 font-extrabold" aria-label={t('topbar.streak')}>
        <Flame size={18} className="text-gold" aria-hidden />
        {streak}
      </div>
      <Link
        to="/parametres"
        className="glass flex h-11 w-11 items-center justify-center rounded-2xl"
        aria-label={t('topbar.settings')}
      >
        <Settings size={20} aria-hidden />
      </Link>
    </header>
  );
}

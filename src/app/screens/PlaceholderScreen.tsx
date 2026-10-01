import { Hammer } from 'lucide-react';
import { t } from '../../i18n/t';
import { GlassCard } from '../../ui/GlassCard';
import { BottomNav } from '../../ui/BottomNav';
import { TopBar } from '../../ui/TopBar';

export function PlaceholderScreen() {
  return (
    <>
      <TopBar />
      <div className="flex flex-1 items-center justify-center p-4">
        <GlassCard className="pointer-events-auto max-w-sm p-6 text-center">
          <Hammer className="mx-auto mb-2 text-gold" size={32} aria-hidden />
          <h1 className="text-xl font-extrabold">{t('placeholder.title')}</h1>
          <p className="mt-1 text-ink-soft">{t('placeholder.body')}</p>
        </GlassCard>
      </div>
      <BottomNav />
    </>
  );
}

import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Stethoscope, Zap } from 'lucide-react';
import { t } from '../../i18n/t';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import { BottomNav } from '../../ui/BottomNav';

export function HubScreen() {
  const navigate = useNavigate();
  return (
    <>
      <TopBar />
      <div className="mt-4 px-4 text-center sm:mt-6">
        <h1 className="diorama-title text-5xl sm:text-7xl">{t('app.hospital')}</h1>
        <p className="mt-1 text-sm font-bold text-ink-soft">{t('hub.tapWing')}</p>
      </div>
      <div className="flex-1" />
      <motion.div
        className="pointer-events-auto mb-3 flex flex-col items-center gap-1 px-4"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <Button
          variant="gold"
          size="lg"
          icon={<Stethoscope size={22} aria-hidden />}
          onClick={() => navigate('/consultation/toutes')}
        >
          {t('hub.start')}
        </Button>
        <div className="flex items-center gap-2">
          <span className="glass rounded-full px-3 py-0.5 text-xs font-bold text-ink-soft">{t('hub.startHint')}</span>
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

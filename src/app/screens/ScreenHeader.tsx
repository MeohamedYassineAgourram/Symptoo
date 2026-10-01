import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { t } from '../../i18n/t';

export function ScreenHeader({ to = '/', label = t('nav.backToHub') }: { to?: string; label?: string }) {
  return (
    <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <Link
        to={to}
        className="glass pointer-events-auto inline-flex min-h-11 items-center gap-1 rounded-2xl pr-4 pl-2 font-bold"
      >
        <ChevronLeft size={22} aria-hidden />
        {label}
      </Link>
    </div>
  );
}

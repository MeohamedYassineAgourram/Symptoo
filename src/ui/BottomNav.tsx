import { NavLink } from 'react-router';
import { CalendarDays, Home, Layers, Shirt, UserRound } from 'lucide-react';
import { t, type I18nKey } from '../i18n/t';

const ITEMS: { to: string; label: I18nKey; Icon: typeof Home }[] = [
  { to: '/', label: 'nav.accueil', Icon: Home },
  { to: '/agenda', label: 'nav.agenda', Icon: CalendarDays },
  { to: '/fiches', label: 'nav.fiches', Icon: Layers },
  { to: '/vestiaire', label: 'nav.vestiaire', Icon: Shirt },
  { to: '/profil', label: 'nav.profil', Icon: UserRound },
];

export function BottomNav() {
  return (
    <nav className="pointer-events-auto px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
      <ul className="glass mx-auto flex max-w-md justify-between rounded-3xl px-2 py-1.5">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                `flex min-h-12 min-w-14 flex-col items-center justify-center rounded-2xl px-2 text-xs font-bold transition-colors ${
                  isActive ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'
                }`
              }
            >
              <Icon size={20} aria-hidden />
              {t(label)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

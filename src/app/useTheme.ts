import { useEffect } from 'react';
import { useSettings } from '../stores/settingsStore';

/** Applies the theme and reduced-motion settings to <html>, following the OS when "Automatique". */
export function useTheme() {
  const theme = useSettings((s) => s.settings.theme);
  const reducedMotion = useSettings((s) => s.settings.reducedMotion);

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    const osReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.dataset.reducedMotion = String(reducedMotion || osReduced);
  }, [reducedMotion]);
}

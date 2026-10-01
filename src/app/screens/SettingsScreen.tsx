import type { ReactNode } from 'react';
import faculties from '../../config/faculties.json';
import { t } from '../../i18n/t';
import { useSettings } from '../../stores/settingsStore';
import type { QualityPreset, ThemeMode } from '../../stores/settingsTypes';
import { GlassCard } from '../../ui/GlassCard';
import { Segmented } from '../../ui/Segmented';
import { Toggle } from '../../ui/Toggle';
import { ScreenHeader } from './ScreenHeader';

const yearLabel = (n: number) => (n === 1 ? t('settings.year1') : t('settings.yearN', { n }));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <GlassCard className="p-4">
      <h2 className="mb-1 text-sm font-extrabold tracking-wide text-ink-soft uppercase">{title}</h2>
      <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_8%,transparent)]">{children}</div>
    </GlassCard>
  );
}

const selectClass =
  'min-h-11 w-full rounded-xl border-0 bg-surface-strong px-3 font-semibold text-ink shadow-inner focus-visible:outline-3 focus-visible:outline-gold';

export function SettingsScreen() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);

  return (
    <>
      <ScreenHeader />
      <div className="pointer-events-auto mt-3 flex-1 overflow-y-auto px-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-xl flex-col gap-3">
          <h1 className="diorama-title text-center text-4xl">{t('settings.title')}</h1>

          <Section title={t('settings.cursus')}>
            <label className="block py-2">
              <span className="mb-1 block font-semibold">{t('settings.faculty')}</span>
              <select className={selectClass} value={settings.faculty} onChange={(e) => update({ faculty: e.target.value })}>
                {faculties.faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block py-2">
              <span className="mb-1 block font-semibold">{t('settings.year')}</span>
              <select className={selectClass} value={settings.year} onChange={(e) => update({ year: Number(e.target.value) })}>
                {faculties.years.map((y) => (
                  <option key={y} value={y}>
                    {yearLabel(y)}
                  </option>
                ))}
              </select>
            </label>
          </Section>

          <Section title={t('settings.training')}>
            <Toggle
              label={t('settings.includeDrafts')}
              hint={t('settings.includeDraftsHint')}
              checked={settings.includeDrafts}
              onChange={(v) => update({ includeDrafts: v })}
            />
            <Toggle label={t('settings.showDarija')} checked={settings.showDarija} onChange={(v) => update({ showDarija: v })} />
            <Segmented
              label={t('settings.dailyGoal')}
              value={settings.dailyGoal}
              options={[10, 20, 40].map((n) => ({ value: n, label: t('settings.patients', { n }) }))}
              onChange={(v) => update({ dailyGoal: v })}
            />
            <Segmented
              label={`${t('garde.title')} · ${t('garde.duration')}`}
              value={settings.gardeRapideSeconds}
              options={([60, 90] as const).map((n) => ({ value: n, label: t('garde.seconds', { n }) }))}
              onChange={(v) => update({ gardeRapideSeconds: v })}
            />
          </Section>

          <Section title={t('settings.display')}>
            <Segmented<ThemeMode>
              label={t('settings.theme')}
              value={settings.theme}
              options={[
                { value: 'system', label: t('settings.themeSystem') },
                { value: 'light', label: t('settings.themeLight') },
                { value: 'dark', label: t('settings.themeDark') },
              ]}
              onChange={(v) => update({ theme: v })}
            />
            <Segmented<QualityPreset>
              label={t('settings.quality')}
              value={settings.quality}
              options={[
                { value: 'auto', label: t('settings.qualityAuto') },
                { value: 'haute', label: t('settings.qualityHaute') },
                { value: 'moyenne', label: t('settings.qualityMoyenne') },
                { value: 'basse', label: t('settings.qualityBasse') },
              ]}
              onChange={(v) => update({ quality: v })}
            />
            <Toggle label={t('settings.reducedMotion')} checked={settings.reducedMotion} onChange={(v) => update({ reducedMotion: v })} />
          </Section>

          <Section title={t('settings.about')}>
            <p className="py-2 text-sm leading-relaxed">« {t('app.disclaimer')} »</p>
            <p className="py-2 text-sm text-ink-soft">
              {t('app.name')} · {t('settings.version', { v: __APP_VERSION__ })}
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}

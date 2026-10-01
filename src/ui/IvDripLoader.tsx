import { t } from '../i18n/t';

/** Loading indicator styled as an IV drip bag (README §9.1). */
export function IvDripLoader({ label = t('app.loading') }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <svg width="56" height="96" viewBox="0 0 56 96" aria-hidden="true">
        <rect x="8" y="4" width="40" height="46" rx="10" fill="var(--surface-strong)" stroke="var(--ink-soft)" strokeWidth="2.5" />
        <clipPath id="bag">
          <rect x="10" y="6" width="36" height="42" rx="8" />
        </clipPath>
        <g clipPath="url(#bag)">
          <rect x="8" y="16" width="40" height="40" fill="var(--accent)" opacity="0.75">
            <animate attributeName="y" values="16;40;16" dur="2.4s" repeatCount="indefinite" />
          </rect>
        </g>
        <line x1="28" y1="50" x2="28" y2="92" stroke="var(--ink-soft)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="58" r="3" fill="var(--accent)">
          <animate attributeName="cy" values="54;88" dur="0.9s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0" dur="0.9s" repeatCount="indefinite" />
        </circle>
      </svg>
      <span className="font-bold text-ink-soft">{label}</span>
    </div>
  );
}

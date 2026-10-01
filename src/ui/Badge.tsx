import type { ReactNode } from 'react';

const tones = {
  draft: 'bg-[color-mix(in_oklab,var(--gold)_25%,transparent)] text-[color-mix(in_oklab,var(--gold)_45%,var(--ink))]',
  followUp: 'bg-[color-mix(in_oklab,var(--accent)_20%,transparent)] text-accent',
  neutral: 'bg-[color-mix(in_oklab,var(--ink)_10%,transparent)] text-ink-soft',
};

export function Badge({ tone = 'neutral', icon, children }: { tone?: keyof typeof tones; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

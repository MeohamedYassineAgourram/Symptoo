import { MessageCircleQuestion } from 'lucide-react';
import type { ClinicalCase } from '../../../content/schemas';
import { t } from '../../../i18n/t';
import type { RunnerState } from '../caseRunner';

export function InterrogatoirePanel({ c, runner, onAsk }: { c: ClinicalCase; runner: RunnerState; onAsk: (i: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm text-ink-soft">{t('consult.askHint')}</p>
      <ul className="flex flex-col gap-2">
        {c.history.map((h, i) => {
          const asked = runner.asked.includes(i);
          return (
            <li key={i}>
              <button
                type="button"
                disabled={asked}
                onClick={() => onAsk(i)}
                data-testid={`ask-${i}`}
                className={`flex min-h-11 w-full items-start gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold transition-colors ${
                  asked ? 'bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-ink' : 'bg-surface-strong hover:bg-white'
                }`}
              >
                <MessageCircleQuestion size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                <span>{h.q}</span>
              </button>
              {asked && (
                <p className="mt-1 ml-6 rounded-2xl rounded-tl-sm bg-white/90 px-3 py-2 text-sm text-ink shadow-sm dark:bg-white/10">« {h.a} »</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

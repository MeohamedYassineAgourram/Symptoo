import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, BookmarkCheck, Check, ChevronRight, X } from 'lucide-react';
import type { ClinicalCase } from '../../../content/schemas';
import { t, tDynamic } from '../../../i18n/t';
import { isFicheSaved, setFicheSaved } from '../../../db/repositories';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import type { RunnerState } from '../caseRunner';
import type { SynthesisAnswer } from '../synthesis';
import { TOOL_ICONS } from '../zoneTree';

interface FeedbackPanelProps {
  c: ClinicalCase;
  runner: RunnerState;
  answer: SynthesisAnswer | null;
  last: boolean;
  onNext: () => void;
}

function Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <Check size={16} className="shrink-0 text-success" aria-label="✓" />
  ) : (
    <X size={16} className="shrink-0 text-danger" aria-label="✗" />
  );
}

/** Correction, key signs found vs missed, and the fiche mémo (README §5.2 step 5). */
export function FeedbackPanel({ c, runner, answer, last, onNext }: FeedbackPanelProps) {
  const r = runner.result!;
  const s = r.synthesis;
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    isFicheSaved(c.id).then(setSaved).catch(() => undefined);
  }, [c.id]);

  const tone = answer?.gaveUp ? 'gaveUp' : s.syndrome;
  const found = r.keys.filter((k) => k.found);
  const missed = r.keys.filter((k) => !k.found);
  const keyText = (k: (typeof r.keys)[number]) =>
    k.kind === 'history' ? c.history[k.index]!.a : c.exam[k.index]!.finding;
  const keyLabel = (k: (typeof r.keys)[number]) =>
    k.kind === 'history'
      ? t('consult.tabs.interrogatoire')
      : `${TOOL_ICONS[c.exam[k.index]!.tool]} ${tDynamic(`zones.${c.exam[k.index]!.zone.replace(/-\*$/, '')}`)}`;

  return (
    <motion.div className="flex flex-col gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} data-testid="feedback">
      <div
        className={`rounded-2xl p-3 text-white ${tone === 'correct' ? 'bg-success' : tone === 'partial' ? 'bg-gold' : 'bg-[color-mix(in_oklab,var(--danger)_85%,#000)]'}`}
      >
        <p className="text-lg font-extrabold">{t(`consult.result.${tone}`)}</p>
        <p className="text-sm font-bold opacity-95">
          {t('consult.result.score')} : {r.score} · {t('consult.result.time')} : {t('consult.result.minutes', { n: r.minutes })}
        </p>
      </div>
      {c.status === 'draft' && (
        <div>
          <Badge tone="draft">{t('consult.draft')}</Badge>
        </div>
      )}

      <section className="rounded-2xl bg-surface-strong p-3 text-sm">
        <h3 className="mb-1 font-extrabold">{t('consult.result.expected')}</h3>
        <p className="flex items-start gap-1.5">
          <Mark ok={s.syndrome === 'correct'} />
          <span>
            <b>{t('consult.result.syndromes')} :</b> {c.answer.syndrome.join(' + ')}
          </span>
        </p>
        {answer && !answer.gaveUp && (s.extraSyndromes.length > 0 || s.missingSyndromes.length > 0) && (
          <p className="ml-6 text-ink-soft">
            {t('consult.result.yours')} : {answer.syndromes.join(' + ') || '—'}
          </p>
        )}
        {c.answer.etiology && (
          <p className="mt-1 flex items-start gap-1.5">
            <Mark ok={s.etiology === 'correct'} />
            <span>
              <b>{t('consult.result.etiology')} :</b> {c.answer.etiology}
              {answer?.etiology && s.etiology === 'wrong' && <span className="text-ink-soft"> ({t('consult.result.yours')} : {answer.etiology})</span>}
            </span>
          </p>
        )}
        {c.bonusQuestion && (
          <p className="mt-1 flex items-start gap-1.5">
            <Mark ok={s.bonus === 'correct'} />
            <span>
              <b>{t('consult.result.bonus')} :</b> {c.bonusQuestion.options[c.bonusQuestion.correct[0]!]}
            </span>
          </p>
        )}
      </section>

      <section className="text-sm">
        <h3 className="mb-1 font-extrabold text-success">
          {t('consult.result.found')} ({found.length})
        </h3>
        <ul className="flex flex-col gap-1" data-testid="keys-found">
          {found.length === 0 && <li className="text-ink-soft">{t('consult.result.none')}</li>}
          {found.map((k) => (
            <li key={`${k.kind}${k.index}`} className="flex gap-1.5 rounded-xl bg-[color-mix(in_oklab,var(--success)_14%,transparent)] px-2 py-1.5">
              <Mark ok />
              <span>
                <span className="text-xs font-bold text-ink-soft">{keyLabel(k)} — </span>
                {keyText(k)}
              </span>
            </li>
          ))}
        </ul>
        <h3 className="mt-2 mb-1 font-extrabold text-[#c4651f]">
          {t('consult.result.missed')} ({missed.length})
        </h3>
        <ul className="flex flex-col gap-1" data-testid="keys-missed">
          {missed.length === 0 && <li className="text-ink-soft">{t('consult.result.none')}</li>}
          {missed.map((k) => (
            <li key={`${k.kind}${k.index}`} className="flex gap-1.5 rounded-xl bg-[color-mix(in_oklab,#ef8a3c_16%,transparent)] px-2 py-1.5">
              <Mark ok={false} />
              <span>
                <span className="text-xs font-bold text-ink-soft">{keyLabel(k)} — </span>
                {keyText(k)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-ink-soft">{t('consult.result.highlight')}</p>
      </section>

      <section className="rounded-2xl border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] p-3 text-sm">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="font-extrabold">📋 {t('consult.result.fiche')}</h3>
          <button
            type="button"
            onClick={() => {
              setFicheSaved(c.id, !saved).then(() => setSaved(!saved)).catch(() => undefined);
            }}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-accent"
          >
            {saved ? <BookmarkCheck size={18} aria-hidden /> : <Bookmark size={18} aria-hidden />}
            {saved ? t('consult.result.saved') : t('consult.result.save')}
          </button>
        </div>
        <p>{c.teaching}</p>
      </section>

      {r.quality < 3 && <p className="text-sm font-bold text-ink-soft">↻ {t('consult.result.followUpScheduled')}</p>}
      <Button size="lg" onClick={onNext} icon={<ChevronRight size={20} aria-hidden />} data-testid="next-patient">
        {last ? t('consult.result.finish') : t('consult.result.next')}
      </Button>
    </motion.div>
  );
}

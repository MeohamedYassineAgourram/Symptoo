import { useMemo, useState } from 'react';
import { Check, CircleHelp, Search } from 'lucide-react';
import type { ClinicalCase } from '../../../content/schemas';
import { t } from '../../../i18n/t';
import { normalizeText } from '../../../utils/normalize';
import { seededRng } from '../../../utils/random';
import { Button } from '../../../ui/Button';
import { etiologyOptions, syndromeOptions, type SynthesisAnswer } from '../synthesis';

const seedOf = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function SynthesePanel({ c, onSubmit }: { c: ClinicalCase; onSubmit: (a: SynthesisAnswer) => void }) {
  const syndromes = useMemo(() => syndromeOptions(c, seededRng(seedOf(c.id))), [c]);
  const etiologies = useMemo(() => etiologyOptions(c, seededRng(seedOf(c.id) + 1)), [c]);
  const [picked, setPicked] = useState<string[]>([]);
  const [synQuery, setSynQuery] = useState('');
  const [etiology, setEtiology] = useState<string | null>(null);
  const [etiQuery, setEtiQuery] = useState('');
  const [bonus, setBonus] = useState<number | null>(null);
  const [warn, setWarn] = useState(false);

  const filter = (list: string[], q: string) => list.filter((s) => normalizeText(s).includes(normalizeText(q)));
  const shownSyn = filter(syndromes, synQuery);
  const shownEti = filter(etiologies, etiQuery);
  const typed = etiQuery.trim() && !etiologies.some((e) => normalizeText(e) === normalizeText(etiQuery)) ? etiQuery.trim() : null;

  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const submit = () => {
    if (!picked.length) return setWarn(true);
    onSubmit({ syndromes: picked, etiology, bonus: bonus === null ? null : [bonus] });
  };

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="font-extrabold">{t('consult.syndromes')}</h3>
        <p className="mb-2 text-sm text-ink-soft">{t('consult.syndromesHint')}</p>
        <SearchBox value={synQuery} onChange={setSynQuery} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {shownSyn.map((s) => {
            const on = picked.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s)}
                className={`inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold first-letter:uppercase ${
                  on ? 'bg-accent text-white' : 'bg-surface-strong text-ink hover:bg-white'
                }`}
              >
                {on && <Check size={14} aria-hidden />}
                {s}
              </button>
            );
          })}
        </div>
      </section>

      {etiologies.length > 0 && (
        <section>
          <h3 className="font-extrabold">{t('consult.etiology')}</h3>
          <p className="mb-2 text-sm text-ink-soft">{t('consult.etiologyHint')}</p>
          <SearchBox value={etiQuery} onChange={setEtiQuery} />
          <div className="mt-2 flex flex-col gap-1.5" role="radiogroup" aria-label={t('consult.etiology')}>
            {shownEti.map((e) => (
              <Choice key={e} label={e} on={etiology === e} onClick={() => setEtiology(e)} />
            ))}
            {typed && <Choice label={t('consult.typed', { text: typed })} on={etiology === typed} onClick={() => setEtiology(typed)} />}
          </div>
        </section>
      )}

      {c.bonusQuestion && (
        <section>
          <h3 className="font-extrabold">{t('consult.bonus')}</h3>
          <p className="mb-2 text-sm font-semibold">{c.bonusQuestion.question}</p>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={t('consult.bonus')}>
            {c.bonusQuestion.options.map((o, i) => (
              <Choice key={o} label={o} on={bonus === i} onClick={() => setBonus(i)} />
            ))}
          </div>
        </section>
      )}

      {warn && !picked.length && <p className="text-sm font-bold text-danger">{t('consult.needSyndrome')}</p>}
      <div className="flex flex-wrap gap-2 pb-2">
        <Button className="flex-1" onClick={submit} data-testid="submit-diagnosis">
          {t('consult.submit')}
        </Button>
        <Button variant="soft" icon={<CircleHelp size={18} aria-hidden />} onClick={() => onSubmit({ syndromes: [], etiology: null, bonus: null, gaveUp: true })}>
          {t('consult.dontKnow')}
        </Button>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-2 rounded-xl bg-surface-strong px-3">
      <Search size={16} className="text-ink-soft" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('consult.search')}
        className="w-full bg-transparent text-sm text-ink outline-none"
      />
    </label>
  );
}

function Choice({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold ${
        on ? 'bg-accent text-white' : 'bg-surface-strong text-ink hover:bg-white'
      }`}
    >
      <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${on ? 'border-white bg-white/40' : 'border-ink-soft'}`} aria-hidden />
      {label}
    </button>
  );
}

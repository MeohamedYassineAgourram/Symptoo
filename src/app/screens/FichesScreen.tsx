import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronDown, Search, Star } from 'lucide-react';
import { allCards, allCases } from '../../content';
import { WING_IDS, type WingId } from '../../content/wings';
import { db } from '../../db/db';
import { setFicheSaved } from '../../db/repositories';
import { t, tDynamic } from '../../i18n/t';
import { isMastered, type SrsState } from '../../features/srs/engine';
import { normalizeText } from '../../utils/normalize';
import { parseDay } from '../../utils/dates';
import { GlassCard } from '../../ui/GlassCard';
import { Badge } from '../../ui/Badge';
import { TopBar } from '../../ui/TopBar';
import { BottomNav } from '../../ui/BottomNav';

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

interface Row {
  id: string;
  wing: WingId;
  title: string;
  answer: string;
  detail?: string;
  draft: boolean;
  isCase: boolean;
}

const ROWS: Row[] = [
  ...allCards.map((c) => ({ id: c.id, wing: c.wing, title: c.front, answer: c.term ? `${c.term} — ${c.back}` : c.back, detail: c.explanation, draft: c.status === 'draft', isCase: false })),
  ...allCases.map((c) => ({
    id: c.id,
    wing: c.wing,
    title: `${c.patient.name}, ${c.patient.age} ans — ${c.chiefComplaint}`,
    answer: [c.answer.syndrome.join(' + '), c.answer.etiology].filter(Boolean).join(' — '),
    detail: c.teaching,
    draft: c.status === 'draft',
    isCase: true,
  })),
];

/** Mes fiches: every item seen, searchable and filterable; star items and read the fiche mémo (README §9). */
export function FichesScreen() {
  const states = useLiveQuery(() => db.srs.toArray(), [], [] as SrsState[]);
  const starred = useLiveQuery(async () => new Set((await db.fiches.toArray()).map((f) => f.itemId)), [], new Set<string>());
  const [query, setQuery] = useState('');
  const [wing, setWing] = useState<WingId | 'toutes'>('toutes');
  const [scope, setScope] = useState<'seen' | 'starred' | 'all'>('seen');
  const [open, setOpen] = useState<string | null>(null);
  const byId = useMemo(() => new Map(states.map((s) => [s.itemId, s])), [states]);

  const rows = ROWS.filter((r) => {
    if (wing !== 'toutes' && r.wing !== wing) return false;
    if (scope === 'seen' && !byId.has(r.id)) return false;
    if (scope === 'starred' && !starred.has(r.id)) return false;
    const q = normalizeText(query);
    return !q || normalizeText(`${r.title} ${r.answer}`).includes(q);
  });

  const statusOf = (id: string) => {
    const s = byId.get(id);
    return !s ? 'new' : isMastered(s) ? 'mastered' : 'learning';
  };

  return (
    <>
      <TopBar />
      <div className="pointer-events-auto mt-3 flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <h1 className="diorama-title text-center text-4xl">{t('fiches.title')}</h1>
          <GlassCard className="flex flex-col gap-2 p-3">
            <label className="flex min-h-11 items-center gap-2 rounded-xl bg-surface-strong px-3">
              <Search size={16} className="text-ink-soft" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('fiches.search')} className="w-full bg-transparent text-sm text-ink outline-none" />
            </label>
            <div className="flex flex-wrap gap-2">
              <select value={wing} onChange={(e) => setWing(e.target.value as WingId | 'toutes')} className="min-h-11 rounded-xl bg-surface-strong px-2 text-sm font-bold text-ink" aria-label={t('fiches.allWings')}>
                <option value="toutes">{t('fiches.allWings')}</option>
                {WING_IDS.map((w) => (
                  <option key={w} value={w}>
                    {tDynamic(`wings.${w}.name`)}
                  </option>
                ))}
              </select>
              {(['seen', 'starred', 'all'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={scope === s}
                  onClick={() => setScope(s)}
                  className={`min-h-11 rounded-xl px-3 text-sm font-bold ${scope === s ? 'bg-accent text-white' : 'bg-surface-strong text-ink'}`}
                >
                  {s === 'seen' ? t('fiches.seenOnly') : s === 'starred' ? t('fiches.starred') : t('fiches.all')}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-ink-soft">{t('fiches.count', { n: rows.length })}</p>
          </GlassCard>

          {rows.length === 0 && <GlassCard className="p-4 text-center text-ink-soft">{t('fiches.none')}</GlassCard>}
          <ul className="flex flex-col gap-2" data-testid="fiches-list">
            {rows.slice(0, 200).map((r) => {
              const status = statusOf(r.id);
              const s = byId.get(r.id);
              const isOpen = open === r.id;
              const star = starred.has(r.id);
              return (
                <li key={r.id} className="glass rounded-2xl">
                  <div className="flex items-start gap-1">
                    <button type="button" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen} className="flex min-h-11 flex-1 items-start gap-2 p-3 text-left">
                      <span className="flex-1">
                        <span className="mb-1 flex flex-wrap gap-1">
                          <Badge tone={status === 'mastered' ? 'followUp' : 'neutral'}>{t(`fiches.status.${status}`)}</Badge>
                          {r.isCase && <Badge>{t('fiches.case')}</Badge>}
                          {r.draft && <Badge tone="draft">{t('fiches.draft')}</Badge>}
                          <Badge>{tDynamic(`wings.${r.wing}.name`)}</Badge>
                        </span>
                        <span className="block text-sm font-bold">{r.title}</span>
                      </span>
                      <ChevronDown size={18} className={`mt-1 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void setFicheSaved(r.id, !star)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center"
                      aria-label={star ? t('fiches.unstar') : t('fiches.star')}
                      aria-pressed={star}
                    >
                      <Star size={18} className={star ? 'fill-gold text-gold' : 'text-ink-soft'} aria-hidden />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="border-t border-[color-mix(in_oklab,var(--ink)_8%,transparent)] p-3 text-sm">
                      <p className="font-bold text-accent">{r.answer}</p>
                      {r.detail && <p className="mt-1">📋 {r.detail}</p>}
                      {s && <p className="mt-1 text-xs text-ink-soft">{t('fiches.next', { date: DATE.format(parseDay(s.dueDate)) })}</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
